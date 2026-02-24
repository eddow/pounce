import { type EffectCleanup, effect, isReactive, reactiveOptions } from 'mutts'
import { pounceOptions } from './debug'
import { styles } from './styles'
import { stringKeys } from './utils'

export type PropInteraction = 'none' | 'read' | 'write' | 'bidi'

export class ReactiveProp<T> {
	interaction: PropInteraction = 'none'
	constructor(
		public get: () => T,
		public set?: (v: T) => void
	) {}
}
export type PerhapsReactive<T> = T | ReactiveProp<T>
/**
 * Collapse a PerhapsReactive<T> into its concrete T.
 * Like Schrödinger's box: the value is in superposition — it might be a
 * deferred computation (ReactiveProp from babel's r()) or already concrete.
 * Calling collapse() opens the box: if reactive, .get() is invoked (which
 * establishes tracking in a reactive context); if plain, returned as-is.
 */
export const collapse = <T>(v: PerhapsReactive<T>): T => (v instanceof ReactiveProp ? v.get() : v)
export const fromAttribute = Symbol('from attributes')
export interface CompositeAttributesMeta {
	this?: ReactiveProp<Node | readonly Node[]>
	condition?: ReactiveProp<any>
	pick?: Record<string, any>
	else?: true
	mount?: (mounted: Node | readonly Node[], env: Record<PropertyKey, any>) => EffectCleanup
	when?: Record<string, PerhapsReactive<(arg: unknown) => boolean>>
	if?: Record<string, PerhapsReactive<unknown> | true | string>
	use?: Record<
		string,
		PerhapsReactive<(mounted: Node | readonly Node[], value: unknown) => EffectCleanup>
	>
	catch?: (error: unknown, resetCb?: () => void) => JSX.Element
}
function report(msg: string) {
	if (pounceOptions.checkReactivity === 'error') throw new Error(msg)
	reactiveOptions.warn(msg)
}

function trackRead(rp: ReactiveProp<any>) {
	if (!pounceOptions.checkReactivity) return
	if (rp.interaction === 'write') {
		report('[pounce] Prop read after write-only interaction — expected bidi but got write-only')
		rp.interaction = 'bidi'
	} else if (rp.interaction === 'none') {
		rp.interaction = 'read'
	}
}

function trackWrite(rp: ReactiveProp<any>, value: any): boolean {
	if (!rp.set) {
		throw new TypeError(`[pounce] Cannot set read-only prop`)
	}
	if (!pounceOptions.checkReactivity) {
		rp.set(value)
		return true
	}
	if (rp.interaction === 'read') {
		report('[pounce] Prop written after read-only interaction — expected bidi but got read-only')
	}
	const prevTouched = reactiveOptions.touched
	let wasTouched = false
	reactiveOptions.touched = (...args) => {
		wasTouched = true
		prevTouched(...args)
	}
	// Establish a temporary watcher so reactiveOptions.touched fires even with no pre-existing watchers
	let stopWatcher: (() => void) | undefined
	try {
		stopWatcher = effect(function probeWatcher() {
			rp.get()
		})
		rp.set(value)
	} finally {
		reactiveOptions.touched = prevTouched
		stopWatcher?.()
	}
	rp.interaction = wasTouched ? 'bidi' : rp.interaction === 'read' ? 'read' : 'write'
	return true
}

const propsProxy: ProxyHandler<CompositeAttributes> & Record<symbol, unknown> = {
	[Symbol.toStringTag]: 'Properties',
	get(target, prop) {
		if (prop === fromAttribute) return target
		if (typeof prop === 'string') {
			const rp = target.get(prop)
			if (rp instanceof ReactiveProp) trackRead(rp)
			return rp instanceof ReactiveProp ? rp.get() : rp
		}
	},
	set(target, prop, value) {
		if (typeof prop === 'string') {
			const rp = target.get(prop)
			if (rp instanceof ReactiveProp) return trackWrite(rp, value)
		}
		throw new TypeError(`[pounce] Cannot set property ${String(prop)}`)
	},

	has: (target, prop) => typeof prop === 'string' && target.keys.has(prop),
	ownKeys(target) {
		return Array.from(target.keys)
	},
	getOwnPropertyDescriptor(target, prop) {
		if (typeof prop !== 'string' || !target.keys.has(prop)) return
		const value = target.get(prop)
		return {
			enumerable: true,
			configurable: true,
			...(value instanceof ReactiveProp
				? {
						get: () => {
							trackRead(value)
							return value.get()
						},
						set: value.set && ((v) => trackWrite(value, v)),
					}
				: {
						writable: false,
						value,
					}),
		}
	},
}

export class CompositeAttributes {
	public layers: object[]
	private masked: Set<string> = new Set()

	constructor(...layers: any[]) {
		this.layers = layers.filter(Boolean)
	}

	mask(key: string) {
		this.masked.add(key)
	}

	//@memoize
	get keys(): Set<string> {
		const keys = new Set<string>()
		for (const layer of this.layers) {
			for (const key of stringKeys(layer)) {
				if (typeof key === 'string') {
					const colonIndex = key.indexOf(':')
					const rootKey = colonIndex > 0 ? key.slice(0, colonIndex) : key
					if (!this.masked.has(rootKey)) {
						keys.add(rootKey)
					}
				}
			}
		}
		return keys
	}

