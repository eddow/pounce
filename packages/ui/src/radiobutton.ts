import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from './shared/types'

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

export type RadioButtonState = {
	/** True when group === value */
	readonly checked: boolean
	/** True when icon present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** role="radio" for the button element */
	readonly role: 'radio'
	/** aria-checked string value */
	readonly ariaChecked: 'true' | 'false'
	/** aria-label (required when icon-only) */
	readonly ariaLabel: string | undefined
	/** Click handler — calls props.onClick when not disabled */
	readonly onClick: ((e: MouseEvent) => void) | undefined
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
 *   const state = useRadioButton(props)
 *   return (
 *     <button
 *       role={state.role}
 *       aria-checked={state.ariaChecked}
 *       aria-label={state.ariaLabel}
 *       onClick={state.onClick}
 *       class={state.checked ? 'checked' : ''}
 *     >
 *       {props.children}
 *     </button>
 *   )
 * }
 * ```
 */
export function useRadioButton<Value = unknown>(props: RadioButtonProps<Value>): RadioButtonState {
	return {
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
			return !!props.icon && !this.hasLabel
		},
		get role(): 'radio' {
			return 'radio'
		},
		get ariaChecked() {
			return this.checked ? 'true' : 'false'
		},
		get ariaLabel() {
			return this.isIconOnly
				? (props.ariaLabel ?? (typeof props.value === 'string' ? props.value : 'Option'))
				: props.ariaLabel
		},
		get onClick() {
			if (props.disabled) return undefined
			return props.onClick
		},
	}
}
