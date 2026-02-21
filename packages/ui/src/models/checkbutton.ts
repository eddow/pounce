// TODO: Hungry dog
import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from '../shared/types'

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

export type CheckButtonModel = {
	/** True when icon present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** Spreadable attrs for the `<button>` element */
	readonly button: JSX.IntrinsicElements['button'] & {
		readonly role: 'checkbox'
		readonly 'aria-checked': 'true' | 'false'
		readonly 'aria-label': string | undefined
		readonly onClick: (e: MouseEvent) => void
	}
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless toggle-button logic with role="checkbox" semantics.
 *
 * Owns internal checked state. The adapter renders a `<button>` element
 * and spreads `model.button`.
 *
 * @example
 * ```tsx
 * const CheckButton = (props: CheckButtonProps) => {
 *   const model = checkButtonModel(props)
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
export function checkButtonModel(props: CheckButtonProps): CheckButtonModel {
	const model: CheckButtonModel = {
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
				role: 'checkbox' as const,
				get 'aria-checked'() {
					return (props.checked ?? false) ? 'true' : ('false' as 'true' | 'false')
				},
				get 'aria-label'() {
					return model.isIconOnly ? (props.ariaLabel ?? 'Toggle') : props.ariaLabel
				},
				get onClick() {
					return (e: MouseEvent) => {
						if (props.disabled) return
						if (props.el?.onClick) (props.el.onClick as (e: MouseEvent) => void)(e)
						if (e.defaultPrevented) return
						props.checked = !(props.checked ?? false)
						props.onCheckedChange?.(props.checked)
					}
				},
			}
		},
	}
	return model
}
