import { type EffectCleanup, effect, isReactive, reactiveOptions, unreactive } from 'mutts'
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
// TODO: unused - killme
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

const propsProxy: ProxyHandler<{
	composite: CompositeAttributes
	superLayer: Record<string, any> & object
}> &
	Record<symbol, unknown> = {
	[Symbol.toStringTag]: 'Properties',
	get(target, prop) {
		if (prop === fromAttribute) return target.composite
		if (typeof prop === 'string') {
			if (prop in target.superLayer) return target.superLayer[prop]
			const rp = target.composite.get(prop)
			if (rp instanceof ReactiveProp) trackRead(rp)
			return rp instanceof ReactiveProp ? rp.get() : rp
		}
	},
	set(target, prop, value) {
		if (typeof prop === 'string' && !(prop in target.superLayer)) {
			const rp = target.composite.get(prop)
			if (rp instanceof ReactiveProp) return trackWrite(rp, value)
		}
		// TODO: warn?
		return true
	},

	has: (target, prop) =>
		typeof prop === 'string' && (target.composite.keys.has(prop) || prop in target.superLayer),
	ownKeys(target) {
		const gather = new Set<string>(target.composite.keys)
		for (const key of Object.keys(target.superLayer)) gather.add(key)
		return Array.from(gather)
	},
	getOwnPropertyDescriptor(target, prop) {
		if (typeof prop === 'string' && prop in target.superLayer)
			return {
				value: target.superLayer[prop],
				writable: false,
				configurable: true,
				enumerable: true,
			}
		if (typeof prop !== 'string' || !target.composite.keys.has(prop)) return
		const value = target.composite.get(prop)
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

function collapseLayer(layer: any): any {
	return typeof layer === 'function' ? layer() : layer
}

@unreactive
export class CompositeAttributes {
	public layers: (object | (() => any))[]
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
		for (const layer of this.layers.map(collapseLayer)) {
			if (layer instanceof CompositeAttributes) for (const key of layer.keys) keys.add(key)
			else
				for (const key of stringKeys(layer)) {
					if (typeof key === 'string') {
						const colonIndex = key.indexOf(':')
						const rootKey = colonIndex > 0 ? key.slice(0, colonIndex) : key
						if (!this.masked.has(rootKey)) keys.add(rootKey)
					}
				}
		}
		return keys
	}

	getSingle(key: string, nonReactive = false): any {
		if (this.masked.has(key)) return undefined
		// Reverse iteration for precedence (last one wins)
		for (let i = this.layers.length - 1; i >= 0; i--) {
			const rawLayer = this.layers[i]
			//const isDeferred = typeof rawLayer === 'function'
			if (nonReactive && (typeof rawLayer === 'function' || isReactive(rawLayer))) continue
			const layer = collapseLayer(rawLayer)

			if (layer instanceof CompositeAttributes) {
				const inner = layer.getSingle(key, nonReactive)
				if (inner !== undefined) return inner
			} else if (layer && key in layer) {
				if (nonReactive) this.mask(key)
				return layer[key]
			}
		}
		return undefined
	}

	getCategory(category: string, nonReactive = false): Record<string, any> | undefined {
		let result: Record<string, any> | undefined
		const prefix = `${category}:`

		// Reverse iteration for precedence (last one wins)
		for (let i = this.layers.length - 1; i >= 0; i--) {
			const layer = collapseLayer(this.layers[i])
			if (nonReactive && isReactive(layer)) continue

			if (layer instanceof CompositeAttributes) {
				const inner = layer.getCategory(category, nonReactive)
				if (inner) {
					result ??= {}
					Object.assign(result, inner)
				}
				continue
			}

			for (const key of Object.keys(layer)) {
				if (key.startsWith(prefix)) {
					const name = key.slice(prefix.length)
					if (name && !this.masked.has(name) && !result?.hasOwnProperty(name)) {
						if (nonReactive) this.mask(key)
						result ??= {}
						result[name] = layer[key]
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
		for (const layer of this.layers.map(collapseLayer)) {
			if (layer instanceof CompositeAttributes) {
				if (layer.requiresEffect(key)) return true
				continue
			}
			if (Object.hasOwn(layer, key) || key in layer) {
				if (layer[key] instanceof ReactiveProp) return true
			}
			const prefix = `${key}:`
			for (const k of stringKeys(layer)) {
				if (k.startsWith(prefix) && layer[k] instanceof ReactiveProp) return true
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
	asProps(superLayer: Record<string, any> = {}): any {
		return new Proxy({ composite: this, superLayer }, propsProxy)
	}

	mergeClasses() {
		const classes: any[] = []
		for (const layer of this.layers.map(collapseLayer)) {
			if ('class' in layer) {
				const val = collapse(layer.class)
				if (Array.isArray(val)) classes.push(...val.flat(Infinity))
				else if (val) classes.push(val)
			}
		}
		return classes
	}

	mergeStyles() {
		// Collect all styles
		const stylesInput: any[] = []
		for (const layer of this.layers.map(collapseLayer)) {
			if ('style' in layer) {
				const val = collapse(layer.style)
				if (Array.isArray(val)) stylesInput.push(...val.flat(Infinity))
				else if (val) stylesInput.push(val)
			}
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
