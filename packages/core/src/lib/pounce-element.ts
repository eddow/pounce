import { cleanedBy, effect, named, reactive, type ScopedCallback, untracked } from 'mutts'
import { perf } from '../perf'
import { type ComponentInfo, perfCounters, POUNCE_OWNER } from './debug'
import { ReactiveProp } from './jsx-factory'

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

	// Identity map for render caching
	private static renderCache = new WeakMap<PounceElement, Node | readonly Node[]>()

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
	 * Render the element - executes the produce function with caching
	 */
	render(scope: Scope = rootScope): Node | readonly Node[] {
		const tagName = typeof this.tag === 'string' ? this.tag : this.tag?.name || 'anonymous'
		// Check cache first
		let partial = PounceElement.renderCache.get(this)
		if (partial !== undefined) {
			perfCounters.renderCacheHits++
			perf?.mark(`render:${tagName}:cache-hit`)
			return partial
		}
		if (!partial) {
			perf?.mark(`render:${tagName}:start`)
			// Execute produce function untracked to prevent unwanted reactivity
			effect(named(
				tagName,
				({ reaction }) => {
					if (reaction) {
						console.warn(`Component rebuild detected.
It means the component definition refers a reactive value that has been modified, though the component has not been rebuilt as it is considered forbidden to avoid infinite events loops.`)
					} else {
						partial = this.produce(scope)
					}
				}))

			if (!partial) throw new DynamicRenderingError('Renderer returned no content')
			PounceElement.renderCache.set(this, partial)
			perf?.mark(`render:${tagName}:end`)
			perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)
		}

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