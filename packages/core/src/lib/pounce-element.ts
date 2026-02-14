import {
	cleanedBy,
	type EffectCleanup,
	effect,
	formatCleanupReason,
	named,
	reactive,
	type ScopedCallback,
	stopped,
	untracked,
} from 'mutts'
import { perf } from '../perf'
import { type ComponentInfo, POUNCE_OWNER, perfCounters } from './debug'
import type { ReactiveProp } from './jsx-factory'

export const rootScope: Scope = reactive(Object.create(null))

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
export type Child = NodeDesc | ReactiveProp<Child> | PounceElement | Child[]

export type ComponentNode = Node & {
	[POUNCE_OWNER]?: ComponentInfo
	__mutts_projection__?: unknown
}

export type Scope = Record<PropertyKey, any> & { component?: ComponentInfo }

export type ComponentFunction<P = any> = (props: P, scope: Scope) => PounceElement

/**
 * PounceElement class - encapsulates JSX element creation and rendering
 */
export class PounceElement {
	// Core properties
	tag?: string | ComponentFunction
	produce: (scope?: Scope) => Node | readonly Node[]

	// Categories for conditional rendering and lifecycle
	mount?: ((target: Node | readonly Node[]) => ScopedCallback)[]
	condition?: () => any
	else?: true
	when?: Record<string, () => any>
	if?: Record<string, () => any>
	use?: Record<string, () => any>

	// Identity map for render caching — stores result + stop function to detect dead pipelines
	private static renderCache = new WeakMap<
		PounceElement,
		{ result: Node | readonly Node[]; stop: EffectCleanup }
	>()

	constructor(
		produce: (scope?: Scope) => Node | readonly Node[],
		info: {
			tag?: string | ComponentFunction
			mount?: ((target: Node | readonly Node[]) => ScopedCallback)[]
			condition?: () => any
			else?: true
			when?: Record<string, () => any>
			if?: Record<string, () => any>
			use?: Record<string, () => any>
		} = {}
	) {
		this.produce = produce
		this.tag = info.tag
		this.mount = info.mount
		this.condition = info.condition
		this.else = info.else
		this.when = info.when
		this.if = info.if
		this.use = info.use
	}

	/**
	 * Clear the render cache for this element.
	 * Used when a conditional element is hidden — its inner pipeline is destroyed,
	 * so re-showing must re-render from scratch instead of returning dead cached nodes.
	 */
	invalidateCache() {
		const entry = PounceElement.renderCache.get(this)
		if (entry) {
			entry.stop()
			PounceElement.renderCache.delete(this)
		}
	}

	/**
	 * Render the element - executes the produce function with caching
	 */
	render(scope: Scope = rootScope): Node | readonly Node[] {
		const tagName = typeof this.tag === 'string' ? this.tag : this.tag?.name || 'anonymous'
		// Check cache first
		const cached = PounceElement.renderCache.get(this)
		if (cached !== undefined && !cached.stop[stopped]) {
			perfCounters.renderCacheHits++
			perf?.mark(`render:${tagName}:cache-hit`)
			return cached.result
		}
		// Cache miss or dead pipeline — (re-)render
		if (cached) PounceElement.renderCache.delete(this)
		let partial: Node | readonly Node[] | undefined
		perf?.mark(`render:${tagName}:start`)
		const stopRender = effect(
			named(`render:${tagName}`, ({ reaction }) => {
				if (reaction) {
					console.warn(
						`Component ${tagName} rebuild detected.`,
						...(reaction === true ? ['No reasons given'] : formatCleanupReason(reaction)),
						'\nIt means the component definition refers a reactive value that has been modified, though the component has not been rebuilt as it is considered forbidden to avoid infinite events loops.'
					)
				}
				partial = this.produce(scope)
			})
		)

		if (!partial) throw new DynamicRenderingError('Renderer returned no content')
		PounceElement.renderCache.set(this, { result: partial, stop: stopRender })
		// Anchor the render effect to the DOM output so GC doesn't collect it
		// (root effects use FinalizationRegistry — if nobody holds the cleanup, GC kills all children)
		cleanedBy(partial, stopRender)
		perf?.mark(`render:${tagName}:end`)
		perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)

		// getTarget matches types for single nodes vs fragments
		const getTarget = () => (Array.isArray(partial) && partial.length === 1 ? partial[0] : partial!)

		// Process mount callbacks
		if (this.mount) {
			for (const mount of this.mount) {
				const stop = effect.named(`mount#${tagName}`)(() => mount(getTarget()))
				const anchor = untracked(getTarget)
				if (anchor && typeof anchor === 'object') {
					cleanedBy(anchor, stop)
				}
			}
		}

		// Process use callbacks
		if (this.use) {
			for (const [key, value] of Object.entries(this.use) as [string, any]) {
				const stop = effect.named(`use:${key}#${tagName}`)(() => {
					if (typeof scope[key] !== 'function')
						throw new DynamicRenderingError(`${key} in scope is not a function`)
					return scope[key](getTarget(), value(), scope)
				})
				const anchor = untracked(getTarget)
				if (anchor && typeof anchor === 'object') {
					cleanedBy(anchor, stop)
				}
			}
		}

		return partial
	}

	/**
	 * Clear the render cache for this element
	 */
	clearCache(): void {
		PounceElement.renderCache.delete(this)
	}
}

export type Component<P = {}> = (props: P, scope?: Scope) => PounceElement
export const emptyChild = new PounceElement(() => [])
