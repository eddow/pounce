import {
	addUnreactiveProps,
	attend,
	CompareSymbol,
	effect,
	formatCleanupReason,
	link,
	reactiveOptions,
	root,
	unreactive,
} from 'mutts'
import { perf } from '../perf'
import { type CompositeAttributesMeta, collapse, type ReactiveProp } from './composite-attributes'
import { pounceOptions } from './debug'
import { devCatchElement } from './dev-catch'
import { getEnvPath } from './utils'

export const rootEnv: Env = addUnreactiveProps(
	Object.create(null, {
		catch: { value: devCatchElement },
	})
)

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

function arrayed<T>(v: T | readonly T[]): readonly T[] {
	return Array.isArray(v) ? v : [v as T]
}
export type Env<T = any> = Record<PropertyKey, T>
/**
 * PounceElement class - encapsulates JSX element creation and rendering
 */
@unreactive
export class PounceElement {
	[CompareSymbol](other: unknown, deepCompare: (a: any, b: any) => boolean): boolean {
		if (!(other instanceof PounceElement)) return false
		if (this.tag !== other.tag) return false
		if (this.isReactivityLeaf !== other.isReactivityLeaf) return false
		if (this.isSingleNode !== other.isSingleNode) return false

		// Compare meta (props) deeply
		return deepCompare(this.meta, other.meta)
	}

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
			undefined,
			true,
			true
		)
	}
	constructor(
		public produce: (env: Env) => Node | readonly Node[],
		public tag?: string | ComponentFunction,
		public meta?: CompositeAttributesMeta,
		public isReactivityLeaf = false,
		public isSingleNode = false
	) {}
	get guarded() {
		const guards = this.meta?.guards
		return guards && (guards.condition || guards.if || guards.when || guards.else || guards.pick)
	}
	shouldRender(
		alreadyRendered: boolean,
		env: Env,
		picks: Record<string, Set<unknown>>
	): boolean | undefined {
		const guards = this.meta?.guards
		if (this.guarded) {
			const meta = guards!
			if (meta.else && alreadyRendered) return false
			if (meta.condition && !collapse(meta.condition)) return false

			if (meta.when)
				for (const [key, arg] of Object.entries(meta.when)) {
					if (!(key in env)) throw new DynamicRenderingError(`${key} not found in env for when`)
					const v = getEnvPath(env, key)
					if (typeof v !== 'function')
						throw new DynamicRenderingError(`${key} not a predicate in env for when`)
					else if (!v(collapse(arg))) return false
				}

			if (meta.if)
				for (const [key, value] of Object.entries(meta.if))
					if (collapse(value) !== getEnvPath(env, key)) return false

			if (meta.pick && picks) {
				for (const [key, value] of Object.entries(meta.pick)) {
					const pickedSet = picks[key]
					// if no set is provided by the oracle (e.g. key missing from env), it fails to pick
					if (!pickedSet || !pickedSet.has(collapse(value))) return false
				}
			}
			return true
		}

		return undefined
	}
	/*
We can build layers like that of processChildren. First one will create objects: this: cb[] use: cb[] and named: Map<cb, arg>
Now, depending if they are reactive
this will be treated either with one effect either directly
use will be attended à la morph ( array-diff, ...)  (we will wrap simple uses in effect, their second argument will be EffectAccess), 
named will be managed à la morph too
Note: "à la morph" means it can be attended - if it uses array-diff
*/
	applyDirectives(target: Node | readonly Node[], env: Env) {
		if (!this.meta) return
		const stopThis = root(() =>
			effect.named('attr:this')(() => {
				const these = this.meta!.directives().this
				for (const usage of these) {
					if (typeof usage !== 'function')
						throw new DynamicRenderingError('this directive must resolve to a callback')
					usage(target)
				}
				return () => {
					for (const usage of these) usage(undefined)
				}
			})
		)
		const stopUse = root(() =>
			attend(
				() => this.meta!.directives().use,
				(usage, access) => {
					const cb: unknown = collapse(usage)
					if (!cb) return
					if (typeof cb !== 'function')
						throw new DynamicRenderingError('use directive must resolve to a function')
					return cb(target, access)
				}
			)
		)
		const stopNamed = root(() =>
			attend(
				() => Object.keys(this.meta!.directives().named || {}),
				(key, access) => {
					const cb = getEnvPath<Function>(env, key)
					if (!cb) return
					const arg = collapse(this.meta!.directives().named![key])
					if (typeof cb !== 'function')
						throw new DynamicRenderingError(`use directive ${key} must resolve to a function`)
					return cb(target, arg, access)
				}
			)
		)
		link(target, stopThis, stopUse, stopNamed)
	}

	/**
	 * Render the element - executes the produce function with caching
	 */
	render(env: Env = Object.create(rootEnv)): readonly Node[] {
		// TODO? If ! isReactivityLeaf && static children && children.every(i => i.isReactivityLeaf) ==> isReactivityLeaf = true
		const tagName = typeof this.tag === 'string' ? this.tag : this.tag?.name || 'anonymous'

		perf?.mark(`render:${tagName}:start`)

		if (this.isReactivityLeaf) {
			const partial = this.produce(env)
			if (!partial) throw new DynamicRenderingError('Static renderer returned no content')
			this.applyDirectives(partial, env)
			perf?.mark(`render:${tagName}:end`)
			perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)
			return (Array.isArray(partial) ? partial : [partial]) as any
		}

		let partial: Node | readonly Node[] | undefined
		const stopRender = effect.named(`render:${tagName}`)(({ reaction }) => {
			if (reaction) {
				if (!pounceOptions.checkRebuild) return
				const reasons =
					reaction === true ? ['(no dependency chain available)'] : formatCleanupReason(reaction)
				const msg = [
					`[pounce] Rebuild fence: <${tagName}> has reactive dependencies that changed, but re-running the component body is forbidden (would destroy local state and risk infinite loops).`,
					'Triggered by:',
					...reasons,
					'\nMove the reactive read into a child element, an effect, or a directive instead.',
				].join('\n')
				if (pounceOptions.checkRebuild === 'error') throw new DynamicRenderingError(msg)
				reactiveOptions.warn(msg)
			} else {
				partial = this.produce(env)
				if (!partial) throw new DynamicRenderingError('Renderer returned no content')
				this.applyDirectives(partial, env)
			}
			return () => {
				// TODO: mark the node as destroyed and throw when trying to re-use it
			}
		})
		perf?.mark(`render:${tagName}:end`)
		perf?.measure(`render:${tagName}`, `render:${tagName}:start`, `render:${tagName}:end`)

		const rv = arrayed(partial!)
		// Anchor the render effect to the DOM output so GC doesn't collect it
		// (root effects use FinalizationRegistry — if nobody holds the cleanup, GC kills all children)
		return link(rv || ([new Text('Throwing PounceElement')] as readonly Node[]), stopRender)
	}
}
export type Component<P = {}, M = Env> = (props: P, meta?: M) => PounceElement
export const emptyChild = new PounceElement(() => [], 'empty', undefined, true, true)
