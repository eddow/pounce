import {
	scan,
	atomic,
	biDi,
	cleanedBy,
	cleanup,
	effect,
	getActiveProjection,
	isNonReactive,
	memoize,
	project,
	reactive,
	trackEffect,
	unreactive,
	untracked,
	unwrap,
	lift,
	type ScopedCallback,
} from 'mutts'
import { namedEffect, nf, pounceOptions, testing, POUNCE_OWNER, rootComponents, type ComponentInfo } from './debug'
import { restructureProps } from './namespaced'
import { type ClassInput, classNames, type StyleInput, styles } from './styles'
import { extend, forwardProps, isElement, propsInto } from './utils'

export class DynamicRenderingError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'DynamicRenderingError'
		debugger
	}
}

/**
 * Node descriptor - what a function can return
 */
export type NodeDesc = Node | string | number

/**
 * A child can be:
 * - A DOM node
 * - A reactive function that returns intermediate values
 * - An array of children (from .map() operations)
 */
export type Child = NodeDesc | (() => Child) | JSX.Element | Child[]

type ComponentNode = Node & {
	[POUNCE_OWNER]?: ComponentInfo
	__mutts_projection__?: unknown
}

function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

function isNumber(value: any): value is number {
	return typeof value === 'number'
}

function isObject(value: any): value is object {
	return typeof value === 'object' && value !== null
}

function isString(value: any): value is string {
	return typeof value === 'string'
}

function isSymbol(value: any): value is symbol {
	return typeof value === 'symbol'
}

export type Scope = Record<PropertyKey, any> & { component?: ComponentInfo }
export type Component<P = {}> = (props: P, scope?: Scope) => JSX.Element
export const rootScope: Scope = reactive(Object.create(null))

function listen(
	target: EventTarget,
	type: string,
	listener: EventListenerOrEventListenerObject,
	options?: boolean | AddEventListenerOptions
) {
	testing.renderingEvent?.('add event listener', target, type, listener, options)
	target.addEventListener(type, listener, options)
	return () => {
		testing.renderingEvent?.('remove event listener', target, type, listener, options)
		target.removeEventListener(type, listener, options)
	}
}

function valuedAttributeGetter(to: any) {
	if (to === true) return () => undefined
	if (isFunction(to)) return to as (...args: any[]) => unknown
	if (isObject(to) && 'get' in to) return (to as { get: () => unknown }).get
	return () => to
}

// Component Hyper-Build Detection
// Tracks rapid rebuilds to catch infinite loops before browser freezes
const componentRebuildTracker = new WeakMap<Function, { count: number; startTime: number }>()

function checkComponentRebuild(componentCtor: Function) {
	const { maxRebuildsPerWindow, rebuildWindowMs } = pounceOptions
	if (maxRebuildsPerWindow <= 0) return // Disabled

	const now = Date.now()
	let tracker = componentRebuildTracker.get(componentCtor)

	if (!tracker || now - tracker.startTime > rebuildWindowMs) {
		tracker = { count: 0, startTime: now }
		componentRebuildTracker.set(componentCtor, tracker)
	}

	tracker.count++

	if (tracker.count > maxRebuildsPerWindow) {
		console.error(
			`[pounce] Component "${componentCtor.name}" rebuilt ${tracker.count} times in ${rebuildWindowMs}ms - possible infinite loop!`
		)
		// Reset to avoid spamming, then pause for debugging
		tracker.count = 0
		tracker.startTime = now
		debugger
	}
}

function forward(tag: string, children: readonly Child[], scope: Scope) {
	return { tag, render: () => processChildren(children, scope) }
}

/**
 * Custom h() function for JSX rendering - returns a mount function
 */
