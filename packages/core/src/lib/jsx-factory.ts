import { effect, isReactive, lift, link, memoize, morph, named, reactive, unreactive } from 'mutts'
import { perf } from '../perf'
import { document } from '../shared'
import {
	CompositeAttributes,
	type CompositeAttributesMeta,
	collapse,
	type PerhapsReactive,
	ReactiveProp,
} from './composite-attributes'
import { perfCounters, pounceOwner, rootComponents, testing } from './debug'
import {
	type Child,
	type Children,
	DynamicRenderingError,
	type Env,
	PounceElement,
	rootEnv,
} from './pounce-element'
import { pounceElement, processChildren, reconcile } from './reconciler'
import { attachAttributes, checkComponentRebuild, isString } from './renderer-internal'
import { defaults, extend } from './utils'

export const intrinsicComponentAliases: Record<string, ComponentFunction> = extend(null, {
	env(props: { children?: any; [key: string]: any }, env: Env) {
		effect.named('attr:env')(() => {
			for (const [key, value] of Object.entries(props)) if (key !== 'children') env[key] = value
		})
		return props.children
	},
	for<T>(
		props: {
			each: PerhapsReactive<readonly T[]>
			children: any
		},
		env: Env
	) {
		if (Array.isArray(props.children) && props.children.length !== 1)
			throw new DynamicRenderingError(
				`[pounce] Invalid children for 'for' component: ${JSON.stringify(props.children)}. Children must evaluate to one function.`
			)
		const body = collapse(Array.isArray(props.children) ? props.children[0] : props.children)
		if (typeof body !== 'function') {
			throw new DynamicRenderingError(
				`[pounce] Invalid children for 'for' component: ${JSON.stringify(props.children)}. Children must evaluate to a function.`
			)
		}
		// Lock to fence on purpose
		const cb = (item: T) => {
			perfCounters.forIterations++
			perf?.mark('for:iter:start')
			const res = (body as (item: T) => Children)(item)
			perf?.mark('for:iter:end')
			perf?.measure('for:iter', 'for:iter:start', 'for:iter:end')
			return res
		}
		const memoizedCb = memoize.lenient(cb)
		// morph and processChildren must be called here (component body, runs once) — NOT inside produce.
		// produce runs inside the render:for effect; any reactive reads there (including processChildren
		// reading the morph cache) would subscribe render:for to array mutations → rebuild fence fires.
		const morphed = morph(() => collapse(props.each), memoizedCb)
		const nodes = lift(() => {
			perf?.mark('for:update:start')
			const res = processChildren(morphed, env)
			perf?.mark('for:update:end')
			perf?.measure('for:update', 'for:update:start', 'for:update:end')
			return res
		})
		return new PounceElement(() => nodes as any, 'for')
	},
	fragment: 'fragment' as any,
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
		env: undefined,
		parent: undefined,
		children: new Set<ComponentInfo>(),
		elements: new Set<Node>(),
	})

	return new PounceElement(
		function componentRender(env: Env) {
			perfCounters.componentRenders++
			perf?.mark(`component:${componentCtor.name}:start`)
			const parent = env.component
			const isRegistered = parent ? parent.children.has(info) : rootComponents.has(info)
			if (info.parent !== parent || !isRegistered) {
				if (info.parent) info.parent.children.delete(info)
				else rootComponents.delete(info)
				info.parent = parent
				if (parent) parent.children.add(info)
				else rootComponents.add(info)
			}

			info.env = extend(env, { component: info })

			checkComponentRebuild(componentCtor)
			testing.renderingEvent?.('render component', componentCtor.name)

			// Component gets the flattened props proxy, potentially restructured for namespaces
			const result = componentCtor(defaults({ children }, inAttrs.asProps()), info.env)
			const processed = processChildren(result, info.env)

			link(processed, () => {
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
	if (tagName === 'dynamic') {
		const tagProp = inAttrs.getSingle('tag')
		const cache = new Map<any, PounceElement>()
		const produce = (tag: any) => {
			let res = cache.get(tag)
			if (!res) {
				res =
					typeof tag === 'function'
						? produceComponent(tag as ComponentFunction, inAttrs, children, meta)
						: produceDOM(tag as string, inAttrs, children, meta)
				cache.set(tag, res)
			}
			return res
		}
		return new PounceElement(
			(env) => {
				const nodes = reactive<Node[]>([])
				link(
					nodes,
					effect(
						named('render:dynamic:internal', () => {
							perf?.mark('dynamic:switch:start')
							const nextNodes = produce(collapse(tagProp)).render(env)
							nodes.splice(0, nodes.length, ...nextNodes)
							perf?.mark('dynamic:switch:end')
							perf?.measure('dynamic:switch', 'dynamic:switch:start', 'dynamic:switch:end')
						})
					)
				)
				return nodes
			},
			'dynamic',
			meta
		)
	}

	const processedChildren =
		Array.isArray(children) && !isReactive(children)
			? children.map((c) => pounceElement(c, rootEnv))
			: []

	const allChildrenStatic =
		processedChildren.length > 0 && processedChildren.every((c) => c.isStatic)

	return new PounceElement(
		function elementRender(env: Env) {
			perfCounters.elementRenders++
			perf?.mark(`element:${tagName}:start`)

			const element = document.createElement(tagName)
			const componentToUse = env.component
			if (componentToUse) {
				pounceOwner.set(element, componentToUse)
				componentToUse.elements.add(element)
			}

			testing.renderingEvent?.('create element', tagName, element)
			link(
				element,
				attachAttributes(element, inAttrs),
				reconcile(element, processChildren(children, env))
			)

			perf?.mark(`element:${tagName}:end`)
			perf?.measure(`element:${tagName}`, `element:${tagName}:start`, `element:${tagName}:end`)

			return element
		},
		tagName,
		meta,
		!inAttrs.isReactive && (processedChildren.length === 0 || allChildrenStatic),
		true
	)
}

export const Fragment = intrinsicComponentAliases.fragment

export const r = <T>(get: () => T, set?: (v: T) => void) => new ReactiveProp(get, set)
