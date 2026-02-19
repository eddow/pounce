import type {
	CheckedProps,
	DisableableProps,
	ElementPassthroughProps,
	VariantProps,
} from '../shared/types'

export type ControlBaseProps = VariantProps &
	DisableableProps &
	CheckedProps &
	ElementPassthroughProps<'input'> & {
		label?: JSX.Element | string
		description?: JSX.Element | string
		name?: string
		children?: JSX.Element | string
	}

export type CheckboxProps = ControlBaseProps

export type RadioProps = ControlBaseProps & {
	value?: string | number
	/** Two-way binding: derives `checked` from `group === value` */
	group?: unknown
}

export type SwitchProps = ControlBaseProps & {
	labelPosition?: 'start' | 'end'
}

export type ControlState = {
	/** The resolved label text (from label prop or children) */
	readonly labelText: JSX.Element | string | undefined
	/** The resolved label element attributes (when label is an object) */
	readonly labelAttrs: Record<string, unknown>
}

export type RadioState = ControlState & {
	/** Derived checked state from group/value or explicit checked prop */
	readonly isChecked: boolean | undefined
}
