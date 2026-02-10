import type { Trait } from '@pounce/core'

/**
 * PicoCSS variant definitions as Trait objects.
 *
 * Pico v2 uses a simple class-based system for buttons:
 * - `primary`: No class needed — Pico's default button style IS primary
 * - `secondary`: `.secondary` class
 * - `contrast`: `.contrast` class
 * - `outline`: `.outline` class (transparent bg, border only)
 *
 * For semantic variants (danger, success, warning), Pico has no built-in support.
 * We provide custom CSS in pico-bridge.css that extends Pico's design language.
 */

/** Primary — Pico's default button style. No extra class needed. */
const primary: Trait = {
	attributes: { 'data-variant': 'primary' }
}

/** Secondary — Pico's muted/secondary style */
const secondary: Trait = {
	classes: ['secondary'],
	attributes: { 'data-variant': 'secondary' }
}

/** Contrast — Pico's high-contrast inverse style */
const contrast: Trait = {
	classes: ['contrast'],
	attributes: { 'data-variant': 'contrast' }
}

/** Outline — Pico's outline/ghost style (transparent bg, visible border) */
const outline: Trait = {
	classes: ['outline'],
	attributes: { 'data-variant': 'outline' }
}

/**
 * Danger — Custom semantic variant extending Pico's design.
 * Styled via pico-bridge.css using --pounce-danger color.
 */
const danger: Trait = {
	classes: ['pounce-pico-danger'],
	attributes: {
		'data-variant': 'danger',
		'aria-live': 'polite'
	}
}

/**
 * Success — Custom semantic variant extending Pico's design.
 * Styled via pico-bridge.css using --pounce-success color.
 */
const success: Trait = {
	classes: ['pounce-pico-success'],
	attributes: { 'data-variant': 'success' }
}

/**
 * Warning — Custom semantic variant extending Pico's design.
 * Styled via pico-bridge.css using --pounce-warning color.
 */
const warning: Trait = {
	classes: ['pounce-pico-warning'],
	attributes: { 'data-variant': 'warning' }
}

export const picoVariants: Record<string, Trait> = {
	primary,
	secondary,
	contrast,
	outline,
	danger,
	success,
	warning
}
