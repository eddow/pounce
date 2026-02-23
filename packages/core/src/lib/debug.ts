import { isDev, reactiveOptions } from 'mutts'
import { window } from '../shared'

export * from './debug-helpers'

// ... (rest of imports)

export class AssertionError extends Error {
	constructor(message: string) {
		super(`Assertion failure: ${message}`)
		this.name = 'AssertionError'
	}
}
export function assert(condition: any, message: string): asserts condition {
	if (!condition) throw new AssertionError(message)
}
export function defined<T>(value: T | undefined, message = 'Value is defined'): T {
	assert(value !== undefined, message)
	return value
}

export const traces: Record<string, typeof console | undefined> = {}
const counters: number[] = []
const debugMutts = false
if (debugMutts) {
	Object.assign(reactiveOptions, {
		garbageCollected(fn: Function) {
			console.log('garbageCollected:', fn.name || fn.toString())
		},
		chain(targets: Function[], caller?: Function) {
			console.groupCollapsed(
				caller
					? `${caller.name} -> ${targets.map((t) => t.name || t.toString()).join(', ')}`
					: `-> ${targets.map((t) => t.name || t.toString()).join(', ')}`
			)
			if (caller) console.log('caller:', caller)
			console.log('targets:', targets)
			console.groupEnd()
			counters[0]++
		},
		beginChain(targets: Function[]) {
			console.groupCollapsed('begin', targets)
			counters.unshift(0)
		},
		endChain() {
			console.groupEnd()
			console.log('Effects:', counters.shift())
		} /*
		touched(obj: any, evolution: Evolution, props?: any[], deps?: Set<ScopedCallback>) {
			console.groupCollapsed('touched', obj, evolution)
			console.log('props:', props)
			console.log('deps:', deps)
			console.groupEnd()
		},
		enter(fn: Function) {
			console.group('enter', fn.name || fn.toString())
			console.log('effect:', fn)
		},
		leave() {
			console.groupEnd()
		},*/,
	})
}

reactiveOptions.maxEffectChain = 5000
reactiveOptions.maxEffectReaction = 'debug'
reactiveOptions.instanceMembers = false

export const testing: {
	renderingEvent?: (evt: string, ...args: any[]) => void
} = {}

export const perfCounters = {
	componentRenders: 0,
	elementRenders: 0,
	renderCacheHits: 0,
	reconciliations: 0,
	forIterations: 0,
	dynamicSwitches: 0,
	reset() {
		this.componentRenders = 0
		this.elementRenders = 0
		this.renderCacheHits = 0
		this.reconciliations = 0
		this.forIterations = 0
		this.dynamicSwitches = 0
	},
	get cacheHitRatio() {
		const total = this.componentRenders + this.elementRenders + this.renderCacheHits
		return total === 0 ? 0 : this.renderCacheHits / total
	},
}

/**
 * Pounce framework configuration options
 * These can be modified at runtime to adjust framework behavior
 */
const isDevMode = isDev

export const pounceOptions = {
	/**
	 * Maximum number of component rebuilds allowed in a time window before triggering a warning
	 * Set to 0 to disable hyper-build detection
	 */
	maxRebuildsPerWindow: 1000,
	rebuildWindowMs: 100,

	/**
	 * Controls reactivity interaction tracking on ReactiveProp instances.
	 * Each prop tracks its interaction pattern (none/read/write/bidi).
	 * On get: reports if the prop was previously only written to.
	 * On set: probes whether the setter actually called `touched` (i.e. is truly reactive);
	 *         reports if the prop was previously only read.
	 * - false: disabled (production)
	 * - 'warn': console.warn on violations (default in dev)
	 * - 'error': throw on violations (debug)
	 */
	checkReactivity: 'warn' as false | 'warn' | 'error',

	/**
	 * When true, latch() wraps content in a fragment with a default dev error boundary.
	 * Renders a visible error panel in the DOM instead of a blank screen on unhandled throws.
	 * Defaults to true in dev mode (not production, not test).
	 */
	devCatch: isDevMode,
}

/** Preset for production: no reactivity checks, no rebuild detection overhead */
export const prodPreset: Partial<typeof pounceOptions> = {
	maxRebuildsPerWindow: 0,
	checkReactivity: false,
	devCatch: false,
}

/** Preset for development (default): reactivity checks warn, rebuild detection on */
export const devPreset: Partial<typeof pounceOptions> = {
	maxRebuildsPerWindow: 1000,
	checkReactivity: 'warn',
	devCatch: true,
}

/** Preset for debug: reactivity violations throw, stricter write-to-read-only handling */
export const debugPreset: Partial<typeof pounceOptions> = {
	maxRebuildsPerWindow: 1000,
	checkReactivity: 'error',
	devCatch: true,
}

try {
	const win = window as any
	if (win) {
		win.reactiveOptions = reactiveOptions
		win.__POUNCE_PERF__ = perfCounters
	}
} catch {
	// Platform not yet bound, ignore
}
