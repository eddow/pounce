import { lift, memoize, project, reactive } from 'mutts'
import { pounceOptions } from './debug'
import type { Trait } from './traits'

// Local implementations to avoid circular reference issues with mutts lazy-get
function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

function isObject(value: any): value is object {
	return typeof value === 'object' && value !== null
}

function isPlainObject(value: any): value is object {
	if (!isObject(value)) return false
	const proto = Object.getPrototypeOf(value)
	return proto === null || proto === Object.prototype
}

type AllOptional<T> = {
	[K in keyof T as undefined extends T[K] ? K : never]-?: T[K]
}

type Defaulted<T, D extends Partial<AllOptional<T>>> = Omit<T, keyof D> & Required<D>

export function extend<
	A extends Record<PropertyKey, any>,
	B extends Record<PropertyKey, any> | null,
>(base: B, added?: A): (B extends null ? {} : B) & A {
	return reactive(Object.create(base, Object.getOwnPropertyDescriptors(added || {})))
}

export function defaulted<T, D extends Partial<AllOptional<T>>>(
	base: T,
	defaults: D
): Defaulted<T, D> {
	return Object.setPrototypeOf(base, defaults)
}

type PropsDesc<P extends Record<string, any>> = {
	[K in keyof P]: P[K] | (() => P[K]) | ReactiveProp<P[K]>
}

export function copyObject(into: Record<string, any>, from: Record<string, any>) {
	for (const key of Object.keys(into)) if (!(key in from)) delete into[key]
	return Object.assign(into, from)
}

function readonlyProp(key: PropertyKey, value: any) {
	return () => {
		if (pounceOptions.writeRoProps !== 'ignore') {
			const msg =
				value instanceof ReactiveProp
					? `Property "${String(key)}" has been given a computed value "${value.get}", but it is not a two-way binding`
					: `Property "${String(key)}" has been given the fixed value "${value}", but it is not a two-way binding`
			if (pounceOptions.writeRoProps === 'warn') console.warn(msg)
			else if (pounceOptions.writeRoProps === 'error') throw new Error(msg)
		}
	}
}

export function propsInto<P extends Record<string, any>, S extends Record<string, any>>(
	props: PropsDesc<P>,
	into: S = {} as S
): S & P {
	const descriptors = project(
		props,
		({ key, value }): PropertyDescriptor =>
			value instanceof ReactiveProp
				? {
						get: value.get,
						set: value.set || readonlyProp(key, value),
						enumerable: true,
						configurable: true,
					}
				: isFunction(value)
					? {
							get: memoize(value as () => P[typeof key]),
							set: readonlyProp(key, value),
							enumerable: true,
							configurable: true,
						}
					: {
							get: () => value,
							set: readonlyProp(key, value),
							enumerable: true,
							configurable: true,
						}
	)
	return lift(() => Object.create(into, descriptors)) as S & P
}

export function allPrototypeKeys(obj: object): Iterable<string> {
	const keys = new Set<string>()
	let current: object | null = obj
	while (current && current !== Object.prototype) {
		for (const key of Reflect.ownKeys(current)) {
			if (typeof key === 'string') keys.add(key)
		}
		current = Object.getPrototypeOf(current)
	}
	return keys
}

function traitWarning(key: string) {
	return () => {
		if (pounceOptions.writeRoProps !== 'ignore') {
			const msg = `Trait attribute "${key}" is read-only`
			if (pounceOptions.writeRoProps === 'warn') console.warn(msg)
			else if (pounceOptions.writeRoProps === 'error') throw new Error(msg)
		}
	}
}

export function traitLayer(base: Record<string, any> | null, trait: Trait): Record<string, any> {
	const descriptors: Record<string, PropertyDescriptor> = {}
	if (trait.attributes) {
		for (const [key, value] of Object.entries(trait.attributes)) {
			descriptors[key] = {
				get: () => value,
				set: traitWarning(key),
				enumerable: true,
				configurable: true,
			}
		}
	}
	return reactive(Object.create(base, descriptors))
}

export const array = {
	remove<T>(array: T[], item: T) {
		const index = array.indexOf(item)
		if (index !== -1) array.splice(index, 1)
		return true
	},
	filter<T>(array: T[], filter: (item: T) => boolean) {
		for (let i = 0; i < array.length; ) {
			if (!filter(array[i])) {
				array.splice(i, 1)
			} else {
				++i
			}
		}
		return false
	},
}

