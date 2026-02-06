/**
 * Variant system for pounce/core
 * Provides low-level variant objects and application logic
 */

/**
 * A variant defines visual and behavioral modifications that can be applied to any element
 */
export interface Variant {
	/** CSS classes to add or remove */
	classes?: string[] | Record<string, boolean>
	/** Inline styles to apply */
	styles?: Record<string, string | number>
	/** HTML attributes to set */
	attributes?: Record<string, string | boolean | number>
}

const asArray = (item: any): any[] => {
	if (!item) return []
	if (Array.isArray(item)) return item
	if (typeof item === 'string') return item.split(' ').filter(Boolean)
	// We don't treat the case where classes are given as a record of boolean - here we just stack, the construction of a string[] will be done at the really end
	return [item]
}
/**
 * Applies one or more variants to HTML attributes
 * @param props - BaseHTMLAttributes to modify
 * @param variants - Variant object or array of variants
 * @returns Modified BaseHTMLAttributes
 */
export function applyVariants(
	props: JSX.BaseHTMLAttributes,
	variants?: Variant | Variant[]
): JSX.BaseHTMLAttributes {
	variants ??= props.variants
	const result = { ...props } as JSX.BaseHTMLAttributes
	delete result.variants
	for (const variant of asArray(variants)) {
		if (!variant) continue

		// Process classes
		result.class = [...asArray(result.class), ...asArray(variant.classes)]
		// type StyleInput = StyleRecord | string | ---> StyleInput[] <--- | null | undefined | false
		result.style = [...asArray(result.style), ...asArray(variant.styles)]
		Object.assign(result, variant.attributes)
	}

	return result
}