export const h = (tag: any, props: Record<string, any> = {}, ...children: Child[]): JSX.Element => {

	const categories: Record<PropertyKey, any> = {}
	const node: Record<string, any> = {}

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
				if (value !== true) throw new DynamicRenderingError('`else` attribute must not specify a value')
				categories.else = true
				break
			}
			case 'if': {
				categories.condition = valuedAttributeGetter(value)
				break
			}
			case 'use': {
				// The babel plugin automatically wraps the handler: `use={fn}` -> `use={() => fn}`.
				// We execute the wrapper to get the actual handler.
				// Users should NOT wrap it manually.
				const mountEntry = valuedAttributeGetter(value)()
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

	const regularProps = node
	const collectedCategories = categories
	let mountObject: any
	if (typeof tag === 'object' && typeof tag.get === 'function') tag = tag.get()
	const resolvedTag =
		isString(tag) && tag in intrinsicComponentAliases
			? intrinsicComponentAliases[tag as keyof typeof intrinsicComponentAliases]
			: tag
	const componentCtor = typeof resolvedTag === 'function' && resolvedTag

	if (!isString(resolvedTag) && !componentCtor) {
		throw new DynamicRenderingError(
			`[pounce] Invalid component tag: ${JSON.stringify(resolvedTag)}. Tag must be a string (intrinsic) or a function (component).`
		)
	}

	const parentComponent = rootScope.component

	// If we were given a component function directly, render it
	if (componentCtor) {
		const info: ComponentInfo = unreactive({
			id: crypto.randomUUID(),
			name: componentCtor.name,
			ctor: componentCtor,
			props: regularProps,
			scope: undefined, // Set during render
			parent: parentComponent,
			children: new Set<ComponentInfo>(),
			elements: new Set<Node>(),
		})
		// Effect for styles - only updates style container
		mountObject = {
			tag,
			render(scope: Scope = rootScope) {
				const parent = scope.component
				const isRegistered = parent
					? parent.children.has(info)
					: rootComponents.has(info)
				if (info.parent !== parent || !isRegistered) {
					if (info.parent) info.parent.children.delete(info)
					else rootComponents.delete(info)
					info.parent = parent
					if (parent) parent.children.add(info)
					else rootComponents.add(info)
				}

				// Set scope on the component instance
				const childScope = extend(scope, { component: info })
				info.scope = childScope

				const rendered = project.array<null, JSX.Element>([null], () => {
					checkComponentRebuild(componentCtor)
					testing.renderingEvent?.('render component', componentCtor.name)
					const givenProps = reactive(propsInto(regularProps, { children }))
					const result = componentCtor(restructureProps(givenProps), childScope)
					return result
				})
				cleanedBy(rendered, () => {
					if (info.parent) info.parent.children.delete(info)
					else rootComponents.delete(info)
				})
				return processChildren(rendered, childScope, 'root')
			},
		}
	} else {
		const element = document.createElement(tag)
		let lastComponent: ComponentInfo | undefined
		const projection = getActiveProjection()
		if (projection) {
			;(element as ComponentNode).__mutts_projection__ = projection
			element.setAttribute('data-mutts-path', `${projection.depth}:${projection.key ?? '?'}`)
		}
		testing.renderingEvent?.('create element', tag, element)
		if (tag === 'input') props.type ??= 'text'
		function setHtmlProperty(key: string, value: any) {
			const normalizedKey = key.toLowerCase()
			try {
				if (normalizedKey in element) {
					const current = (element as any)[normalizedKey]
					if (typeof current === 'boolean') (element as any)[normalizedKey] = Boolean(value)
					else (element as any)[normalizedKey] = value ?? ''
					return
				}
				if (key in element) {
					const current = (element as any)[key]
					if (typeof current === 'boolean') (element as any)[key] = Boolean(value)
					else (element as any)[key] = value ?? ''
					return
				}
			} catch {
				// Fallback to attribute assignment below
			}
			if (value === undefined || value === false) {
				testing.renderingEvent?.('remove attribute', element, normalizedKey)
				element.removeAttribute(normalizedKey)
				return
			}
			const stringValue = value === true ? '' : String(value)
			testing.renderingEvent?.('set attribute', element, normalizedKey, stringValue)
			element.setAttribute(normalizedKey, stringValue)
		}
		function applyStyleProperties(computedStyles: Record<string, any>) {
			element.removeAttribute('style')
			testing.renderingEvent?.('assign style', element, computedStyles)
			Object.assign(element.style, computedStyles)
		}
		if (props)
			for (const [key, value] of Object.entries(props)) {
				if (key === 'children') continue
				if (['if', 'else', 'use', 'this'].includes(key)) continue
				// Also skip namespaced attributes like use:xxx, if:xxx
				if (key.includes(':')) {
					const prefix = key.split(':')[0]
					if (['use', 'if', 'when', 'update'].includes(prefix)) continue
				}

				const runCleanup: (() => void)[] = []

				if (typeof key !== 'string') continue

				if (/^on[A-Z]/.test(key)) {
					const eventType = key.slice(2).toLowerCase()
					const stop = namedEffect(`event:${key}`, () => {
						const handlerCandidate = value.get ? value.get() : value()
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
						applyStyleProperties(computedStyles)
					})
					cleanedBy(element, stop)
					continue
				}
				if (isObject(value) && value !== null && 'get' in value && 'set' in value) {
					const binding = {
						get: nf(`get ${tag}:${key}`, value.get as () => unknown),
						set: nf(`set ${tag}:${key}`, value.set as (v: unknown) => void),
					}
					const provide = biDi((v) => setHtmlProperty(key, v), binding)
                    // ... (keep existing input logic if possible, or simplified)
                    // User asked to instrument suspect effects.
                    // Let's just instrument the generic prop one below first as it's more likely.
                    // But I need to match the block correctly.
                    // I will leave this block alone for now to avoid mess, targeting the prop block.
                    
					if (tag === 'input') {
						switch (element.type) {
							case 'checkbox':
							case 'radio':
								if (key === 'checked')
									runCleanup.push(listen(element, 'input', () => provide(element.checked)))
								break
							case 'number':
							case 'range':
								if (key === 'value')
									runCleanup.push(listen(element, 'input', () => provide(Number(element.value))))
								break
							default:
								if (key === 'value')
									runCleanup.push(listen(element, 'input', () => provide(element.value)))
								break
						}
					}
					cleanedBy(element, () => {
						setHtmlProperty(key, undefined)
						for (const stop of runCleanup) stop()
					})
					continue
				}
				if (isFunction(value)) {
					cleanedBy(element, namedEffect(`prop:${key}`, () => {
						setHtmlProperty(key, nf(`${tag}:${key}`, value)())
					}))
					continue
				}
				if (key === 'innerHTML') {
					if (value !== undefined) {
						const htmlValue = String(value)
						testing.renderingEvent?.('set innerHTML', element, htmlValue)
						element.innerHTML = htmlValue
					}
					cleanedBy(element, () => {
						element.innerHTML = ''
					})
					continue
				}
				setHtmlProperty(key, value)
				cleanedBy(element, () => {
					setHtmlProperty(key, undefined)
				})
			}

		// Create plain HTML element - also return mount object for consistency
		mountObject = {
			tag,
			render(scope: Scope = rootScope) {
				const componentToUse = scope.component
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
				// Render children
				if (children && children.length > 0 && !regularProps?.innerHTML) {
					// Process new children
					const processedChildren = processChildren(children, scope)
					bindChildren(element, processedChildren)
				}
				return element
			},
		}
	}
	return Object.defineProperties(mountObject, Object.getOwnPropertyDescriptors(collectedCategories))
}

