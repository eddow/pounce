export type Variant = 'primary' | 'secondary' | 'contrast' | 'danger' | 'success' | 'warning'

// Note: returning an empty string for 'primary' relies on Pico's default button styles.
export function variantClass(variant: Variant | undefined): string {
	if (!variant || variant === 'primary') return ''
	return ['contrast', 'danger', 'success', 'warning'].includes(variant) ? variant : 'secondary'
}
