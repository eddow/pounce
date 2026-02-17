import { cleanedBy, effect, formatCleanupReason, named, reactive } from 'mutts'
import { perf } from '../perf'
import { type CompositeAttributesMeta, collapse, ReactiveProp } from './composite-attributes'
import { type ComponentInfo, POUNCE_OWNER } from './debug'

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

export type Child = Node | string | number | null | undefined | PounceElement | ReactiveProp<any>
export type Children = Child | readonly Children[]
// TODO: kill this hack
export type ComponentNode = Node & {
	[POUNCE_OWNER]?: ComponentInfo
	__mutts_projection__?: unknown
}

export type Scope = Record<PropertyKey, any> & { component?: ComponentInfo }

export type ComponentFunction<P = any> = (props: P, scope: Scope) => Children

/**
 * PounceElement class - encapsulates JSX element creation and rendering
 */
export class PounceElement {
	// Core properties

	constructor(
		public produce: (scope: Scope) => Node | readonly Node[],
		public tag?: string | ComponentFunction,
		public meta: CompositeAttributesMeta = {}
	) {}
	get conditional() {
		return this.meta.condition || this.meta.if || this.meta.when || this.meta.else
	}
	shouldRender(alreadyRendered: boolean, scope: Scope): boolean | undefined {
		const meta = this.meta
		if (this.conditional) {
			if (meta.else && alreadyRendered) return false
			if (meta.condition && !collapse(meta.condition)) return false

			if (this.meta.when)
				for (const [key, arg] of Object.entries(this.meta.when))
					if (!(key in scope)) throw new DynamicRenderingError(`${key} not found in scope for when`)
					else if (typeof scope[key] !== 'function')
						throw new DynamicRenderingError(`${key} not a predicate in scope for when`)
					else if (!scope[key](collapse(arg))) return false

			if (this.meta.if)
				for (const [key, value] of Object.entries(this.meta.if))
					if (!(key in scope)) throw new DynamicRenderingError(`${key} not found in scope for if`)
					else if (collapse(value) !== scope[key]) return false

			return true
		}

		return undefined
	}

	mountCallbacks(target: Node | readonly Node[], scope: Scope) {
		const t = this.meta.this as any
		if (t) {
			if (t instanceof ReactiveProp && t.set) t.set(target)
			else if (typeof t === 'function') t(target)
		}

		// We consider that the mount CBs (mount/use) are not dynamic - it removes an effect and changing it will bounce in the 1-render fence
		if (this.meta.mount) collapse(this.meta.mount)(target)

		// Process use callbacks
		if (this.meta.use)
			for (const [key, v] of Object.entries(this.meta.use) as [string, any]) {
				if (typeof scope[key] !== 'function')
					throw new DynamicRenderingError(`${key} in scope is not a function`)
				scope[key](target, collapse(v), scope)
			}
	}

	/**
	 * Render the element - executes the produce function with caching
	 */
	render(scope: Scope = rootScope): Node | readonly Node[] {
		const tagName = typeof this.tag === 'string' ? this.tag : this.tag?.name || 'anonymous'
		let partial: Node | readonly Node[] | undefined
		perf?.mark(`render:${tagName}:start`)
		const stopRender = effect(
			named(`render:${tagName}`, ({ reaction }) => {
				if (reaction) {
					console.warn(
						`Component <${tagName}> rebuild detected.`,
						...(reaction === true ? ['No reasons given'] : formatCleanupReason(reaction)),
						'\nIt means the component definition refers a reactive value that has been modified, though the component has not been rebuilt as it is considered forbidden to avoid infinite events loops.'
					)
					debugger
				}
				partial = this.produce(scope)
				this.mountCallbacks(partial, scope)
			})
		)

		if (!partial) throw new DynamicRenderingError('Renderer returned no content')
		// Anchor the render effect to the DOM output so GC doesn't collect it
		// (root effects use FinalizationRegistry — if nobody holds the cleanup, GC kills all children)
		cleanedBy(partial, stopRender)
		perf?.mark(`render:${tagName}:end`)
		perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)

		return partial
	}
}
export type Component<P = {}> = (props: P, scope?: Scope) => PounceElement
export const emptyChild = new PounceElement(() => [], 'empty')
