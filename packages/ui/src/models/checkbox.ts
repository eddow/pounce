import type {
	CheckedProps,
	DisableableProps,
	ElementPassthroughProps,
	VariantProps,
} from '../shared/types'
import { forwardProps } from '../shared/utils'

// TODO: both for checkbox and radio: allow 3-state? (radio: impeach set checked=false)
// ── Shared prop base ────────────────────────────────────────────────────────

type ControlBaseProps = VariantProps &
	DisableableProps &
	CheckedProps &
	ElementPassthroughProps<'input'> & {
		/** Label position relative to the control — 'start' or 'end' (default 'end'). Uses CSS `order` on the input. */
		labelPosition?: 'start' | 'end'
		description?: JSX.Element | string
		name?: string
		children?: JSX.Children
	}

// ── Per-control props ───────────────────────────────────────────────────────

export type CheckboxProps = ControlBaseProps & {
	checked?: boolean
}

export type RadioProps<Value = unknown> = ControlBaseProps & {
	value?: Value
	/**
	 * Two-way binding variable for the radio group.
	 * `checked` is derived from `group === value`.
	 * On selection, `group` is written back to `value` (via Pounce's ReactiveProp setter).
	 */
	group?: Value
}

export type SwitchProps = ControlBaseProps & {
	checked?: boolean
}

// ── State types ─────────────────────────────────────────────────────────────

type InputBase = JSX.IntrinsicElements['input']
type InputCheckbox = Omit<InputBase, 'type' | 'checked' | 'value' | 'onChange'> & {
	type: 'checkbox'
	checked?: boolean
	value?: string
	onChange?: (e: Event) => void
}
type InputRadio = Omit<InputBase, 'type' | 'checked' | 'value' | 'onChange'> & {
	type: 'radio'
	checked: boolean
	value?: string
	onChange?: (e: Event) => void
}
type InputSwitch = Omit<
	InputBase,
	'type' | 'role' | 'checked' | 'value' | 'aria-checked' | 'onChange'
> & {
	type: 'checkbox'
	role: 'switch'
	checked?: boolean
	value?: string
	'aria-checked'?: boolean
	onChange?: (e: Event) => void
}

export type CheckboxModel = {
	/** Spreadable attrs for the `<input>` element — includes `style.order` for label positioning */
	readonly input: InputCheckbox & {
		readonly type: 'checkbox'
		readonly checked?: boolean
		readonly disabled?: boolean
		readonly onChange?: (e: Event) => void
		readonly style: { readonly order: -1 | 0 }
	}
}

export type RadioModel = {
	/** Spreadable attrs for the `<input>` element — includes `style.order` for label positioning */
	readonly input: InputRadio & {
		readonly type: 'radio'
		checked: boolean
		readonly disabled?: boolean
		readonly onChange?: (e: Event) => void
		readonly style: { readonly order: -1 | 0 }
	}
}

export type SwitchModel = {
	/** Spreadable attrs for the `<input>` element — includes `style.order` for label positioning */
	readonly input: InputSwitch & {
		readonly type: 'checkbox'
		readonly role: 'switch'
		readonly checked?: boolean
		readonly disabled?: boolean
		readonly 'aria-checked'?: boolean
		readonly onChange?: (e: Event) => void
		readonly style: { readonly order: -1 | 0 }
	}
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function inputOrder(props: ControlBaseProps): -1 | 0 {
	return props.labelPosition === 'start' ? 0 : -1
}

// ── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Headless checkbox logic.
 *
 * @example
 * ```tsx
 * const Checkbox = (props: CheckboxProps) => {
 *   const model = checkboxModel(props)
 *   return (
 *     <label style="display:inline-flex;align-items:center">
 *       <input {...model.input} />
 *       {gather(props.children)}
 *     </label>
 *   )
 * }
 * ```
 */
export function checkboxModel(props: CheckboxProps): CheckboxModel {
	const model: CheckboxModel = {
		get input() {
			return forwardProps(
				{
					type: 'checkbox' as const,
					get style() {
						return { order: inputOrder(props) }
					},
					get disabled() {
						return props.disabled
					},
					get onChange() {
						return props.onChange
							? (e: Event) => {
									if (e.target instanceof HTMLInputElement) props.onChange!(e.target.checked)
								}
							: undefined
					},
				},
				props,
				'checked'
			)
		},
	}
	return model
}

/**
 * Headless radio logic.
 *
 * @example
 * ```tsx
 * const Radio = (props: RadioProps) => {
 *   const model = radioModel(props)
 *   return (
 *     <label style="display:inline-flex;align-items:center">
 *       <input {...model.input} name={props.name} />
 *       {gather(props.children)}
 *     </label>
 *   )
 * }
 * ```
 */
export function radioModel(props: RadioProps): RadioModel {
	const model: RadioModel = {
		get input() {
			const input: RadioModel['input'] = {
				type: 'radio' as const,
				get style() {
					return { order: inputOrder(props) }
				},
				get checked() {
					return props.group === props.value
				},
				set checked(v) {
					if (v) props.group = props.value
					/* if undefined state allowed? */ else props.group = undefined
				},
				get disabled() {
					return props.disabled
				},
				get onChange() {
					return (e: Event) => {
						if (!(e.target instanceof HTMLInputElement)) return
						input.checked = e.target.checked
						props.onChange?.(e.target.checked)
					}
				},
			}
			return input
		},
	}
	return model
}

/**
 * Headless switch logic.
 *
 * @example
 * ```tsx
 * const Switch = (props: SwitchProps) => {
 *   const model = switchModel(props)
 *   return (
 *     <label style="display:inline-flex;align-items:center">
 *       <input {...model.input} />
 *       {gather(props.children)}
 *     </label>
 *   )
 * }
 * ```
 */
export function switchModel(props: SwitchProps): SwitchModel {
	const model: SwitchModel = {
		get input() {
			return forwardProps(
				{
					type: 'checkbox' as const,
					role: 'switch' as const,
					get style() {
						return { order: inputOrder(props) }
					},
					get disabled() {
						return props.disabled
					},
					get 'aria-checked'() {
						return props.checked
					},
					get onChange() {
						return props.onChange
							? (e: Event) => {
									if (e.target instanceof HTMLInputElement) props.onChange!(e.target.checked)
								}
							: undefined
					},
				},
				props,
				'checked'
			)
		},
	}
	return model
}
