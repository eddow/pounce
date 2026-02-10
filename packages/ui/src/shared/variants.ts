import { getGlobalVariants } from '../adapter/registry'
import type { Trait } from '@pounce/core'

export type Variant = string & {}

/**
 * Gets the Trait object for a given variant name from the adapter.
 * 
 * Variants are named traits defined in the adapter's central dictionary.
 * The UI package provides no default variants - all variants must come from the adapter.
 * 
 * @param variant - Variant name to look up
 * @returns Trait object from adapter.variants, or undefined if not found
 * 
 * @example
 * // Adapter defines variants
 * setAdapter({
 *   variants: {
 *     danger: { classes: ['btn-danger'], attributes: { 'aria-live': 'polite' } }
 *   }
 * })
 * 
 * // Component uses variant
 * <Button.danger>  // Looks up adapter.variants['danger']
 * <Button variant="danger">  // Same thing
 */
export function getVariantTrait(variant: string | undefined): Trait | undefined {
	if (!variant) return undefined

	// Look up variant from adapter's central dictionary
	const globalVariants = getGlobalVariants()
	if (globalVariants?.[variant]) {
		return globalVariants[variant]
	}

	// Variant not found in adapter - warn in development
	if (process.env.NODE_ENV !== 'production') {
		console.warn(
			`[pounce/ui] Variant "${variant}" not found in adapter. Define it in setAdapter({ variants: { ${variant}: {...} } })`
		)
	}

	return undefined
}

/**
 * Wraps a component in a proxy that treats any property access as a variant flavor.
 * Example: Button.danger(...) -> Button({ variant: 'danger', ... })
 */
export function asVariant<T extends (...args: never[]) => any>(component: T): T & Record<string, T> {
	return new Proxy(component, {
		get(target, prop, receiver) {
			if (typeof prop === 'string' && !(prop in target)) {
				// Return a wrapper that merges variant into the first argument (props)
				return new Proxy(target, {
					apply(target, thisArg, args: unknown[]) {
						const [props, ...rest] = args
						const mergedProps = props && typeof props === 'object' 
							? { variant: prop, ...props }
							: { variant: prop }
						return Reflect.apply(target, thisArg, [mergedProps, ...rest])
					}
				})
			}
			return Reflect.get(target, prop, receiver)
		},
	}) as T & Record<string, T>
}

