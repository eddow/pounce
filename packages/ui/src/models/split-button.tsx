import { reactive } from 'mutts'
import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	VariantProps,
} from '../shared/types'

export type SplitButtonItem<Value = string> = {
	value: Value
	label?: JSX.Children
	disabled?: boolean
	onClick?: (value: Value, e: MouseEvent) => void
}

export type SplitButtonProps<Value = string> = VariantProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		value?: Value
		items: readonly SplitButtonItem<Value>[]
		onClick?: (value: Value | undefined, e: MouseEvent) => void
		onValueChange?: (value: Value) => void
		children?: JSX.Children
		menuAriaLabel?: string
	}

export type SplitButtonModel<Value = string> = {
	readonly selected: SplitButtonItem<Value> | undefined
	readonly hasSelection: boolean
	readonly open: boolean
	readonly button: JSX.IntrinsicElements['button']
	readonly trigger: JSX.IntrinsicElements['button']
	readonly menu: JSX.IntrinsicElements['div']
	readonly items: readonly {
		readonly item: SplitButtonItem<Value>
		readonly button: JSX.IntrinsicElements['button']
		activate: (e: MouseEvent) => void
	}[]
	toggleMenu: (e?: MouseEvent) => void
	closeMenu: () => void
	clickSelected: (e: MouseEvent) => void
}

function findSelected<Value>(props: SplitButtonProps<Value>): SplitButtonItem<Value> | undefined {
	return props.items.find((item) => item.value === props.value)
}

export function splitButtonModel<Value = string>(
	props: SplitButtonProps<Value>
): SplitButtonModel<Value> {
	const state = reactive({ open: false })
	const model: SplitButtonModel<Value> = {
		get selected() {
			return findSelected(props)
		},
		get hasSelection() {
			return model.selected !== undefined
		},
		get open() {
			return state.open
		},
		get button() {
			return {
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
					return props.menuAriaLabel ?? 'Open menu'
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
					get button() {
						return {
							type: 'button' as const,
							role: 'menuitem' as const,
							disabled: props.disabled || item.disabled || undefined,
							onClick:
								props.disabled || item.disabled ? undefined : (e: MouseEvent) => entry.activate(e),
						}
					},
					activate(e: MouseEvent) {
						if (props.disabled || item.disabled) return
						props.onValueChange?.(item.value)
						item.onClick?.(item.value, e)
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
			selected?.onClick?.(selected.value, e)
			props.onClick?.(selected?.value, e)
		},
	}
	return model
}
