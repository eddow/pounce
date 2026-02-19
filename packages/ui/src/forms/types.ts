import type { DisableableProps, VariantProps } from '../shared/types'

export type SelectProps = VariantProps &
	DisableableProps &
	JSX.IntrinsicElements['select'] & {
		fullWidth?: boolean
	}

export type ComboboxOption = string | { value: string; label?: string }

export type ComboboxProps = VariantProps &
	DisableableProps &
	JSX.IntrinsicElements['input'] & {
		options?: readonly ComboboxOption[]
	}

export type SelectState = {
	readonly fullWidthClass: boolean
}

export type ComboboxState = {
	/** Generated or provided datalist id */
	readonly listId: string
}
