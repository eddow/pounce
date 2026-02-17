/**
 * PicoCSS variant definitions as JSX-spreadable attribute bags.
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
const primary: JSX.GlobalHTMLAttributes = {
	'data-variant': 'primary'
}

/** Secondary — Pico's muted/secondary style */
const secondary: JSX.GlobalHTMLAttributes = {
	class: 'secondary',
	'data-variant': 'secondary'
}

/** Contrast — Pico's high-contrast inverse style */
const contrast: JSX.GlobalHTMLAttributes = {
	class: 'contrast',
	'data-variant': 'contrast'
}

/** Outline — Pico's outline/ghost style (transparent bg, visible border) */
const outline: JSX.GlobalHTMLAttributes = {
	class: 'outline',
	'data-variant': 'outline'
}

/**
 * Danger — Custom semantic variant extending Pico's design.
 * Styled via pico-bridge.css using --pounce-danger color.
 */
const danger: JSX.GlobalHTMLAttributes = {
	class: 'pounce-pico-danger',
	'data-variant': 'danger',
	'aria-live': 'polite'
}

/**
 * Success — Custom semantic variant extending Pico's design.
 * Styled via pico-bridge.css using --pounce-success color.
 */
const success: JSX.GlobalHTMLAttributes = {
	class: 'pounce-pico-success',
	'data-variant': 'success'
}

/**
 * Warning — Custom semantic variant extending Pico's design.
 * Styled via pico-bridge.css using --pounce-warning color.
 */
const warning: JSX.GlobalHTMLAttributes = {
	class: 'pounce-pico-warning',
	'data-variant': 'warning'
}

export const picoVariants: Record<string, JSX.GlobalHTMLAttributes> = {
	primary,
	secondary,
	contrast,
	outline,
	danger,
	success,
	warning
}
