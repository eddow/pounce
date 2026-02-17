import { arrayDiff, effect, isReactive, reactive, tag, unreactive } from 'mutts'
import { isWeakKey } from './renderer-internal'

/**
 * Creates a proxy over `props` that applies `??` defaults lazily.
 * Safe to call in the component body — no reactive reads happen until
 * a property is accessed (e.g. from JSX bindings wrapped in `r()`).
 *
 * ```ts
 * const d = defaults(props, { gap: 'md', variant: 'primary' })
 * // d.gap → props.gap ?? 'md'  (deferred)
 * // d.name → props.name         (passthrough)
 * ```
 */
export function defaults<
	P,
	D extends { [K in keyof D]: K extends keyof P ? NonNullable<P[K]> : never },
>(props: P, defs: D): Omit<P, keyof D> & { [K in keyof D & keyof P]-?: NonNullable<P[K]> } {
	return new Proxy(props as any, {
		get(target, key, receiver) {
			const val = Reflect.get(target, key, receiver)
			if (typeof key === 'string' && key in defs) return val ?? defs[key as keyof D]
			return val
		},
	}) as any
}

export function extend<
	A extends Record<PropertyKey, any>,
	B extends Record<PropertyKey, any> | null,
>(base: B, added?: A): (B extends null ? {} : B) & A {
	return reactive(Object.create(base, Object.getOwnPropertyDescriptors(added || {})))
}

export function weakCached<I, O>(fn: (arg: I) => O): (arg: I) => O {
	const cache = new WeakMap<I & WeakKey, O>()
	return (arg: I) => {
		if (!isWeakKey(arg)) return fn(arg)
		if (cache.has(arg)) return cache.get(arg)!
		const result = fn(arg)
		cache.set(arg, result)
		return result
	}
}
