import { getGlobalVariants } from '../adapter/registry'

export type Variant = string & {}

/**
 * Returns JSX-spreadable attributes for a given variant name.
 * 
 * Variants are named attribute bags defined in the adapter's central dictionary.
 * The UI package provides no default variants - all variants must come from the adapter.
 * 
 * @param variant - Variant name to look up
 * @returns JSX.GlobalHTMLAttributes from adapter.variants, or `{}` if not found
 * 
 * @example
 * // Adapter defines variants
 * setAdapter({
 *   variants: {
 *     danger: { class: ['btn-danger'], 'aria-live': 'polite' }
 *   }
 * })
 * 
 * // Component spreads variant props (lowest priority, before el and explicit attrs)
 * <Button.danger>  // Looks up adapter.variants['danger']
 * <button {...variantProps('danger')} {...state.el} class={baseClasses}>
 */
export function variantProps(variant: string | undefined): JSX.GlobalHTMLAttributes {
	if (!variant) return {}

	const globalVariants = getGlobalVariants()
	if (globalVariants?.[variant]) {
		return globalVariants[variant]
	}

	if (process.env.NODE_ENV !== 'production') {
		console.warn(
			`[pounce/ui] Variant "${variant}" not found in adapter. Define it in setAdapter({ variants: { ${variant}: {...} } })`
		)
	}

	return {}
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

