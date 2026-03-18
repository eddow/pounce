import { reactive } from 'mutts'
import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	VariantProps,
} from '../shared/types'

export type SplitRadioButtonItem<Value = string> = {
	value: Value
	label?: JSX.Children
	disabled?: boolean
}

export type SplitRadioButtonProps<Value = string> = VariantProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		value?: Value
		group?: Value
		items: readonly SplitRadioButtonItem<Value>[]
		onClick?: (value: Value | undefined, e: MouseEvent) => void
		onValueChange?: (value: Value) => void
		children?: JSX.Children
		menuAriaLabel?: string
	}

export type SplitRadioButtonModel<Value = string> = {
	readonly selected: SplitRadioButtonItem<Value> | undefined
	readonly checked: boolean
	readonly hasSelection: boolean
	readonly open: boolean
	readonly button: JSX.IntrinsicElements['button'] & {
		readonly role: 'radio'
		readonly 'aria-checked': 'true' | 'false'
	}
	readonly trigger: JSX.IntrinsicElements['button']
	readonly menu: JSX.IntrinsicElements['div']
	readonly items: readonly {
		readonly item: SplitRadioButtonItem<Value>
		readonly checked: boolean
		readonly button: JSX.IntrinsicElements['button'] & {
			readonly role: 'menuitemradio'
			readonly 'aria-checked': 'true' | 'false'
		}
		select: (e: MouseEvent) => void
	}[]
	toggleMenu: (e?: MouseEvent) => void
	closeMenu: () => void
	clickSelected: (e: MouseEvent) => void
}

function findSelected<Value>(
	props: SplitRadioButtonProps<Value>
): SplitRadioButtonItem<Value> | undefined {
	return props.items.find((item) => item.value === props.value)
}

export function splitRadioButtonModel<Value = string>(
	props: SplitRadioButtonProps<Value>
): SplitRadioButtonModel<Value> {
	const state = reactive({ open: false })
	const model: SplitRadioButtonModel<Value> = {
		get selected() {
			return findSelected(props)
		},
		get checked() {
			return model.selected?.value !== undefined && model.selected.value === props.group
		},
		get hasSelection() {
			return model.selected !== undefined
		},
		get open() {
			return state.open
		},
		get button() {
			return {
				role: 'radio' as const,
				get 'aria-checked'() {
					return model.checked ? 'true' : ('false' as 'true' | 'false')
				},
				get onClick() {
					if (props.disabled) return undefined
					return model.clickSelected
				},
				get disabled() {
					return props.disabled || model.selected?.disabled || undefined
				},
				get 'aria-label'() {
					return props.ariaLabel ?? props.el?.['aria-label']
				},
				get 'aria-disabled'() {
					return props.disabled || model.selected?.disabled || undefined
				},
			}
		},
		get trigger() {
			return {
				type: 'button' as const,
				get onClick() {
					if (props.disabled) return undefined
					return model.toggleMenu
				},
				get disabled() {
					return props.disabled || undefined
				},
				get 'aria-label'() {
					return props.menuAriaLabel ?? 'Choose option'
				},
				get 'aria-haspopup'() {
					return 'menu' as const
				},
				get 'aria-expanded'() {
					return model.open ? 'true' : ('false' as 'true' | 'false')
				},
			}
		},
		get menu() {
			return {
				role: 'menu' as const,
				get hidden() {
					return !model.open || undefined
				},
				get 'aria-label'() {
					return props.menuAriaLabel
				},
			}
		},
		get items() {
			return props.items.map((item) => {
				const entry = {
					item,
					get checked() {
						return props.group === item.value
					},
					get button() {
						return {
							type: 'button' as const,
							role: 'menuitemradio' as const,
							get 'aria-checked'() {
								return props.group === item.value ? 'true' : ('false' as 'true' | 'false')
							},
							disabled: props.disabled || item.disabled || undefined,
							onClick:
								props.disabled || item.disabled ? undefined : (e: MouseEvent) => entry.select(e),
						}
					},
					select(e: MouseEvent) {
						if (props.disabled || item.disabled) return
						props.onValueChange?.(item.value)
						props.group = item.value
						props.onClick?.(item.value, e)
						state.open = false
					},
				}
				return entry
			})
		},
		toggleMenu(e?: MouseEvent) {
			e?.preventDefault()
			state.open = !state.open
		},
		closeMenu() {
			state.open = false
		},
		clickSelected(e: MouseEvent) {
			if (props.disabled) return
			const selected = model.selected
			if (selected?.disabled) return
			if (selected?.value !== undefined) props.group = selected.value
			props.onClick?.(selected?.value, e)
		},
	}
	return model
}
