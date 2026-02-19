import { componentStyle } from '@pounce/kit'
import type { FrameworkAdapter } from './types'

componentStyle.sass`
.pounce-variant-primary
	background-color: var(--pounce-primary, #3b82f6)
	color: var(--pounce-fg-inverse, #fff)
	border-color: var(--pounce-primary, #3b82f6)
	--pounce-control-accent: var(--pounce-primary, #3b82f6)

.pounce-variant-secondary
	background-color: var(--pounce-secondary, #64748b)
	color: var(--pounce-fg-inverse, #fff)
	border-color: var(--pounce-secondary, #64748b)
	--pounce-control-accent: var(--pounce-secondary, #64748b)

.pounce-variant-success
	background-color: var(--pounce-success, #15803d)
	color: var(--pounce-fg-inverse, #fff)
	border-color: var(--pounce-success, #15803d)
	--pounce-control-accent: var(--pounce-success, #15803d)

.pounce-variant-danger
	background-color: var(--pounce-danger, #b91c1c)
	color: var(--pounce-fg-inverse, #fff)
	border-color: var(--pounce-danger, #b91c1c)
	--pounce-control-accent: var(--pounce-danger, #b91c1c)

.pounce-variant-warning
	background-color: var(--pounce-warning, #f59e0b)
	color: var(--pounce-fg, #000)
	border-color: var(--pounce-warning, #f59e0b)
	--pounce-control-accent: var(--pounce-warning, #f59e0b)

.pounce-variant-contrast
	background-color: var(--pounce-contrast, #0f172a)
	color: var(--pounce-fg-inverse, #fff)
	border-color: var(--pounce-contrast, #0f172a)
	--pounce-control-accent: var(--pounce-contrast, #0f172a)

@keyframes pounce-fade-in
	from
		opacity: 0
	to
		opacity: 1

@keyframes pounce-fade-out
	from
		opacity: 1
	to
		opacity: 0

.pounce-enter
	animation: pounce-fade-in 200ms ease-out

.pounce-exit
	animation: pounce-fade-out 200ms ease-in
`

/**
 * Standard variant names used by vanilla pounce-* CSS.
 * Each variant maps to a JSX-spreadable attribute bag.
 */
const variantDef = (name: string): JSX.GlobalHTMLAttributes => ({
	class: `pounce-variant-${name}`,
	'data-variant': name,
})

const VANILLA_VARIANTS: Record<string, JSX.GlobalHTMLAttributes> = {
	primary: variantDef('primary'),
	secondary: variantDef('secondary'),
	success: variantDef('success'),
	danger: variantDef('danger'),
	warning: variantDef('warning'),
	contrast: variantDef('contrast'),
}

/**
 * Vanilla adapter for @pounce/ui.
 *
 * Provides standard variants (primary, secondary, success, danger, warning, contrast)
 * that map to the built-in `--pounce-*` CSS variables and `pounce-variant-*` classes.
 *
 * Components work without any adapter (using hardcoded fallback classes), but installing
 * the vanilla adapter enables:
 * - Variant attribute bags on Button, Badge, Pill, Chip (which have no fallback variant classes)
 * - `data-variant` attributes for CSS targeting
 * - Consistent `--pounce-variant-bg` / `--pounce-variant-color` custom properties
 *
 * Tree-shakeable: only imported when explicitly used.
 *
 * @example
 * ```ts
 * import { setAdapter, vanillaAdapter } from '@pounce/ui'
 * setAdapter(vanillaAdapter)
 * ```
 */
export const vanillaAdapter: FrameworkAdapter = {
	variants: VANILLA_VARIANTS,
	transitions: {
		duration: 200,
		enterClass: 'pounce-enter',
		exitClass: 'pounce-exit',
	},
}
