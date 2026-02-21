// TODO: to review
// TODO: Hungry dog
import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from '../shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

export type RadioButtonProps<Value = unknown> = VariantProps &
	IconProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		/** This button's value */
		value?: Value
		/** The currently selected value in the group — checked = (group === value) */
		group?: Value
		onClick?: (e: MouseEvent) => void
		children?: JSX.Children
	}

export type RadioButtonModel = {
	/** True when group === value */
	readonly checked: boolean
	/** True when icon present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** Spreadable attrs for the `<button>` element */
	readonly button: JSX.IntrinsicElements['button'] & {
		readonly role: 'radio'
		readonly 'aria-checked': 'true' | 'false'
		readonly 'aria-label': string | undefined
		readonly onClick: ((e: MouseEvent) => void) | undefined
	}
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless button-style radio logic with role="radio" semantics.
 *
 * Derives checked state from group === value binding.
 * The adapter renders a `<button>` element (not `<input type=radio>`).
 *
 * @example
 * ```tsx
 * const RadioButton = (props: RadioButtonProps) => {
 *   const model = radioButtonModel(props)
 *   return (
 *     <button
 *       {...model.button}
 *       class={model.checked ? 'checked' : ''}
 *     >
 *       {props.children}
 *     </button>
 *   )
 * }
 * ```
 */
export function radioButtonModel<Value = unknown>(
	props: RadioButtonProps<Value>
): RadioButtonModel {
	const model: RadioButtonModel = {
		get checked() {
			return props.group !== undefined && props.value !== undefined
				? props.group === props.value
				: false
		},
		get hasLabel() {
			return (
				!!props.children &&
				(!Array.isArray(props.children) || props.children.some((e: unknown) => !!e))
			)
		},
		get isIconOnly() {
			return !!props.icon && !model.hasLabel
		},
		get button() {
			return {
				role: 'radio' as const,
				get 'aria-checked'() {
					return model.checked ? 'true' : ('false' as 'true' | 'false')
				},
				get 'aria-label'() {
					return model.isIconOnly
						? (props.ariaLabel ?? (typeof props.value === 'string' ? props.value : 'Option'))
						: props.ariaLabel
				},
				get onClick() {
					if (props.disabled) return undefined
					return props.onClick
				},
			}
		},
	}
	return model
}