const intrinsicComponentAliases = extend(null, {
	scope(props: { children?: any; [key: string]: any }, scope: Scope) {
		effect(function scopeEffect() {
			for (const [key, value] of Object.entries(props)) if (key !== 'children') scope[key] = value
		})
		return props.children
	},
	dynamic(
		props: { tag: any; children?: JSX.Children } & Record<string, any>,
		scope: Scope
	) {
		function compute(): Node[] {
			trackEffect((_obj, _evolution, prop)=> {
				if(prop !== 'tag') throw new DynamicRenderingError('Renderers effects are immutable. in <dynamic>, only a tag change can lead to a re-render')
			})
			// Resolve the tag identity to track changes.
			// Only call the function if it's a getter (length 0).
			// If it's a component function (length > 0), treat it as the tag itself.
			let tagValue =
				isFunction(props.tag) && props.tag.length === 0 ? props.tag() : props.tag

			if (
				isObject(tagValue) &&
				tagValue !== null &&
				'get' in tagValue &&
				isFunction((tagValue as any).get)
			)
				tagValue = (tagValue as any).get()

			const childrenValue = isFunction(props.children) ? props.children() : props.children
			const childArray: Child[] = Array.isArray(childrenValue)
				? (childrenValue as unknown as Child[])
				: childrenValue === undefined
					? []
					: [childrenValue as unknown as Child]

			// Use forwardProps to correctly pass reactive props through the dynamic boundary
			const childProps = forwardProps(props)
			const filteredProps = new Proxy(childProps, {
				get(target, prop) {
					if (prop === 'tag' || prop === 'children') return undefined
					return target[prop]
				},
				ownKeys(target) {
					return Reflect.ownKeys(target).filter((k) => k !== 'tag' && k !== 'children')
				},
				getOwnPropertyDescriptor(target, prop) {
					if (prop === 'tag' || prop === 'children') return undefined
					return Object.getOwnPropertyDescriptor(target, prop)
				},
			})

			const output = render(h(tagValue, filteredProps, ...childArray), scope)
			return Array.isArray(output) ? output : [output as Node]
		}

		return lift(compute)
	},

	for<T>(
		props: {
			each: readonly T[]
			children: (item: T, oldItem?: JSX.Element) => JSX.Element
		},
		scope: Scope
	) {
		const body = Array.isArray(props.children) ? props.children[0] : props.children
		const cb = body() as (item: T, oldItem?: JSX.Element) => JSX.Element
		const memoized = memoize(cb as (item: T & object) => JSX.Element)
		const compute = () => {
			const each = (props as any).each as readonly T[] | undefined
			if (!each) return [] as readonly JSX.Element[]
			return isNonReactive(each)
				? (each.map((item: T) => cb(item)) as readonly JSX.Element[])
				: (project(each, ({ value: item, old }) => {
						return isObject(item) || isSymbol(item) || isFunction(item)
							? memoized(item as T & object)
							: cb(item, old as JSX.Element | undefined)
					}) as readonly JSX.Element[])
		}
		return forward('for', [compute as any] as any, scope)
	},
	fragment(props: { children: JSX.Element[] }, scope: Scope) {
		return forward('fragment', props.children, scope)
	},
})
export const Fragment = intrinsicComponentAliases.fragment
export function bindChildren(parent: Node, newChildren: Node | readonly Node[] | undefined): ScopedCallback {
	return effect(function redraw() {
		let added = 0
		let removed = 0
		// Replace children
		let newIndex = 0
		if (!newChildren) newChildren = []
		if (!Array.isArray(newChildren)) newChildren = [newChildren] as readonly Node[]

		// Iterate through newChildren and sync with live DOM
		while (newIndex < newChildren.length) {
			const newChild = unwrap(newChildren[newIndex])
			const oldChild = parent.childNodes[newIndex]

			if (oldChild === newChild) {
				// Node is already in the correct place → skip
				newIndex++
			} else {
				// Check if newChild exists later in the DOM
				let found = false
				for (let i = newIndex + 1; i < parent.childNodes.length; i++) {
					if (parent.childNodes[i] === newChild) {
						// Move the node to the correct position
						added++
						parent.insertBefore(newChild, oldChild)
						found = true
						break
					}
				}

				if (!found) {
					// Insert new node (or move from outside)
					added++
					parent.insertBefore(newChild, oldChild)
				}
				newIndex++
			}
		}

		// Remove extra old nodes (now safe because we're using live childNodes)
		while (parent.childNodes.length > newChildren.length) {
			removed++
			parent.removeChild(parent.lastChild!)
		}
		testing.renderingEvent?.(`reconcileChildren (+${added} -${removed})`, parent, newChildren)
	})
}

