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
	/** Current checked state */
	readonly checked: boolean
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
		readonly role: 'checkbox'
		readonly 'aria-checked': 'true' | 'false'
		readonly 'aria-label': string | undefined
		readonly onClick: ((e: MouseEvent) => void) | undefined
	}
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless toggle-button logic with role="checkbox" semantics.
 *
 * Double-binds to `props.checked` — writes back to the prop on toggle.
 * The adapter renders a `<button>` element and spreads `model.button`.
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
 *       {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
 *       {gather(props.children)}
 *     </button>
 *   )
 * }
 * ```
 */
export function checkButtonModel(props: CheckButtonProps): CheckButtonModel {
	const model: CheckButtonModel = {
		get checked() {
			return props.checked ?? false
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
				role: 'checkbox' as const,
				get 'aria-checked'() {
					return model.checked ? 'true' : ('false' as 'true' | 'false')
				},
				get 'aria-label'() {
					return model.isIconOnly ? (props.ariaLabel ?? 'Toggle') : props.ariaLabel
				},
				get onClick() {
					if (props.disabled) return undefined
					return (e: MouseEvent) => {
						props.el?.onClick?.(e)
						if (e.defaultPrevented) return
						props.checked = !props.checked
						props.onCheckedChange?.(props.checked)
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
