import { cleanedBy, effect, lift, memoize, morph, unreactive } from 'mutts'
import { perf } from '../perf'
import { document } from '../shared'
import {
	CompositeAttributes,
	type CompositeAttributesMeta,
	collapse,
	type PerhapsReactive,
	ReactiveProp,
} from './composite-attributes'
import { type ComponentInfo, POUNCE_OWNER, perfCounters, rootComponents, testing } from './debug'
import {
	type Child,
	type Children,
	type ComponentFunction,
	type ComponentNode,
	DynamicRenderingError,
	PounceElement,
	rootScope,
	type Scope,
} from './pounce-element'
import { processChildren, reconcile } from './reconciler'
import { attachAttributes, checkComponentRebuild, isString } from './renderer-internal'
import { extend } from './utils'

export const intrinsicComponentAliases: Record<string, ComponentFunction> = extend(null, {
	scope(props: { children?: any; [key: string]: any }, scope: Scope) {
		effect(function scopeEffect() {
			for (const [key, value] of Object.entries(props)) if (key !== 'children') scope[key] = value
		})
		return props.children
	},
	for<T>(
		props: {
			each: PerhapsReactive<readonly T[]>
			children: any
		},
		scope: Scope
	) {
		if (Array.isArray(props.children) && props.children.length !== 1)
			throw new DynamicRenderingError(
				`[pounce] Invalid children for 'for' component: ${JSON.stringify(props.children)}. Children must evaluate to one function.`
			)
		let body = collapse(Array.isArray(props.children) ? props.children[0] : props.children)
		if (typeof body !== 'function') {
			throw new DynamicRenderingError(
				`[pounce] Invalid children for 'for' component: ${JSON.stringify(props.children)}. Children must evaluate to a function.`
			)
		}
		// Lock to fence on purpose
		const cb = memoize.lenient(body as (item: T) => Children)
		return new PounceElement(
			() =>
				processChildren(
					morph(()=> collapse(props.each), cb),
					scope
				),
			'for'
		)
	},
	dynamic(props: { tag: any; children?: any } & Record<string, any>, _scope: Scope) {
		return lift(() => produceDOM(props.tag, Object.getPrototypeOf(props), props.children, {}))
	},
	fragment(props: { children: PounceElement[] }, scope: Scope) {
		return new PounceElement(() => processChildren(props.children, scope), 'fragment')
	},
})

/**
 * Custom h() function for JSX rendering - returns a PounceElement
 */
export const h = (
	tag: string | ComponentFunction,
	props: Record<string, any> = {},
	...children: Child[]
): PounceElement => {
	// 1. Wrap (or reuse) CompositeAttributes
	const inAttrs =
		props instanceof CompositeAttributes ? props : new CompositeAttributes(props || {})

	// 2. Extract Meta (Control Flow & Lifecycle & Categories)
	const meta = inAttrs.extractMeta()

	const resolvedTag =
		isString(tag) && tag in intrinsicComponentAliases
			? (intrinsicComponentAliases as any)[tag as string]
			: tag
	const componentCtor = typeof resolvedTag === 'function' && (resolvedTag as ComponentFunction)

	if (!isString(resolvedTag) && !componentCtor) {
		throw new DynamicRenderingError(
			`[pounce] Invalid component tag: ${JSON.stringify(resolvedTag)}. Tag must be a string (intrinsic) or a function (component).`
		)
	}

	// 4. Create PounceElement
	return componentCtor
		? produceComponent(componentCtor, inAttrs, children, meta)
		: produceDOM(resolvedTag as string, inAttrs, children, meta)
}

function produceComponent(
	componentCtor: ComponentFunction,
	inAttrs: CompositeAttributes,
	children: Children,
	meta: CompositeAttributesMeta
): PounceElement {
	const info: ComponentInfo = unreactive({
		id:
			typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
				? globalThis.crypto.randomUUID()
				: Math.random().toString(36).slice(2),
		name: componentCtor.name,
		ctor: componentCtor,
		props: inAttrs, // Store composite props
		scope: undefined,
		parent: undefined,
		children: new Set<ComponentInfo>(),
		elements: new Set<Node>(),
	})

	return new PounceElement(
		function componentRender(scope: Scope = rootScope) {
			perfCounters.componentRenders++
			perf?.mark(`component:${componentCtor.name}:start`)
			const parent = scope.component
			const isRegistered = parent ? parent.children.has(info) : rootComponents.has(info)
			if (info.parent !== parent || !isRegistered) {
				if (info.parent) info.parent.children.delete(info)
				else rootComponents.delete(info)
				info.parent = parent
				if (parent) parent.children.add(info)
				else rootComponents.add(info)
			}

			const childScope = extend(scope || rootScope, { component: info })
			info.scope = childScope

			checkComponentRebuild(componentCtor)
			testing.renderingEvent?.('render component', componentCtor.name)

			// Component gets the flattened props proxy, potentially restructured for namespaces
			const result = componentCtor(extend(inAttrs.asProps(), { children }), childScope)
			const processed = processChildren(result, childScope)

			cleanedBy(processed, () => {
				if (info.parent) info.parent.children.delete(info)
				else rootComponents.delete(info)
			})

			perf?.mark(`component:${componentCtor.name}:end`)
			perf?.measure(
				`component:${componentCtor.name}`,
				`component:${componentCtor.name}:start`,
				`component:${componentCtor.name}:end`
			)
			return processed
		},
		componentCtor.name,
		meta
	)
}

export function produceDOM(
	tagName: string,
	inAttrs: CompositeAttributes,
	children: Children,
	meta: CompositeAttributesMeta
): PounceElement {
	return new PounceElement(
		function elementRender(scope: Scope) {
			perfCounters.elementRenders++
			perf?.mark(`element:${tagName}:start`)

			const element = document.createElement(tagName)
			const componentToUse = scope.component
			if (componentToUse) {
				;(element as ComponentNode)[POUNCE_OWNER] = componentToUse
				componentToUse.elements.add(element)
			}

			testing.renderingEvent?.('create element', tagName, element)

			attachAttributes(element, inAttrs)

			cleanedBy(element, reconcile(element, processChildren(children, scope)))

			return element
		},
		tagName,
		meta
	)
}

export const Fragment = intrinsicComponentAliases.fragment

export const r = <T>(get: () => T, set?: (v: T) => void) => new ReactiveProp(get, set)