export function isElement(value: any): value is JSX.Element {
	return value && isObject(value) && 'render' in value
}
// No way to have it recursive and working
type ComposeArgument = Record<string, any> | ((from: any) => Record<string, any>)
export interface Compose {
	<A extends object>(a: A | (() => A)): A
	<A extends object, B extends object>(a: A | (() => A), b: B | ((x: A) => B)): A & B
	<A extends object, B extends object, C extends object>(
		a: A | (() => A),
		b: B | ((x: A) => B),
		c: C | ((x: A & B) => C)
	): A & B & C
	<A extends object, B extends object, C extends object, D extends object>(
		a: A | (() => A),
		b: B | ((x: A) => B),
		c: C | ((x: A & B) => C),
		d: D | ((x: A & B & C) => D)
	): A & B & C & D
	<A extends object, B extends object, C extends object, D extends object, E extends object>(
		a: A | (() => A),
		b: B | ((x: A) => B),
		c: C | ((x: A & B) => C),
		d: D | ((x: A & B & C) => E)
	): A & B & C & D & E
	<
		A extends object,
		B extends object,
		C extends object,
		D extends object,
		E extends object,
		F extends object,
	>(
		a: A | (() => A),
		b: B | ((x: A) => B),
		c: C | ((x: A & B) => C),
		d: D | ((x: A & B & C) => E),
		e: E | ((x: A & B & C & D) => F)
	): A & B & C & D & E & F
	(...args: readonly ComposeArgument[]): Record<string, any>
}

//#region LLM-proof

export const compose: Compose = (...args: readonly ComposeArgument[]): Record<string, any> => {
	// Pre-process arguments to make plain objects reactive
	const reactiveArgs = args.map((arg) =>
		isPlainObject(arg) ? reactive(arg) : isFunction(arg) ? memoize(arg) : arg
	)
	return new Proxy(Object.create(args.find(isPlainObject) || {}), {
		[Symbol.toStringTag]: 'Composition',
		get(_, prop) {
			for (let i = reactiveArgs.length - 1; i >= 0; i--) {
				const arg = reactiveArgs[i]
				const source = isFunction(arg) ? arg(compose(...reactiveArgs.slice(0, i))) : arg
				if (isObject(source) && prop in source) return (source as any)[prop]
			}
			return undefined
		},
		set(_, prop, value) {
			for (let i = reactiveArgs.length - 1; i >= 0; i--) {
				const arg = reactiveArgs[i]
				const source = isFunction(arg) ? arg(compose(...reactiveArgs.slice(0, i))) : arg
				if (isObject(source) && prop in source) {
					;(source as any)[prop] = value
					return true
				}
			}
			return false
		},
		has(_, prop) {
			for (let i = reactiveArgs.length - 1; i >= 0; i--) {
				const arg = reactiveArgs[i]
				const source = isFunction(arg) ? arg({}) : arg
				if (isObject(source) && prop in source) return true
			}
			return false
		},
		ownKeys() {
			const keys = new Set<string | symbol>()
			for (const arg of reactiveArgs) {
				const source = isFunction(arg) ? arg({}) : arg
				if (isObject(source)) {
					for (const key of Reflect.ownKeys(source)) {
						if (typeof key === 'string' || typeof key === 'symbol') {
							keys.add(key)
						}
					}
				}
			}
			return Array.from(keys)
		},
		getOwnPropertyDescriptor(_, prop) {
			for (let i = reactiveArgs.length - 1; i >= 0; i--) {
				const arg = reactiveArgs[i]
				const source = isFunction(arg) ? arg({}) : arg
				if (isObject(source) && prop in source) {
					const desc = Reflect.getOwnPropertyDescriptor(source, prop)
					if (desc) {
						return {
							enumerable: desc.enumerable,
							configurable: true,
							get: () => (source as any)[prop],
							set: (v: any) => ((source as any)[prop] = v),
						}
					}
				}
			}
			return undefined
		},
		getPrototypeOf() {
			const proto = Object.create(null)
			for (const arg of reactiveArgs) {
				if (isFunction(arg)) continue
				for (const key of Reflect.ownKeys(arg as object)) {
					if (typeof key === 'string' && !(key in proto)) {
						const source = arg
						Object.defineProperty(proto, key, {
							get: () => (source as any)[key],
							set: (v: any) => {
								;(source as any)[key] = v
							},
							enumerable: true,
							configurable: true,
						})
					}
				}
			}
			return proto
		},
	} as ProxyHandler<any>)
}

import { ReactiveProp } from './jsx-factory'

export { r } from './jsx-factory'

/**
 * Extracts property descriptors from an object to allow forwarding reactive bindings.
 * This is crucial when spreading props that contain getters/setters, as standard spread
 * would invoke the getters and pass the values instead of the bindings.
 *
 * @example
 * <Child {...forwardProps(props)} />
 */
export function forwardProps(props: any): any {
	return (
		props &&
		new Proxy(props, {
			get(target, prop) {
				const desc = Object.getOwnPropertyDescriptor(target, prop)
				if (desc && (desc.get || desc.set)) {
					return new ReactiveProp(
						() => (target as any)[prop],
						(v: any) => ((target as any)[prop] = v)
					)
				}
				return (target as any)[prop]
			},
		})
	)
}

//#endregion
