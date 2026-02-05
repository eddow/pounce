import type { ComponentAdapter } from '../adapter/types'
import { getGlobalVariants } from '../adapter/registry'

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
 * Resolution order:
 * 1. Component-specific adapter mapping (most specific)
 * 2. Global adapter variants (framework-wide)
 * 3. Standard vanilla convention (.pounce-variant-*)
 */
export function getVariantClass(
	variant: string | undefined,
	adapter?: ComponentAdapter
): string | undefined {
	if (!variant) return undefined

	// 1. Check component-specific adapter mapping
	if (adapter?.classes?.[variant]) {
		return adapter.classes[variant]
	}

	// 2. Check global adapter variants
	const globalVariants = getGlobalVariants()
	if (globalVariants?.[variant]) {
		return globalVariants[variant]
	}

	// 3. Check Standard Vanilla
	if (STANDARD_VARIANTS.includes(variant)) {
		return `pounce-variant-${variant}`
	}

	// 4. Unknown variant: Fail in development
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
