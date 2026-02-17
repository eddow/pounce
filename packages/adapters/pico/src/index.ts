import type { FrameworkAdapter } from '@pounce/ui'
import { picoVariants } from './variants'
import { picoComponents } from './components'
import { picoTransitions } from './transitions'

export { picoVariants } from './variants'
export { picoComponents } from './components'
export { picoTransitions } from './transitions'
export { tooltip } from './directives/index'
export type { TooltipInput, TooltipOptions, TooltipPlacement } from './directives/index'
export { createGlyfIconFactory } from './icons'

/**
 * PicoCSS framework adapter for @pounce/ui.
 *
 * Provides:
 * - Variant attribute bags mapped to PicoCSS class conventions
 * - Per-component class/transition configs
 * - Global transition defaults
 *
 * Usage:
 * ```typescript
 * import { setAdapter } from '@pounce/ui'
 * import { picoAdapter } from '@pounce/adapter-pico'
 * import '@pounce/adapter-pico/css'       // CSS variable bridge
 * import '@picocss/pico/css/pico.min.css' // PicoCSS itself
 *
 * setAdapter(picoAdapter)
 * ```
 *
 * The CSS variable bridge (`@pounce/adapter-pico/css`) remaps
 * `--pounce-*` variables to their `--pico-*` equivalents so that
 * @pounce/ui components inherit PicoCSS theming automatically.
 *
 * Custom semantic variants (danger, success, warning) are also
 * provided via the bridge CSS since PicoCSS has no built-in support.
 */
export const picoAdapter: Partial<FrameworkAdapter> = {
	variants: picoVariants,
	transitions: picoTransitions,
	components: picoComponents
}
