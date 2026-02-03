import type { ComponentAdapter } from '../adapter/types'

export type Variant = string & {}

export const STANDARD_VARIANTS = [
	'primary',
	'secondary',
	'contrast',
	'danger',
	'success',
	'warning',
]

/**
 * Generates the CSS class for a given variant.
 * First checks the adapter mapping, then falls back to .pounce-variant-* convention.
 */
export function getVariantClass(
	variant: string | undefined,
	adapter?: ComponentAdapter
): string | undefined {
	if (!variant) return undefined

	// 1. Check adapter mapping
	if (adapter?.classes?.[variant]) {
		return adapter.classes[variant]
	}

	// 2. Check Standard Vanilla
	if (STANDARD_VARIANTS.includes(variant)) {
		return `pounce-variant-${variant}`
	}

	// 3. Unknown variant: Fail in development
	if (process.env.NODE_ENV !== 'production') {
		console.error(
			`[pounce/ui] Unknown variant "${variant}". Ensure it is registered in the adapter or is a standard variant.`
		)
	}

	return undefined
}

/**
 * Wraps a component in a proxy that treats any property access as a variant flavor.
 * Example: Button.danger(...) -> Button({ variant: 'danger', ... })
 */
export function asVariant<T extends (props: any) => any>(component: T): T & Record<string, T> {
	return new Proxy(component, {
		get(target, prop, receiver) {
			if (typeof prop === 'string' && !(prop in target)) {
				// Return a wrapper that merges variant into the first argument (props)
				return new Proxy(target, {
					apply(target, thisArg, args: any[]) {
						const [props, ...rest] = args
						const mergedProps = props && typeof props === 'object' 
							? { variant: prop, ...props }
							: { variant: prop }
						return target.apply(thisArg, [mergedProps, ...rest] as any)
					}
				})
			}
			return Reflect.get(target, prop, receiver)
		},
	}) as any
}

/**
 * Shorthand for getVariantClass without an adapter.
 */
export function variantClass(variant: string | undefined): string | undefined {
	return getVariantClass(variant)
}