	getSingle(key: string, nonReactive = false): any {
		if (this.masked.has(key)) return undefined
		// Reverse iteration for precedence (last one wins)
		for (let i = this.layers.length - 1; i >= 0; i--) {
			const layer = this.layers[i]
			if (nonReactive && isReactive(layer)) continue

			if (Object.hasOwn(layer, key) || key in layer) {
				if (nonReactive) this.mask(key)
				const value = (layer as any)[key]
				// Already a ReactiveProp (from babel r() wrapping) — pass through
				if (value instanceof ReactiveProp) return value
				// Reactive layer: wrap access lazily so attachAttribute gets per-key tracking
				if (!nonReactive && isReactive(layer)) return new ReactiveProp(() => (layer as any)[key])
				return value
			}
		}
		return undefined
	}

	getCategory(category: string, nonReactive = false): Record<string, any> | undefined {
		let result: Record<string, any> | undefined
		const prefix = `${category}:`

		// Reverse iteration for precedence (last one wins)
		for (let i = this.layers.length - 1; i >= 0; i--) {
			const layer = this.layers[i]
			if (nonReactive && isReactive(layer)) continue

			for (const key of Object.keys(layer)) {
				if (key.startsWith(prefix)) {
					const name = key.slice(prefix.length)
					if (name) {
						if (nonReactive) this.mask(key)
						result ??= {}
						result[name] = (layer as any)[key]
					}
				}
			}
		}
		return result
	}

	get(key: string): any {
		if (this.masked.has(key)) return undefined

		const single = this.getSingle(key)
		const category = this.getCategory(key)

		// Merge logic:
		if (single !== undefined && category !== undefined) {
			// When single is a ReactiveProp (from reactive layer), wrap the merge lazily
			if (single instanceof ReactiveProp) {
				return new ReactiveProp(() => {
					const resolved = single.get()
					if (typeof resolved === 'object' && resolved !== null && !Array.isArray(resolved))
						return { ...resolved, ...category }
					throw new Error(
						`Invalid attribute type for attribute "${key}": ${typeof resolved} and {${Object.keys(category).join(', ')}}`
					)
				})
			}
			if (typeof single === 'object' && single !== null && !Array.isArray(single)) {
				return { ...single, ...category }
			}
			throw new Error(
				`Invalid attribute type for attribute "${key}": Both ${typeof single} and {${Object.keys(category).join(', ')}}`
			)
		}

		return category || single
	}

	get isReactive(): boolean {
		return this.layers.some(isReactive)
	}

	requiresEffect(key: string): boolean {
		if (this.isReactive) return true
		for (const layer of this.layers) {
			if (Object.hasOwn(layer, key) || key in layer) {
				if ((layer as any)[key] instanceof ReactiveProp) return true
			}
			const prefix = `${key}:`
			for (const k of stringKeys(layer)) {
				if (k.startsWith(prefix) && (layer as any)[k] instanceof ReactiveProp) return true
			}
		}
		return false
	}

	extractMeta(): CompositeAttributesMeta {
		// Return structured meta as expected by h logic
		return {
			this: this.getSingle('this', true),
			condition: this.getSingle('if', true),
			pick: this.getCategory('pick', true),
			else: this.getSingle('else', true),
			mount: this.getSingle('use', true),
			when: this.getCategory('when', true),
			use: this.getCategory('use', true),
			if: this.getCategory('if', true),
			catch: this.getSingle('catch', true),
		}
	}

	/**
	 * Returns a Proxy that acts as a flattened view of the attributes.
	 * This is useful for passing to components that expect a single props object.
	 */
	asProps(): any {
		return new Proxy(this, propsProxy)
	}

	mergeClasses() {
		const classes: any[] = []
		for (const layer of this.layers)
			if ('class' in layer) {
				const val = collapse(layer.class)
				if (Array.isArray(val)) classes.push(...val.flat(Infinity))
				else if (val) classes.push(val)
			}
		return classes
	}

	mergeStyles() {
		// Collect all styles
		const stylesInput: any[] = []
		for (const layer of this.layers)
			if ('style' in layer) {
				const val = collapse(layer.style)
				if (Array.isArray(val)) stylesInput.push(...val.flat(Infinity))
				else if (val) stylesInput.push(val)
			}
		// Use the styles utility to merge them correctly into a single object
		return styles(...stylesInput)
	}
}

export const c = (...args: object[]) => new CompositeAttributes(...args)

export function bind<T>(dst: ReactiveProp<T>, src: ReactiveProp<T>, defaultValue?: T) {
	if (!src.set) throw new Error('src is read-only')
	if (!dst.set) throw new Error('dst is read-only')
	if (defaultValue !== undefined && src.get() == null) src.set!(defaultValue)
	let writing = false
	const stopSrcToDst = effect.named('bind:srcToDst')(() => {
		const v = src.get()
		if (!writing) {
			writing = true
			try {
				dst.set!(v)
			} finally {
				writing = false
			}
		}
	})
	const stopDstToSrc = effect.named('bind:dstToSrc')(() => {
		const v = dst.get()
		if (!writing) {
			writing = true
			try {
				src.set!(v)
			} finally {
				writing = false
			}
		}
	})
	return () => {
		stopSrcToDst()
		stopDstToSrc()
	}
}
