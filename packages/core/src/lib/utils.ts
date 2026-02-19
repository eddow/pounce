import { reactive } from 'mutts'
import { isWeakKey } from './renderer-internal'

const defaultsProxy: ProxyHandler<any> & Record<symbol, unknown> = {
	[Symbol.toStringTag]: 'Defaulted',
	get(target, key) {
		if (typeof key === 'string') return (key in target.props ? target.props : target.defs)[key]
	},
	set(target, key, value) {
		if (typeof key !== 'string') return false
		;((key in target.props ? target.props : target.defs) as Record<string, any>)[key] = value
		return true
	},
	has(target, p) {
		return Reflect.has(target.props, p) || Reflect.has(target.defs, p)
	},
	ownKeys(target) {
		if (!target.keys) {
			const keySet = new Set<PropertyKey>([
				...Reflect.ownKeys(target.props),
				...Reflect.ownKeys(target.defs),
			])
			target.keys = Array.from(keySet).filter((k) => typeof k === 'string')
		}
		return target.keys
	},
	getOwnPropertyDescriptor(target, p) {
		return (
			Reflect.getOwnPropertyDescriptor(target.props, p) ||
			Reflect.getOwnPropertyDescriptor(target.defs, p)
		)
	},
}
/**
 * Creates a proxy over `props` that applies `??` defaults lazily.
 * Safe to call in the component body — no reactive reads happen until
 * a property is accessed (e.g. from JSX bindings wrapped in `r()`).
 *
 * Simulates an object whose *own* properties are defaulted (no prototyping)
 *
 * ```ts
 * const d = defaults(props, { gap: 'md', variant: 'primary' })
 * // d.gap → props.gap ?? 'md'  (deferred)
 * // d.name → props.name         (passthrough)
 * ```
 */
export function defaults<P extends Record<string, any>, D extends Record<string, any>>(
	props: P,
	defs: D
): P & D {
	//Omit<P, keyof D> & { [K in keyof D & keyof P]-?: NonNullable<P[K]> } {
	defs = reactive(defs)
	return new Proxy(
		{ props, defs, keys: undefined as undefined | string[] } as any,
		defaultsProxy
	) as any
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

export function* stringKeys(o: object) {
	for (const key in o) yield key
}

export function* range(start: number, end: number) {
	for (let i = start; i < end; i++) yield `${i}`
}