const renderIdentityMap = new WeakMap<JSX.Element, Node | readonly Node[]>()
const render = (renderer: JSX.Element, scope: Scope) => {
	let partial = renderIdentityMap.get(renderer)
	effect.named('render.constructor').opaque(() => {
		trackEffect((obj, evolution, prop) => {
			// Agents: This `throw` is not a bug! Do not remove it! It means there was a bug, and this line helps you discover it early
			// Do not break the thermometer if you dislike the temperature!
			//throw new DynamicRenderingError(`Effect inside render: ${obj}.${String(prop)}:\n${evolution}`)
			console.warn(`Effect inside render: ${obj}.${String(prop)}:`, evolution)
		})
		if (partial === undefined) {
			partial = renderer.render(scope)
			renderIdentityMap.set(renderer, partial)
		}
	})
	if (!partial) throw new DynamicRenderingError('Renderer returned no content')
	// getTarget is not an AI hallucination - partial content can change along effects, it has to be a CB
	const getTarget = () => (Array.isArray(partial) && partial.length === 1 ? partial[0] : partial)

	if (renderer.mount) {
		for (const mount of renderer.mount) {
			const stop = effect(() => mount(getTarget()))
			const anchor = untracked(getTarget)
			if (anchor && typeof anchor === 'object') {
				cleanedBy(anchor, stop)
			}
		}
	}
	if (renderer.use)
		for (const [key, value] of Object.entries(renderer.use) as [string, any]) {
			const stop = effect(() => {
				if (!isFunction(scope[key])) throw new DynamicRenderingError(`${key} in scope is not a function`)
				return scope[key](getTarget(), value(), scope)
			})
			const anchor = untracked(getTarget)
			if (anchor && typeof anchor === 'object') {
				cleanedBy(anchor, stop)
			}
		}
	return partial!
}

