import { type EffectCleanup, isReactive, stringKeys } from 'mutts'
import { styles } from './styles'

export class ReactiveProp<T> {
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
	else?: true
	mount?: (mounted: Node | readonly Node[]) => EffectCleanup
	when?: Record<string, PerhapsReactive<(arg: unknown) => boolean>>
	if?: Record<string, PerhapsReactive<unknown> | true | string>
	use?: Record<
		string,
		PerhapsReactive<(mounted: Node | readonly Node[], value: unknown) => EffectCleanup>
	>
}
const propsProxy: ProxyHandler<CompositeAttributes> & Record<symbol, unknown> = {
	[Symbol.toStringTag]: 'Properties',
	get(target, prop) {
		if (prop === fromAttribute) return target
		if (typeof prop === 'string') return collapse(target.get(prop))
	},
	set(target, prop, value) {
		if (typeof prop === 'string') {
			const rp = target.get(prop)
			if (rp instanceof ReactiveProp && rp.set) {
				rp.set(value)
				return true
			}
		}
		console.warn(`Cannot set property ${String(prop)}`)
		return false
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
						get: () => value.get(),
						set: value.set && ((v) => value.set!(v)),
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

	extractMeta(): CompositeAttributesMeta {
		// Return structured meta as expected by h logic
		return {
			this: this.getSingle('this', true),
			condition: this.getSingle('if', true),
			else: this.getSingle('else', true),
			mount: this.getSingle('use', true),
			when: this.getCategory('when', true),
			use: this.getCategory('use', true),
			if: this.getCategory('if', true),
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
				const val = layer.class
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
				const val = layer.style
				if (Array.isArray(val)) stylesInput.push(...val.flat(Infinity))
				else if (val) stylesInput.push(val)
			}
		// Use the styles utility to merge them correctly into a single object
		return styles(...stylesInput)
	}
}

export const c = (...args: object[]) => new CompositeAttributes(...args)
