import {
	attend,
	atomic,
	biDi,
	cleanedBy,
	effect,
	getActiveProjection,
	isNonReactive,
	lift,
	memoize,
	project,
	reactive,
	unreactive,
	untracked,
} from 'mutts'
import { perf } from '../perf'
import { document } from '../shared'
import { type ComponentInfo, nf, perfCounters, POUNCE_OWNER, rootComponents, testing } from './debug'
import { restructureProps } from './namespaced'
import {
	type Child,
	type ComponentFunction,
	type ComponentNode,
	DynamicRenderingError,
	PounceElement,
	rootScope,
	type Scope,
} from './pounce-element'
import { reconcile, processChildren } from './reconciler'
import {
	applyStyleProperties,
	checkComponentRebuild,
	isFunction,
	isObject,
	isString,
	isSymbol,
	listen,
	setHtmlProperty,
	valuedAttributeGetter,
} from './renderer-internal'
import { type ClassInput, classNames, type StyleInput, styles } from './styles'
import { asArray, buildTraitChain } from './traits'
import { allPrototypeKeys, extend, forwardProps, propsInto } from './utils'

/**
 * Custom h() function for JSX rendering - returns a PounceElement
 */
export const h = (
	tag: any,
	props: Record<string, any> = {},
	...children: Child[]
): PounceElement => {
	const categories: Record<PropertyKey, any> = {}
	const node: Record<string, any> = {}

	//#region Collect meta properties and categories
	for (const [key, value] of Object.entries(props || {})) {
		if (typeof key !== 'string') continue
		switch (key) {
			case 'this': {
				const setComponent = value?.set
				if (!isFunction(setComponent))
					throw new DynamicRenderingError('`this` attribute must be an L-value (object property)')
				const mountEntry = (v: any) => {
					setComponent(v)
				}
				categories.mount = [mountEntry, ...(categories.mount || [])]
				break
			}
			case 'else': {
				if (value !== true)
					throw new DynamicRenderingError('`else` attribute must not specify a value')
				categories.else = true
				break
			}
			case 'if': {
				categories.condition = valuedAttributeGetter(value)
				break
			}
			case 'use': {
				if (tag === 'for' || tag === 'dynamic' || tag === 'scope' || tag === 'fragment') {
					node[key] = value
					break
				}
				const getter = valuedAttributeGetter(value)
				const mountEntry = isFunction(value) ? (value.length > 0 ? value : value()) : getter()
				if (mountEntry !== undefined) {
					categories.mount = [mountEntry, ...(categories.mount || [])]
				}
				break
			}
			default: {
				const match = key.match(/^([^:]+):(.+)$/)
				if (match && match.length === 3 && ['use', 'if', 'when'].includes(match[1])) {
					const [, category, name] = match
					categories[category] ??= {}
					categories[category][name] = valuedAttributeGetter(value)
				} else {
					node[key] = value
				}
			}
		}
	}

	const collectedCategories = categories
	//#endregion

	if (typeof tag === 'object' && typeof tag.get === 'function') tag = tag.get()
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

	let mountObject: PounceElement
	if (componentCtor) {
		const info: ComponentInfo = unreactive({
			id:
				typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
					? globalThis.crypto.randomUUID()
					: Math.random().toString(36).slice(2),
			name: componentCtor.name,
			ctor: componentCtor,
			props,
			scope: undefined,
			parent: undefined,
			children: new Set<ComponentInfo>(),
			elements: new Set<Node>(),
		})

		mountObject = new PounceElement(
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
				const givenProps = reactive(propsInto(props ?? {}, { children }))
				const result = componentCtor(restructureProps(givenProps), childScope)
				const processed = processChildren([result], childScope)
				untracked(() => {
					for (const node of processed)
						if (node.nodeType === 1)
							(node as Element).setAttribute('data-pounce-component', info.name)
				})
				cleanedBy(processed, () => {
					if (info.parent) info.parent.children.delete(info)
					else rootComponents.delete(info)
				})
				perf?.mark(`component:${componentCtor.name}:end`)
				perf?.measure(`component:${componentCtor.name}`, `component:${componentCtor.name}:start`, `component:${componentCtor.name}:end`)
				return processed
			},
			{ tag }
		)
	} else {
		const element = document.createElement(tag)
		let lastComponent: ComponentInfo | undefined
		const projection = getActiveProjection()
		if (projection) {
			;(element as ComponentNode).__mutts_projection__ = projection
			if (projection.depth > 0)
				element.setAttribute('data-mutts-path', `${projection.depth}:${projection.key ?? '?'}`)
		}
		testing.renderingEvent?.('create element', tag, element)
		if (tag === 'input') node.type ??= 'text'

		// Step 1: separate event handlers (values) from other props (potential getters)
		// propsInto treats functions as getters — event handlers must bypass it
		const { traits: rawTraits, children: _nodeChildren, ...rest } = node
		const events: Record<string, unknown> = {}
		const htmlNode: Record<string, unknown> = {}
		for (const key of Object.keys(rest)) {
			if (typeof key === 'string' && /^on[A-Z]/.test(key)) events[key] = rest[key]
			else htmlNode[key] = rest[key]
		}
		const htmlAttrs = propsInto(htmlNode)

		// Step 2: extend — trait prototype chain
		const resolvedTraits = rawTraits instanceof ReactiveProp ? rawTraits.get() : rawTraits
		const { chain: traitChain, classes: traitClasses, styles: traitStyles } =
			buildTraitChain(resolvedTraits)
		const composed = traitChain ? extend(traitChain, htmlAttrs) : htmlAttrs

		// Accumulated class/style getters that merge trait contributions with props
		// Capture original descriptors before overwriting to avoid self-referencing recursion
		const origClass = Object.getOwnPropertyDescriptor(composed, 'class')
		const origStyle = Object.getOwnPropertyDescriptor(composed, 'style')
		if (traitClasses.length > 0 || origClass) {
			const getBaseClass = origClass?.get ?? (() => undefined)
			Object.defineProperty(composed, 'class', {
				get: () => [...traitClasses, ...asArray(getBaseClass())],
				enumerable: true,
				configurable: true,
			})
		}
		if (traitStyles.length > 0 || origStyle) {
			const getBaseStyle = origStyle?.get ?? (() => undefined)
			Object.defineProperty(composed, 'style', {
				get: () => {
					const base = getBaseStyle()
					return [...traitStyles, ...(Array.isArray(base) ? base : base ? [base] : [])]
				},
				enumerable: true,
				configurable: true,
			})
		}

		// Step 3: attend — per-key reactive DOM binding
		const eventKeys = Object.keys(events)
		cleanedBy(
			element,
			attend(
				() => {
					const keys = new Set(allPrototypeKeys(composed))
					for (const k of eventKeys) keys.add(k)
					return keys
				},
				(key: string) => {
					if (/^on[A-Z]/.test(key)) {
						const eventType = key.slice(2).toLowerCase()
						return effect(function eventEffect() {
							// Read raw value (not through propsInto getter) to avoid calling
							// function-valued handlers. Fall back to composed for trait events.
							const rawValue = events[key] ?? composed[key]
							const handler =
								rawValue instanceof ReactiveProp ? rawValue.get() : rawValue

							if (handler === undefined) return

							const wrappedHandler = atomic(handler)
							return listen(element, eventType, wrappedHandler)
						})
					}

					if (key === 'class') {
						return effect(function classNameEffect() {
							const nextClassName = classNames(composed.class as ClassInput)
							testing.renderingEvent?.('set className', element, nextClassName)
							element.className = nextClassName
						})
					}

					if (key === 'style') {
						return effect(function styleEffect() {
							applyStyleProperties(
								element as HTMLElement,
								styles(composed.style as StyleInput)
							)
						})
					}

					// BiDi binding only for ReactiveProp with explicit .set (L-value bindings)
					const rawValue = htmlNode[key]
					if (rawValue instanceof ReactiveProp && rawValue.set) {
						const binding = {
							get: nf(`get ${tag}:${key}`, rawValue.get as () => unknown),
							set: nf(`set ${tag}:${key}`, rawValue.set as (v: unknown) => void),
						}
						const provide = biDi((v) => setHtmlProperty(element, key, v), binding)

						if (tag === 'input') {
							const input = element as HTMLInputElement
							switch (input.type) {
								case 'checkbox':
								case 'radio':
									if (key === 'checked')
										listen(element, 'input', () => provide(input.checked))
									break
								case 'number':
								case 'range':
									if (key === 'value')
										listen(element, 'input', () => provide(Number(input.value)))
									break
								default:
									if (key === 'value')
										listen(element, 'input', () => provide(input.value))
									break
							}
						} else if (tag === 'textarea') {
							if (key === 'value')
								listen(element, 'input', () => provide((element as HTMLTextAreaElement).value))
						} else if (tag === 'select') {
							if (key === 'value') {
								listen(element, 'change', () => provide((element as HTMLSelectElement).value))
								// Re-apply value after children (<option>) are mounted
								queueMicrotask(() => setHtmlProperty(element, 'value', binding.get()))
							}
						}
						// No cleanup needed — cleanedBy disposes the reactive scope,
						// and DOM listeners die with the element
						return
					}

					// One-way reactive or static prop
					return effect(function propEffect() {
						setHtmlProperty(element, key, composed[key])
					})
				}
			)
		)

		mountObject = new PounceElement(
			function elementRender(scope: Scope = rootScope) {
				perfCounters.elementRenders++
				perf?.mark(`element:${tag}:start`)
				const componentToUse = (scope || rootScope).component
				if (lastComponent !== componentToUse) {
					if (lastComponent) lastComponent.elements.delete(element)
					lastComponent = componentToUse
					if (componentToUse) {
						;(element as ComponentNode)[POUNCE_OWNER] = componentToUse
						componentToUse.elements.add(element)
					} else {
						delete (element as ComponentNode)[POUNCE_OWNER]
					}
				}
				if (children && children.length > 0) {
					const processedChildren = processChildren(children, scope || rootScope)
					cleanedBy(element, reconcile(element, processedChildren))
				}
				perf?.mark(`element:${tag}:end`)
				perf?.measure(`element:${tag}`, `element:${tag}:start`, `element:${tag}:end`)
				return element
			},
			{ tag }
		)
	}
	return Object.defineProperties(mountObject, Object.getOwnPropertyDescriptors(collectedCategories))
}

