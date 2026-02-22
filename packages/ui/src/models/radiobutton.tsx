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
 *       {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
 *       {gather(props.children)}
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
					return (e: MouseEvent) => {
						props.el?.onClick?.(e)
						if (e.defaultPrevented) return
						props.onClick?.(e)
						// Radio selection: write to group binding
						if (props.value !== undefined) props.group = props.value
					}
				},
				get disabled() {
					return props.disabled || undefined
				},
				get 'aria-disabled'() {
					return props.disabled || undefined
				},
			}
		},
	}
	return model
}
