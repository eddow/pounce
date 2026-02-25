import {
	addUnreactiveProps,
	caught,
	type EffectAccess,
	effect,
	formatCleanupReason,
	link,
	reactive,
	reactiveOptions,
	unreactive,
} from 'mutts'
import { perf } from '../perf'
import { type CompositeAttributesMeta, collapse, ReactiveProp } from './composite-attributes'
import { pounceOptions } from './debug'
import { getEnvPath } from './utils'

export const rootEnv: Env = addUnreactiveProps(Object.create(null))

export class DynamicRenderingError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'DynamicRenderingError'
	}
}

/**
 * Node descriptor - what a function can return
 */
export type NodeDesc = Node | string | number

export type Child = Node | string | number | null | undefined | PounceElement
export type Children = Child | readonly Children[] | ReactiveProp<Children>

export type Env<T = any> = Record<PropertyKey, T>
let maxRenderDependencyLog = 100
/**
 * PounceElement class - encapsulates JSX element creation and rendering
 */
@unreactive
export class PounceElement {
	// Core properties
	static text(retrieve: () => string | number) {
		return new PounceElement(
			() => {
				let node: Text | undefined
				effect.named('PounceElement.text')(() => {
					if (node) node.data = String(retrieve())
					else node = document.createTextNode(String(retrieve()))
				})
				return node!
			},
			'#text',
			{},
			true,
			true
		)
	}
	constructor(
		public produce: (env: Env) => Node | readonly Node[],
		public tag?: string | ComponentFunction,
		public meta: CompositeAttributesMeta = {},
		public isStatic = false,
		public isSingleNode = false
	) {}
	get conditional() {
		return this.meta.condition || this.meta.if || this.meta.when || this.meta.else || this.meta.pick
	}
	shouldRender(
		alreadyRendered: boolean,
		env: Env,
		picks: Record<string, Set<unknown>>
	): boolean | undefined {
		const meta = this.meta
		if (this.conditional) {
			if (meta.else && alreadyRendered) return false
			if (meta.condition && !collapse(meta.condition)) return false

			if (this.meta.when)
				for (const [key, arg] of Object.entries(this.meta.when)) {
					if (!(key in env)) throw new DynamicRenderingError(`${key} not found in env for when`)
					const v = getEnvPath(env, key)
					if (typeof v !== 'function')
						throw new DynamicRenderingError(`${key} not a predicate in env for when`)
					else if (!v(collapse(arg))) return false
				}

			if (this.meta.if)
				for (const [key, value] of Object.entries(this.meta.if))
					if (collapse(value) !== getEnvPath(env, key)) return false

			if (this.meta.pick && picks) {
				for (const [key, value] of Object.entries(this.meta.pick)) {
					const pickedSet = picks[key]
					// if no set is provided by the oracle (e.g. key missing from env), it fails to pick
					if (!pickedSet || !pickedSet.has(collapse(value))) return false
				}
			}
			return true
		}

		return undefined
	}

	mountCallbacks(target: Node | readonly Node[], env: Env) {
		const t = this.meta.this as any
		if (t) {
			if (t instanceof ReactiveProp && t.set) t.set(target)
			else if (typeof t === 'function') t(target)
		}

		// We consider that the mount CBs (mount/use) are not dynamic - it removes an effect and changing it will bounce in the 1-render fence
		if (this.meta.mount) collapse(this.meta.mount)(target, env)

		// Process use callbacks
		if (this.meta.use)
			for (const [key, v] of Object.entries(this.meta.use) as [string, any]) {
				const usage = getEnvPath(env, key)
				if (typeof usage !== 'function')
					throw new DynamicRenderingError(`${key} in env is not a function`)
				effect.named(`use:${key}`)((access: EffectAccess) => usage(target, collapse(v), access))
			}
	}

	/**
	 * Render the element - executes the produce function with caching
	 */
	render(env: Env = Object.create(rootEnv)): readonly Node[] {
		const tagName = typeof this.tag === 'string' ? this.tag : this.tag?.name || 'anonymous'
		let rv: Node[] | undefined
		let error: Node[] | undefined
		let resetCb: (() => void) | undefined
		const metaCatch = this.meta.catch

		function liftError(partial: Node | readonly Node[]) {
			// set error for if it was caught in the component constructor
			error = Array.isArray(partial) ? partial : reactive([partial])
			// replace error if it was caught while rendering
			rv?.splice(0, rv.length, ...(error || []))
		}

		perf?.mark(`render:${tagName}:start`)
		if (this.isStatic) {
			const partial = this.produce(env)
			if (!partial) throw new DynamicRenderingError('Static renderer returned no content')
			this.mountCallbacks(partial, env)
			perf?.mark(`render:${tagName}:end`)
			perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)
			return (Array.isArray(partial) ? partial : [partial]) as any
		}

		const stopRender = effect.named(`render:${tagName}`)(
			// @ts-expect-error TODO: effect typing: .named -> same type as effect
			({ reaction }) => {
				// If there is a catch clause, we must return a stable mount point (a ReactiveProp)
				// so that when the error occurs, we can dynamically swap the content from the broken nodes to the fallback.
				if (metaCatch) {
					caught((error) => liftError(metaCatch(error, resetCb).render(env)))
					// As we are a boundary, we don't need sub-elements to catch by themselves
					env.catch = undefined
				} else if (typeof env.catch === 'function') {
					caught((error) => {
						const fallback = env.catch(error, resetCb)
						// Avoid re-entrance if the fallback also throws, the ambient catch has to be removed
						if (fallback instanceof PounceElement)
							liftError(fallback.render(Object.create(env, { catch: { value: undefined } })))
						else throw new DynamicRenderingError('env.catch() did not return a PounceElement')
					})
				}
				if (reaction) {
					const msg = [
						`Component <${tagName}> rebuild detected.`,
						...(reaction === true ? ['No reasons given'] : formatCleanupReason(reaction)),
						'\nIt means the component definition refers a reactive value that has been modified, though the component has not been rebuilt as it is considered forbidden to avoid infinite events loops.',
					].join(' ')
					if (pounceOptions.checkReactivity === 'error') throw new DynamicRenderingError(msg)
					reactiveOptions.warn(msg)
				} else {
					const partial = this.produce(env)
					if (error) rv = error
					else {
						if (!partial) throw new DynamicRenderingError('Renderer returned no content')
						this.mountCallbacks(partial, env)
						const arrPartial = (rv = Array.isArray(partial) ? partial : reactive([partial]))
						resetCb = () => {
							return partial && rv?.splice(0, rv.length, ...arrPartial)
						}
					}
				}
			},
			{
				dependencyHook(obj: any, prop: any) {
					if (maxRenderDependencyLog-- > 0)
						console.warn('render effect dependency:', prop, 'on', obj)
				},
			}
		)
		perf?.mark(`render:${tagName}:end`)
		perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)

		// Anchor the render effect to the DOM output so GC doesn't collect it
		// (root effects use FinalizationRegistry — if nobody holds the cleanup, GC kills all children)
		return link(rv || error || [new Text('Throwing PounceElement')], stopRender)
	}
}
export type Component<P = {}, M = Env> = (props: P, meta?: M) => PounceElement
export const emptyChild = new PounceElement(() => [], 'empty')
