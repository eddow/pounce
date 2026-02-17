import { cleanedBy, cleanup, effect, isReactive, lift, morph, reactive, type ScopedCallback, unwrap } from 'mutts'
import { perf } from '../perf'
import { document, Node } from '../shared'
import { collapse, ReactiveProp } from './composite-attributes'
import { perfCounters, testing } from './debug'
import { type Child, type Children, PounceElement, rootScope, type Scope } from './pounce-element'
import { weakCached } from './utils'

const latchOwners = new WeakMap<Element, string>()

export function pounceElement(child: Children, scope: Scope): PounceElement {
	return child instanceof PounceElement
		? child
		: child === null || child === undefined
			? new PounceElement(() => [], 'empty')
			: Array.isArray(child)
				? new PounceElement(() => processChildren(child, scope))
				: child instanceof Node
					? new PounceElement(() => child)
					: new PounceElement(() => document.createTextNode(String(child)), '#text')
}

let reconcileCount = 0
export function reconcile(
	parent: Node,
	newChildren: Node | readonly Node[]
): ScopedCallback {
	function reconciler() {
		perfCounters.reconciliations++
		const rid = ++reconcileCount
		perf?.mark(`reconcile:${rid}:start`)
		const items = Array.isArray(newChildren)
			? newChildren
			: newChildren
				? [newChildren]
				: []
		if(parent instanceof Element && (items.length === 0 || parent.childNodes.length === 0)) {
			(parent as Element).replaceChildren(...items)
			return
		}
		let added = 0
		let removed = 0
		const itemsSet = new Set(items)
		// Iterate through items and sync with live DOM
		items.forEach((item, i) => {
			const newChild = unwrap(item) as Node;
			let currentChild = parent.childNodes[i];
			while(i < parent.childNodes.length && !itemsSet.has(currentChild)) {
				removed++
				parent.removeChild(currentChild)
				currentChild = parent.childNodes[i]
			}
			if (currentChild !== newChild) {
				// This handles BOTH moving an existing node and inserting a brand new one
				parent.insertBefore(newChild, currentChild || null);
				added++;
			}
		});

		while (parent.childNodes.length > items.length) {
			removed++
			parent.removeChild(parent.lastChild!)
		}
		testing.renderingEvent?.(`reconcile (+${added} -${removed})`, parent, newChildren)
		perf?.mark(`reconcile:${rid}:end`)
		perf?.measure(
			`reconcile:${rid}(+${added}-${removed})`,
			`reconcile:${rid}:start`,
			`reconcile:${rid}:end`
		)
	}
	let stopRedraw = () => {}
	// TODO: re-optimize?
	//if(isReactive(newChildren)) {
		stopRedraw = effect(reconciler)
		// Anchor the redraw effect to the reactive children so GC doesn't collect it.
		// Root effects use FinalizationRegistry — if nobody holds the cleanup, GC kills the effect.
		if (newChildren && typeof newChildren === 'object') cleanedBy(newChildren, stopRedraw)
	//} else reconciler()
	return stopRedraw
}

/**
 * Latch reactive content onto a DOM element.
 * Polymorph: accepts PounceElement, Child[], Node, Node[], or undefined.
 * Processes content through the appropriate pipeline, then reconciles into the target.
 * Includes DOMContentLoaded guard and conflict detection.
 */
