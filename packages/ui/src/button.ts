import type { Env } from '@pounce/core'
import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from './shared/types'
import { type PhysicalSide, relativeSide } from './shared/utils'

export type ButtonProps = VariantProps &
	IconProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		tag?: 'button' | 'a' | 'div' | 'span'
		onClick?: (e: MouseEvent) => void
		children?: JSX.Children
	}

export type ButtonState = {
	/** Resolved onClick — undefined when disabled */
	readonly onClick: ((e: MouseEvent) => void) | undefined
	/** True when icon is present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** Resolved element tag — defaults to 'button' */
	readonly tag: 'button' | 'a' | 'div' | 'span'
	/**
	 * Physical icon position resolved from left/right/start/end using DisplayContext.direction.
	 * Undefined when no icon is set.
	 */
	readonly iconPosition: PhysicalSide | undefined
	/** A11y attributes to spread onto the root element */
	readonly ariaProps: {
		'aria-label': string | undefined
		'aria-disabled': boolean | undefined
	}
}

/**
 * Headless button logic.
 *
 * Returns a reactive state object. All properties are getters — safe to call
 * at component construction time without triggering reactive reads.
 *
 * @example
 * ```tsx
 * const Button = (props: ButtonProps) => {
 *   const state = useButton(props)
 *   return (
 *     <button onClick={state.onClick} disabled={props.disabled} {...state.ariaProps}>
 *       {props.children}
 *     </button>
 *   )
 * }
 * ```
 */
export function useButton(props: ButtonProps, env: Env): ButtonState {
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
		get tag() {
			return props.tag ?? 'button'
		},
		get iconPosition() {
			if (props.icon) return relativeSide(env.dc, props.iconPosition)
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