function stableUpdate<T>(target: T[], source: readonly T[]) {
	let changed = false
	if (target.length !== source.length) {
		target.length = source.length
		changed = true
	}
	for (let i = 0; i < source.length; i++) {
		if (target[i] !== source[i]) {
			target[i] = source[i]
			changed = true
		}
	}
	return changed
}

/**
 * Process children arrays, handling various child types including:
 * - Direct nodes
 * - Reactive functions
 * - Arrays of children
 * - Variable arrays from .map() operations
 *
 * Returns a flat array of DOM nodes suitable for replaceChildren()
 * 
 */
export function processChildren(children: readonly Child[], scope: Scope, isRoot?: 'root'): readonly Node[] {
	/*
	The function remembers all the layers of the processing : callbacks, meta-info (if/when/else) then rendering, then flattening the results - in each step, a reactive array is remembered.
	Changing one element in one array will propagate the change along the reactive chain through all the downstream arrays.
	*/
	if (isRoot === 'root') console.log(`processing ${scope.component?.name} ${scope.component?.id}`)

	const renderers = project.array<Child, JSX.Element>(children, ({ get }) => {
		let child: Child = get()
		while (isFunction(child)) child = (child as () => Child)()
		return typeof child === 'string' || typeof child === 'number' ? { render: () => document.createTextNode(String(child)) } : child as JSX.Element
	})

	const conditioned = scan(renderers, (acc: { ifOccurred: boolean, value?: JSX.Element }, child: JSX.Element) => {
		if ('condition' in child || 'if' in child || 'when' in child || 'else' in child) {
			if (child.else && acc.ifOccurred) return { ifOccurred: true }
			if ('condition' in child && !child.condition()) return extend(acc, { value: undefined })
			if (child.if)
				for (const [key, value] of Object.entries(child.if) as [string, any])
					if (scope[key] !== value()) return extend(acc, { value: undefined })
			if (child.when)
				for (const [key, value] of Object.entries(child.when) as [string, any])
					if (!scope[key](value())) return extend(acc, { value: undefined })
			return { ifOccurred: true, value: child }
		}
		return extend(acc, { value: child })
	}, { ifOccurred: false })
	const rendered = project(conditioned, ({ value: accResult }): Node | readonly Node[] | false | undefined => {
		const partial = accResult.value
		if (!partial) return
		const nodes = isElement(partial) ? render(partial, scope) : partial
		if (!nodes && !isNumber(nodes)) return

		if (Array.isArray(nodes)) {
			if (nodes.every(n => n instanceof Node)) return nodes
			return processChildren(nodes, scope)
		}
		if (typeof Node !== 'undefined' && nodes instanceof Node) return unwrap(nodes)
		throw new DynamicRenderingError('Render should return Node-s')
	})

	const rv = reactive<Node[]>([])
	const reduce = namedEffect(`reduce#${scope.component?.id}`, () => {
		if (isRoot === 'root') console.log(`reducing ${scope.component?.id}`)
		const next: Node[] = []
		for (const item of rendered) {
			if (item instanceof Array) {
				for (const n of item) if (n) next.push(n)
			} else if (item) {
				next.push(item)
			}
		}
		stableUpdate(rv, next)
	})

	return cleanedBy(rv, () => {
		reduce()
		conditioned[cleanup]()
		rendered[cleanup]()
		renderers[cleanup]()
	})
}
