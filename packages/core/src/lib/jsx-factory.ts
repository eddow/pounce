import {
	caught,
	effect,
	isReactive,
	lift,
	link,
	memoize,
	morph,
	reactive,
	type ScopedCallback,
	unreactive,
} from 'mutts'
import { perf } from '../perf'
import { document } from '../shared'
import {
	CompositeAttributes,
	type CompositeAttributesMeta,
	collapse,
	fromAttribute,
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
import { extend } from './utils'

export const intrinsicComponentAliases = extend(null, {
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
	fragment(props: { children: PounceElement[] }, env: Env) {
		return new PounceElement(() => processChildren(props.children, env), 'fragment')
	},
	try(
		props: {
			catch?: (error: unknown, resetCb?: () => void) => any
			children: Children
		},
		_env: Env
	) {
		return new PounceElement((env) => {
			const CatchComponent = props.catch || env.catch
			if (!CatchComponent) {
				throw new Error('No catch component provided')
			}
			const result = reactive({ error: undefined as any })

			let partial: Node | readonly Node[] | undefined
			let stopRender: ScopedCallback | undefined
			function tryAgain() {
				stopRender?.()
				stopRender = effect.named('try:render')(() => {
					result.error = undefined
					caught((error) => {
						result.error = unreactive(
							pounceElement(CatchComponent(error, tryAgain), env).render(
								Object.create(env, { catch: { value: undefined } })
							)
						)
					})

					partial = processChildren(props.children, env)
				})
			}
			tryAgain()
			const rv = lift(() => {
				const src = result.error ?? partial
				return Array.isArray(src) ? src : [src]
			}) as any

			return link(rv, () => stopRender?.())
		}, 'try')
	},
	dynamic(props: { children?: any; [key: string]: any }, env: Env) {
		const inAttrs = (props as any)[fromAttribute] as CompositeAttributes
		const tagProp = inAttrs.getSingle('tag', true)

		const nodes = lift(() => {
			perf?.mark('dynamic:switch:start')
			const tag = collapse(tagProp)
			let res: any
			if (!tag) {
				res = []
			} else {
				const childArgs = Array.isArray(props.children) ? props.children : [props.children]
				res = h(tag, inAttrs, ...childArgs).render(env)
			}
			perf?.mark('dynamic:switch:end')
			perf?.measure('dynamic:switch', 'dynamic:switch:start', 'dynamic:switch:end')
			return res
		})
		return new PounceElement(() => nodes as any, 'dynamic')
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

	const resolvedTag =
		isString(tag) && tag in intrinsicComponentAliases
			? (intrinsicComponentAliases as any)[tag as string]
			: tag

	const isDynamicWrapper = resolvedTag === intrinsicComponentAliases.dynamic
	const meta: CompositeAttributesMeta = isDynamicWrapper
		? {
				guards: inAttrs.extractGuards(),
				directives: () => ({ this: new Set<any>(), use: new Set<any>(), named: undefined }),
			}
		: inAttrs.retrieveMeta()
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
			const result = componentCtor(inAttrs.asProps({ children }), info.env)
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
const namespaceTagMap: Record<string, string> = {
	svg: 'http://www.w3.org/2000/svg',
	math: 'http://www.w3.org/1998/Math/MathML',
}

export function produceDOM(
	tagName: string,
	inAttrs: CompositeAttributes,
	children: Children,
	meta: CompositeAttributesMeta
): PounceElement {
	const processedChildren =
		Array.isArray(children) && !isReactive(children)
			? children.map((c) => pounceElement(c, rootEnv))
			: []

	const allChildrenStatic =
		processedChildren.length > 0 && processedChildren.every((c) => c.isReactivityLeaf)

	return new PounceElement(
		function elementRender(env: Env) {
			perfCounters.elementRenders++
			perf?.mark(`element:${tagName}:start`)

			const namespace = namespaceTagMap[tagName]
			const element = namespace
				? document.createElementNS(namespace, tagName)
				: document.createElement(tagName)
			const componentToUse = env.component
			if (componentToUse) {
				pounceOwner.set(element, componentToUse)
				componentToUse.elements.add(element)
			}

			testing.renderingEvent?.('create element', tagName, element)
			link(
				element,
				// Order is important for `select` - cannot se the value if no children
				reconcile(element, processChildren(children, env)),
				attachAttributes(element, inAttrs)
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
