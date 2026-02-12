import { cleanedBy, cleanup, effect, lift, project, type ScopedCallback, scan, tag, unwrap } from 'mutts'
import { perf } from '../perf'
import { document, Node } from '../shared'
import { perfCounters, testing } from './debug'
import { type Child, DynamicRenderingError, PounceElement, rootScope, type Scope, emptyChild } from './pounce-element'
import { isNumber, isString } from './renderer-internal'

import { ReactiveProp } from './jsx-factory'

const latchOwners = new WeakMap<Element, string>()

let reconcileCount = 0
export function reconcile(
	parent: Node,
	newChildren: Node | readonly Node[] | undefined
): ScopedCallback {
	const stopRedraw = effect(function redraw() {
		perfCounters.reconciliations++
		const rid = ++reconcileCount
		perf?.mark(`reconcile:${rid}:start`)
		const items = Array.isArray(newChildren) ? newChildren : newChildren ? [newChildren] : []
		let added = 0
		let removed = 0
		// Replace children
		let newIndex = 0

		// Iterate through items and sync with live DOM
		while (newIndex < items.length) {
			const newChild = unwrap(items[newIndex])
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

		while (parent.childNodes.length > items.length) {
			removed++
			parent.removeChild(parent.lastChild!)
		}
		testing.renderingEvent?.(`reconcile (+${added} -${removed})`, parent, newChildren)
		perf?.mark(`reconcile:${rid}:end`)
		perf?.measure(`reconcile:${rid}(+${added}-${removed})`, `reconcile:${rid}:start`, `reconcile:${rid}:end`)
	})
	// Anchor the redraw effect to the reactive children so GC doesn't collect it.
	// Root effects use FinalizationRegistry — if nobody holds the cleanup, GC kills the effect.
	if (newChildren && typeof newChildren === 'object') cleanedBy(newChildren, stopRedraw)
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
	content: PounceElement | Child | Child[] | Node | Node[] | undefined,
	scope: Scope = rootScope
): ScopedCallback {
	let stop: ScopedCallback | undefined

	function actuallyLatch() {
		const element = isString(target)
			? document.querySelector(target as string) as Element | null
			: target as Element | null
		if (!element) {
			console.error(`[pounce] latch target not found: ${target}`)
			return
		}

		const tag = element.tagName?.toLowerCase() ?? String(target)
		const existing = latchOwners.get(element)
		if (existing) {
			console.warn(`[pounce] latch conflict on <${tag}>: already latched by "${existing}". Previous content will be replaced.`)
		}
		const label = isString(target) ? target as string : `<${tag}>`
		latchOwners.set(element, label)

		let nodes: Node | readonly Node[] | undefined
		if (content instanceof PounceElement) {
			nodes = content.render(scope)
		} else if (content instanceof Node) {
			nodes = content
		} else if (Array.isArray(content)) {
			if (content.length > 0 && content[0] instanceof Node) {
				nodes = content as Node[]
			} else {
				nodes = processChildren(content as Child[], scope)
			}
		} else if (content !== undefined && content !== null) {
			nodes = processChildren([content as Child], scope)
		}

		testing.renderingEvent?.('latch', tag, element)
		stop = reconcile(element, nodes)
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', actuallyLatch)
	} else {
		actuallyLatch()
	}

	return () => {
		stop?.()
		const element = isString(target)
			? document.querySelector(target as string) as Element | null
			: target as Element | null
		if (element) {
			latchOwners.delete(element)
			while (element.firstChild) element.removeChild(element.firstChild)
		}
	}
}

/**
 * Process children arrays, handling various child types including:
 * - Direct nodes
 * - Reactive functions
 * - Arrays of children
 * - Variable arrays from .map() operations
 *
 * Returns a flat array of DOM nodes suitable for replaceChildren()
 */
export function processChildren(children: readonly Child[], scope: Scope): readonly Node[] {
	/**
	 * 4 effects per elements is expensive but it has its use
	 * eg - if terms of condition changed but condition value didn't change (x went from 4 to 5 and condition is x > 3) - then the condition has to be
	 * re-evaluated, but not the renderers nor the rendered
	 */
	const renderers = tag('reconciler::renderers', project.array<Child, PounceElement>(children, function processChild({ value: child }) {
		while (child instanceof ReactiveProp) child = child.get()
		if (child === undefined || child === null || child === (false as any)) return emptyChild
		if (isString(child) || isNumber(child))
			return new PounceElement(function createTextNode() { return document.createTextNode(String(child)) })
		if (child instanceof Node) 
			return new PounceElement(function wrapNode() { return child as Node })
		if (Array.isArray(child))
			return new PounceElement(function renderFragment(s) { return processChildren(child as Child[], s || scope) }, {
				tag: 'fragment',
			})
		if (child instanceof PounceElement) return child
		if (child && typeof (child as any).render === 'function') return child as PounceElement
		return emptyChild
	}))

	const stableAccums = new WeakMap<PounceElement, { ifOccurred: boolean; value?: PounceElement }>()

	const conditioned = tag('reconciler::conditioned', scan(
		renderers,
		function processConditions(acc: { ifOccurred: boolean; value?: PounceElement }, child: PounceElement) {
			if (child.condition || child.if || child.when || child.else) {
				let hidden = false
				if (child.else && acc.ifOccurred) hidden = true
				else if (child.condition && !child.condition()) hidden = true
				else if (child.if) {
					for (const [key, value] of Object.entries(child.if) as [string, any])
						if (scope[key] !== value()) { hidden = true; break }
				} else if (child.when) {
					for (const [key, value] of Object.entries(child.when) as [string, any])
						if (!scope[key](value())) { hidden = true; break }
				}
				// Return stable object when condition result hasn't changed
				// to avoid unnecessary renderChild re-runs
				let stable = stableAccums.get(child)
				const value = hidden ? undefined : child
				if (stable && stable.value === value) {
					stable.ifOccurred = !hidden || acc.ifOccurred
					return stable
				}
				stable = { ifOccurred: !hidden || acc.ifOccurred, value }
				stableAccums.set(child, stable)
				return stable
			}
			let stable = stableAccums.get(child)
			if (stable) {
				stable.ifOccurred = acc.ifOccurred
				return stable
			}
			stable = { ifOccurred: acc.ifOccurred, value: child }
			stableAccums.set(child, stable)
			return stable
		},
		{ ifOccurred: false }
	))

	const lastRenderers = new Map<number, PounceElement>()

	const rendered = tag('reconciler::rendered', project(conditioned, function renderChild(access): Node | readonly Node[] | false | undefined {
		const accResult = access.value
		if (!accResult || !accResult.value) {
			// When hiding a conditional element, invalidate its render cache.
			// The inner pipeline's effects are destroyed when this project effect cleans up.
			// Without invalidating, re-showing returns dead cached nodes.
			// TODO: This seems like a low-level hack who hides a lack functionality or a design misconception. Make sure the whole cache system shouldn't be managed by an intrinsic functionality/contract of mutts
			const prev = lastRenderers.get(access.key)
			if (prev) {
				prev.invalidateCache()
				lastRenderers.delete(access.key)
			}
			return
		}
		const renderer = accResult.value as PounceElement
		lastRenderers.set(access.key, renderer)
		if (typeof renderer.render !== 'function') {
			console.error('[pounce] Invalid renderer detected in child list:', renderer)
			return
		}
		const nodes = renderer.render(scope)
		if (Array.isArray(nodes) || nodes instanceof Node) return nodes
		if(nodes) throw new DynamicRenderingError('Render should return Node-s')
	}))

	const flattened = tag('reconciler::flattened', lift(function flattenNodes() {
		const next: Node[] = []
		const push = function pushItem(item: any) {
			if (Array.isArray(item)) {
				for (const child of item) push(child)
			} else if (item instanceof Node) {
				next.push(item)
			}
		}

		push(rendered)
		return next
	}))
	return cleanedBy(flattened, function performCleanup() {
		conditioned[cleanup]()
		rendered[cleanup]()
		renderers[cleanup]()
	})
}
