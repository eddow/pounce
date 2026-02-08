import {
	atomic,
	biDi,
	cleanedBy,
	effect,
	getActiveProjection,
	isNonReactive,
	lift,
	memoize,
	onEffectTrigger,
	project,
	reactive,
	unreactive,
} from 'mutts'
import { crypto, document } from '../shared'
import { type ComponentInfo, namedEffect, nf, POUNCE_OWNER, rootComponents, testing } from './debug'
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
import { bindChildren, processChildren } from './reconciler'
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
import { extend, forwardProps, propsInto } from './utils'
import { applyVariants } from './variants'

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
				typeof crypto !== 'undefined' && crypto?.randomUUID
					? crypto.randomUUID()
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

				const rendered = project.array<null, PounceElement>([null], function componentExecution() {
					checkComponentRebuild(componentCtor)
					testing.renderingEvent?.('render component', componentCtor.name)
					const givenProps = reactive(propsInto(props ?? {}, { children }))
					const result = componentCtor(restructureProps(givenProps), childScope)
					return result
				})
				cleanedBy(rendered, () => {
					if (info.parent) info.parent.children.delete(info)
					else rootComponents.delete(info)
				})
				return processChildren(rendered, childScope)
			},
			{ tag }
		)
	} else {
		const element = document.createElement(tag)
		const varied = lift(() => applyVariants(props ?? {}))
		let lastComponent: ComponentInfo | undefined
		const projection = getActiveProjection()
		if (projection) {
			;(element as ComponentNode).__mutts_projection__ = projection
			element.setAttribute('data-mutts-path', `${projection.depth}:${projection.key ?? '?'}`)
		}
		testing.renderingEvent?.('create element', tag, element)
		if (tag === 'input') props.type ??= 'text'
// TODO: `project` !
		for (const [key, value] of Object.entries(varied)) {
			if (key === 'children') continue
			if (['if', 'else', 'use', 'this'].includes(key)) continue
			if (key.includes(':')) {
				const prefix = key.split(':')[0]
				if (['use', 'if', 'when', 'update'].includes(prefix)) continue
			}

			const runCleanup: (() => void)[] = []

			if (typeof key !== 'string') continue

			if (/^on[A-Z]/.test(key)) {
				const eventType = key.slice(2).toLowerCase()
				const stop = namedEffect(`event:${key}`, () => {
					/*
					 * Event handlers can be:
					 * 1. ReactiveProp: value.get() returns the handler
					 * 2. Static function: value is the handler
					 */
					const handlerCandidate =
						value instanceof ReactiveProp
							? value.get()
							: value

					if (handlerCandidate === undefined) return
					const registeredEvent = atomic(handlerCandidate)
					return listen(element, eventType, registeredEvent)
				})
				cleanedBy(element, stop)
				continue
			}
			if (key === 'class') {
				const getter = valuedAttributeGetter(value)
				const stop = effect(function classNameEffect() {
					const nextClassName = classNames(getter() as ClassInput)
					testing.renderingEvent?.('set className', element, nextClassName)
					element.className = nextClassName
				})
				cleanedBy(element, stop)
				continue
			}
			if (key === 'style') {
				const getter = valuedAttributeGetter(value)
				const stop = effect(function styleEffect() {
					const computedStyles = styles(getter() as StyleInput)
					applyStyleProperties(element as HTMLElement, computedStyles)
				})
				cleanedBy(element, stop)
				continue
			}
			if (value instanceof ReactiveProp) {
				if (value.set) {
					const binding = {
						get: nf(`get ${tag}:${key}`, value.get as () => unknown),
						set: nf(`set ${tag}:${key}`, value.set as (v: unknown) => void),
					}
					const provide = biDi((v) => setHtmlProperty(element, key, v), binding)

					if (tag === 'input') {
						switch ((element as any).type) {
							case 'checkbox':
							case 'radio':
								if (key === 'checked')
									runCleanup.push(listen(element, 'input', () => provide((element as any).checked)))
								break
							case 'number':
							case 'range':
								if (key === 'value')
									runCleanup.push(
										listen(element, 'input', () => provide(Number((element as any).value)))
									)
								break
							default:
								if (key === 'value')
									runCleanup.push(listen(element, 'input', () => provide((element as any).value)))
								break
						}
					}
					cleanedBy(element, () => {
						setHtmlProperty(element, key, undefined)
						for (const stop of runCleanup) stop()
					})
				} else {
					cleanedBy(
						element,
						namedEffect(`prop:${key}`, () => {
							setHtmlProperty(element, key, nf(`${tag}:${key}`, value.get)())
						})
					)
				}
				continue
			}
			setHtmlProperty(element, key, value)
			cleanedBy(element, () => {
				setHtmlProperty(element, key, undefined)
			})
		}

		mountObject = new PounceElement(
			function elementRender(scope: Scope = rootScope) {
				const componentToUse = (scope || rootScope).component
				if (lastComponent !== componentToUse) {
					if (lastComponent) lastComponent.elements.delete(element)
					lastComponent = componentToUse
					if (componentToUse) {
						;(element as ComponentNode)[POUNCE_OWNER] = componentToUse
						componentToUse.elements.add(element)
						element.setAttribute('data-pounce-component', componentToUse.name)
					} else {
						delete (element as ComponentNode)[POUNCE_OWNER]
						element.removeAttribute('data-pounce-component')
					}
				}
				if (children && children.length > 0) {
					const processedChildren = processChildren(children, scope || rootScope)
					cleanedBy(element, bindChildren(element, processedChildren))
				}
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
		const compute = () => {
			const each = (props as any).each as readonly T[] | undefined
			if (!each) return [] as any[]
			return isNonReactive(each)
				? (each.map((item: T) => cb(item)) as any[])
				: (project(each, ({ value: item, old }) => {
						return isObject(item) || isSymbol(item) || isFunction(item)
							? memoized(item as T & object)
							: cb(item, old as any | undefined)
					}) as any[])
		}
		return new PounceElement(() => processChildren([r(compute) as Child], scope), { tag: 'dynamic' })
	},
	dynamic(props: { tag: any; children?: any } & Record<string, any>, scope: Scope) {
		function compute(): any[] {
			onEffectTrigger((obj, _evolution, prop) => {
				if (obj === props && prop !== 'tag') {
					throw new Error(
						'Renderers effects are immutable. in <dynamic>, only a tag change can lead to a re-render'
					)
				}
			})
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
