import type { ButtonProps, ButtonState } from './types'

/**
 * Headless button logic.
 *
 * Returns a reactive state object. All properties are getters — safe to call
 * at component construction time without triggering reactive reads.
 *
 * @example
 * ```tsx
 * // In an adapter component:
 * const Button = (props: ButtonProps) => {
 *   const state = useButton(props)
 *   return (
 *     <button
 *       onClick={state.onClick}
 *       disabled={props.disabled}
 *       {...state.ariaProps}
 *       class="my-button"
 *     >
 *       {props.children}
 *     </button>
 *   )
 * }
 * ```
 */
export function useButton(props: ButtonProps): ButtonState {
	return {
		get onClick() {
			if (props.disabled) return undefined
			return props.onClick
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
		get ariaProps() {
			return {
				'aria-label': this.isIconOnly
					? (props.ariaLabel ?? props.el?.['aria-label'] ?? 'Action')
					: (props.ariaLabel ?? props.el?.['aria-label']),
				'aria-disabled': props.disabled || undefined,
			}
		},
	}
}
