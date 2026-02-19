import { uiComponent } from '@pounce/ui'

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

/**
 * Component factory for PicoCSS adapter
 *
 * @example
 * ```tsx
 * export const Button = picoComponent(function Button(props) {
 *   return <button class={`btn btn-${props.variant ?? 'secondary'}`}>...</button>
 * })
 * ```
 */
export const picoComponent = uiComponent(PICO_VARIANTS)