export function latch(
	target: string | Element,
	content: PounceElement | Children | Children[] | Node | Node[] | undefined,
	scope: Scope = rootScope
): ScopedCallback {
	let stop: ScopedCallback | undefined
	let element: Element | null = null
	function actuallyLatch() {
		element =
			typeof target === 'string'
				? (document.querySelector(target as string) as Element | null)
				: (target as Element | null)
		if (!element) {
			console.error(`[pounce] latch target not found: ${target}`)
			return
		}

		const tag = element.tagName?.toLowerCase() ?? String(target)
		const existing = latchOwners.get(element)
		if (existing) {
			console.warn(
				`[pounce] latch conflict on <${tag}>: already latched by "${existing}". Previous content will be replaced.`
			)
		}
		const label = typeof target === 'string' ? (target as string) : `<${tag}>`
		latchOwners.set(element, label)

		let nodes: Node | readonly Node[]
		if (content instanceof PounceElement) {
			nodes = content.render(scope)
		} else if (content instanceof Node) {
			nodes = content
		} else if (Array.isArray(content)) {
			if (content.length > 0 && content[0] instanceof Node) {
				nodes = content as Node[]
			} else {
				nodes = processChildren(content as Children[], scope)
			}
		} else if (content !== undefined && content !== null) {
			nodes = processChildren([content as Children], scope)
		} else {
			console.error('[pounce] Invalid content:', content)
			throw new Error('Invalid content')
		}

		testing.renderingEvent?.('latch', tag, element)
		stop = reconcile(element, nodes)
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', actuallyLatch)
	else actuallyLatch()

	return () => {
		stop?.()
		if (element) {
			latchOwners.delete(element)
			while (element.firstChild) element.removeChild(element.firstChild)
		}
	}
}

// TODO: use flat if possible
type Tree<T> = T | readonly Tree<T>[]
function myFlat<T>(arr: readonly Tree<T>[], r: {v: T[]} = {v: [] as T[]}): T[] {
	if(isReactive(arr)) r.v = reactive(r.v)
	for(const item of arr) {
		if(Array.isArray(item)) myFlat(item, r)
		else r.v.push(item as T)
	}
	return r.v
}

/**
 * Process children into a flat array of DOM nodes.
 *
 * ARCHITECTURE — two reactive stages + ReactiveProp envelope:
 *
 * STAGE 1 — morph (children → PounceElement[] → rendered results)
 *   - Spreads childrenArray ([...childrenArray]) to subscribe to array mutations
 *   - Flattens nested arrays, filters falsy
 *   - Applies conditional rendering (if/when/else) via shouldRender()
 *   - Maps surviving PounceElements → rendered results via e.render(scope)
 *   - Returns: reactive array of PerhapsReactive<Node | readonly Node[]>
 *
 * STAGE 2 — ReactiveProp getter (flattening)
 *   - Each render result can be Node, Node[], or ReactiveProp wrapping either
 *   - Stack-based traversal with collapse() handles arbitrary nesting
 *   - Returns flat Node[]
 *
 * WHY ReactiveProp envelope:
 *   reconcile() calls collapse(newChildren) inside its redraw effect.
 *   Returning a ReactiveProp means the getter runs inside that effect,
 *   so reading `rendered` (the reactive morph cache) creates a dependency.
 *   Without the wrapper, the flattening would run eagerly at processChildren
 *   call time, outside any subscribing effect.
 *
 * KNOWN PERF TODO — static children:
 *   For non-reactive children (no [cleanup] symbol, isReactive() === false),
 *   the morph effect + reactive cache are wasted. Restore fast paths
 *   that return rendered nodes directly.
 */
export function processChildren(children: Children, scope: Scope): Node | readonly Node[] {
	if (!Array.isArray(children)) return pounceElement(children, scope).render(scope)
	//Idea: keep reactivity for as late as possible
	const flatInput: Child[] & { [cleanup]?: ScopedCallback } = isReactive(children)
		? lift(() => unwrap(children.flat(Infinity).filter(Boolean) as Child[]))
		: children.flat(Infinity).filter(Boolean)
	let flatElements: PounceElement[] & { [cleanup]?: ScopedCallback } =
		isReactive(flatInput) || flatInput.some((c) => c instanceof ReactiveProp)
			? lift(() => flatInput.map((c) => pounceElement(collapse(c), scope)))
			: flatInput.map((c) => pounceElement(c, scope))

	const conditioned =
		isReactive(flatElements) || flatElements.some((e) => e.conditional)
			? lift(() => {
					// TODO: re-think about 'pick'
					let ifOccurred = false
					return flatElements
						.map((e) => {
							const shouldRender = e.shouldRender(ifOccurred, scope)
							if (shouldRender) ifOccurred = true
							if (shouldRender !== false) return e
						})
						.filter(Boolean) as PounceElement[]
				})
			: flatElements
	// Render the elements to nodes
	const rendered = morph.pure(
		conditioned,
		weakCached((e: PounceElement) => e.render(scope))
	)
	return cleanedBy(lift(() => myFlat(rendered) as Node[]), () => {
		flatInput[cleanup]?.()
		flatElements[cleanup]?.()
		conditioned[cleanup]?.()
		rendered[cleanup]?.()
	})
}
