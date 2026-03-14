import { uiComponent } from '@sursaut/ui'

/**
 * PicoCSS variant list
 *
 * PicoCSS uses semantic color names that map to CSS variables:
 * - primary: --pico-primary-color
 * - secondary: --pico-secondary-color
 * - contrast: --pico-contrast-color
 * - danger: --pico-del-color
 * - success: --pico-ins-color
 * - ghost: transparent background
 */
const PICO_VARIANTS = ['primary', 'secondary', 'contrast', 'danger', 'success', 'ghost'] as const
export type PicoVariant = (typeof PICO_VARIANTS)[number]
export type PicoOutlineProps = {
	outline?: boolean
}
export type PicoVariantProps = {
	variant?: PicoVariant
}
export type PicoButtonLikeProps<Props extends { variant?: string }> = Omit<Props, 'variant'> &
	PicoVariantProps &
	PicoOutlineProps

export function picoButtonClass(variant?: PicoVariant, outline?: boolean): string {
	const classes = ['btn']
	if (outline) classes.push('outline')
	if (variant) classes.push(`btn-${variant}`)
	return classes.join(' ')
}

/**
 * Component factory for PicoCSS adapter
 *
 * @example
 * ```tsx
 * export const Button = picoComponent(function Button(props) {
 *   return <button class={picoButtonClass(props.variant ?? 'secondary', props.outline)}>...</button>
 * })
 * ```
 */
export const picoComponent = uiComponent(PICO_VARIANTS)
