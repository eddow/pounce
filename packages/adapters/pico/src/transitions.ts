import type { TransitionConfig } from '@pounce/ui'

/**
 * PicoCSS transition defaults.
 *
 * Pico v2 uses subtle CSS transitions (typically 200-300ms ease).
 * These global defaults can be overridden per-component in picoComponents.
 */
export const picoTransitions: TransitionConfig = {
	duration: 200,
	enterClass: 'pounce-pico-enter',
	exitClass: 'pounce-pico-exit',
	activeClass: 'pounce-pico-active'
}
