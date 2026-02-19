import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from './shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

export type CheckButtonProps = VariantProps &
	IconProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		/** Controlled checked state */
		checked?: boolean
		/** Called after internal toggle */
		onCheckedChange?: (checked: boolean) => void
		children?: JSX.Children
	}

export type CheckButtonState = {
	/** Current checked state (internal, toggled on click) */
	readonly checked: boolean
	/** True when icon present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** role="checkbox" for the button element */
	readonly role: 'checkbox'
	/** aria-checked string value */
	readonly ariaChecked: 'true' | 'false'
	/** aria-label (required when icon-only) */
	readonly ariaLabel: string | undefined
	/** Click handler — toggles checked and calls onCheckedChange */
	readonly onClick: (e: MouseEvent) => void
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless toggle-button logic with role="checkbox" semantics.
 *
 * Owns internal checked state. The adapter renders a `<button>` element
 * and wires state.onClick, state.role, state.ariaChecked.
 *
 * @example
 * ```tsx
 * const CheckButton = (props: CheckButtonProps) => {
 *   const state = useCheckButton(props)
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
export function useCheckButton(props: CheckButtonProps): CheckButtonState {
	let checked = props.checked ?? false

	return {
		get checked() {
			return checked
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
		get role(): 'checkbox' {
			return 'checkbox'
		},
		get ariaChecked() {
			return checked ? 'true' : 'false'
		},
		get ariaLabel() {
			return this.isIconOnly ? (props.ariaLabel ?? 'Toggle') : props.ariaLabel
		},
		get onClick() {
			return (e: MouseEvent) => {
				if (props.disabled) return
				if (props.el?.onClick) {
					;(props.el.onClick as (e: MouseEvent) => void)(e)
				}
				if (e.defaultPrevented) return
				checked = !checked
				props.onCheckedChange?.(checked)
			}
		},
	}
}