export const intrinsicComponentAliases: Record<string, Function> = extend(null, {
	scope(props: { children?: any; [key: string]: any }, scope: Scope) {
		effect(function scopeEffect() {
			for (const [key, value] of Object.entries(props)) if (key !== 'children') scope[key] = value
		})
		return props.children
	},
	for<T>(
		props: {
			each: readonly T[]
			children: (item: T, oldItem?: any) => any
		},
		scope: Scope
	) {
		let body = Array.isArray(props.children) ? props.children[0] : props.children
		if (body instanceof ReactiveProp) body = body.get()
		const cb = body as (item: T, oldItem?: Child) => Child
		const memoized = memoize(cb as (item: T & object) => any)
		let forCount = 0
		const compute = () => {
			perfCounters.forIterations++
			const fid = ++forCount
			perf?.mark(`for:${fid}:start`)
			const each = (props as any).each as readonly T[] | undefined
			if (!each) { perf?.mark(`for:${fid}:end`); perf?.measure(`for:${fid}(0)`, `for:${fid}:start`, `for:${fid}:end`); return [] as any[] }
			const result = isNonReactive(each)
				? (each.map((item: T) => cb(item)) as any[])
				: (project(each, ({ value: item, old }) => {
						return isObject(item) || isSymbol(item) || isFunction(item)
							? memoized(item as T & object)
							: cb(item, old as any | undefined)
					}) as any[])
			perf?.mark(`for:${fid}:end`)
			perf?.measure(`for:${fid}(${each.length})`, `for:${fid}:start`, `for:${fid}:end`)
			return result
		}
		return new PounceElement(() => processChildren([r(compute) as Child], scope), { tag: 'dynamic' })
	},
	dynamic(props: { tag: any; children?: any } & Record<string, any>, scope: Scope) {
		let dynCount = 0
		function compute(): any[] {
			perfCounters.dynamicSwitches++
			const did = ++dynCount
			perf?.mark(`dynamic:${did}:start`)
			// Resolve the tag identity to track changes.
			let tagValue = isFunction(props.tag) && props.tag.length === 0 ? props.tag() : props.tag

			if (tagValue instanceof ReactiveProp)
				tagValue = tagValue.get()

			const childrenValue = isFunction(props.children) ? props.children() : props.children
			const childArray: any[] = Array.isArray(childrenValue)
				? childrenValue
				: childrenValue === undefined
					? []
					: [childrenValue]

			// Use forwardProps to correctly pass reactive props through the dynamic boundary
			const childProps = forwardProps(props)
			const filteredProps = new Proxy(childProps, {
				get(target, prop) {
					if (prop === 'tag' || prop === 'children') return undefined
					return target[prop as string]
				},
				ownKeys(target) {
					return Reflect.ownKeys(target).filter((k) => k !== 'tag' && k !== 'children')
				},
				getOwnPropertyDescriptor(target, prop) {
					if (prop === 'tag' || prop === 'children') return undefined
					const desc = Object.getOwnPropertyDescriptor(target, prop)
					if (desc) return desc
					if (prop in target) {
						return {
							enumerable: true,
							configurable: true,
							get: () => target[prop as string],
							set: (value) => {
								target[prop as string] = value
							},
						}
					}
					return undefined
				},
			})

			const output = h(tagValue, filteredProps, ...childArray).render(scope)
			return Array.isArray(output) ? output : [output]
		}

		return lift(compute)
	},
	fragment(props: { children: PounceElement[] }, scope: Scope) {
		return new PounceElement(() => processChildren(props.children, scope), { tag: 'fragment' })
	},
})

export const Fragment = intrinsicComponentAliases.fragment

export class ReactiveProp<T> {
	constructor(
		public get: () => T,
		public set?: (v: T) => void
	) {}
}

export const r = <T>(get: () => T, set?: (v: T) => void) => new ReactiveProp(get, set)
