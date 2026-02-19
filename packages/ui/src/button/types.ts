import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from '../shared/types'

export type ButtonProps = VariantProps &
	IconProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		tag?: 'button' | 'a' | 'div' | 'span'
		onClick?: (e: MouseEvent) => void
		children?: JSX.Children
	}

export type ButtonState = {
	/** Resolved onClick — undefined when disabled */
	readonly onClick: ((e: MouseEvent) => void) | undefined
	/** True when icon is present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** A11y attributes to spread onto the root element */
	readonly ariaProps: {
		'aria-label': string | undefined
		'aria-disabled': boolean | undefined
	}
}
