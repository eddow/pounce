import type { PounceElement } from '@pounce/core'
import { Icon } from '../icon'
import type {
	AriaLabelProps,
	DisableableProps,
	ElementPassthroughProps,
	IconProps,
	VariantProps,
} from '../shared/types'
import type { LogicalSide } from '../shared/utils'

export type ButtonProps = VariantProps &
	IconProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		tag?: 'button' | 'a' | 'div' | 'span'
		onClick?: (e: MouseEvent) => void
		children?: JSX.Children
	}

export type ButtonModel = {
	/** True when icon is present but no label children */
	readonly isIconOnly: boolean
	/** True when children are non-empty */
	readonly hasLabel: boolean
	/** Resolved element tag — defaults to 'button' */
	readonly tag: 'button' | 'a' | 'div' | 'span'
	/**
	 * Icon wrapper group — only defined when an icon is set.
	 * Spread `model.icon.span` onto the `<span>` wrapping the icon.
	 * CSS `order` positions the icon logically; `marginInline*` adds spacing when a label is present.
	 */
	readonly icon:
		| {
				/** Logical position of the icon */
				readonly position: LogicalSide
				/** Spreadable attrs for the icon `<span>` wrapper */
				readonly span: JSX.IntrinsicElements['span']
				/** Resolved icon element — string icons resolved via `<Icon>`, JSX passed through */
				readonly element?: JSX.Element
		  }
		| undefined
	/** Spreadable attrs for the root `<button>` element */
	readonly button: JSX.IntrinsicElements['button']
}

/**
 * Headless button logic.
 *
 * Returns a reactive model object. All properties are getters — safe to call
 * at component construction time without triggering reactive reads.
 *
 * @example
 * ```tsx
 * const Button = (props: ButtonProps) => {
 *   const model = buttonModel(props)
 *   return (
 *     <button class={`btn-${props.variant}`} {...model.button} {...props.el}>
 *       {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
 *       {gather(props.children)}
 *     </button>
 *   )
 * }
 * ```
 */
export function buttonModel(props: ButtonProps): ButtonModel {
	const model: ButtonModel = {
		get hasLabel() {
			return (
				!!props.children &&
				(!Array.isArray(props.children) || props.children.some((e: unknown) => !!e))
			)
		},
		get isIconOnly() {
			return !!props.icon && !model.hasLabel
		},
		get tag() {
			return props.tag ?? 'button'
		},
		get icon() {
			if (!props.icon) return undefined
			const position: LogicalSide = props.iconPosition ?? 'start'
			const isEnd = position === 'end' || position === 'right'
			const hasLabel = model.hasLabel
			return {
				position: (isEnd ? 'end' : 'start') as 'start' | 'end',
				get element(): PounceElement {
					return typeof props.icon === 'string' ? (
						<Icon name={props.icon} />
					) : (
						(props.icon as PounceElement)
					)
				},
				get span() {
					return {
						style: {
							order: isEnd ? 1 : -1,
							marginInlineEnd: !isEnd && hasLabel ? '0.5em' : undefined,
							marginInlineStart: isEnd && hasLabel ? '0.5em' : undefined,
						},
					}
				},
			}
		},
		get button(): JSX.IntrinsicElements['button'] {
			return {
				get onClick() {
					if (props.disabled) return undefined
					return props.onClick
				},
				get disabled() {
					return props.disabled || undefined
				},
				get 'aria-label'() {
					return model.isIconOnly
						? (props.ariaLabel ?? props.el?.['aria-label'] ?? 'Action')
						: (props.ariaLabel ?? props.el?.['aria-label'])
				},
				get 'aria-disabled'() {
					return props.disabled || undefined
				},
			}
		},
	}
	return model
}
