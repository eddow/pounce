/**
 * Common prop interfaces shared across all headless hooks.
 * Adapters extend these with their own styling concerns.
 */

/** Any component that can be disabled */
export type DisableableProps = {
	disabled?: boolean
}

/** Any component that accepts a variant name (adapter interprets it) */
export type VariantProps = {
	variant?: string
}

/** Any component that accepts an icon (name string or pre-rendered element) */
export type IconProps = {
	icon?: string | JSX.Element
	iconPosition?: 'left' | 'right' | 'start' | 'end'
}

/** Any component that exposes a checked/selected state */
export type CheckedProps = {
	onChange?: (checked: boolean) => void
}

/** Base props passed through to the underlying element */
export type ElementPassthroughProps<T extends keyof JSX.IntrinsicElements = 'div'> = {
	el?: JSX.IntrinsicElements[T]
}

/** A11y label for icon-only components */
export type AriaLabelProps = {
	ariaLabel?: string
}
