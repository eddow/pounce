import { defaults } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { reactive } from 'mutts'
import { getAdapter } from '../adapter/registry'
import { asVariant, variantProps } from '../shared/variants'
import { Icon } from './icon'

componentStyle.sass`
.pounce-checkbutton
	display: inline-flex
	align-items: center
	gap: 0.5rem
	position: relative
	margin: 0

	.pounce-checkbutton-icon
		display: inline-flex
		align-items: center

	.pounce-checkbutton-label
		display: inline-flex
		align-items: center
		gap: 0.25rem

button.pounce-checkbutton
	border-color: var(--pounce-border-color, rgba(0, 0, 0, 0.2))

button.pounce-checkbutton:not(.pounce-checkbutton-checked)
	background-color: transparent
	border-width: 1px
	color: var(--pounce-fg)

button.pounce-checkbutton.pounce-checkbutton-checked
	background-color: color-mix(in srgb, var(--pounce-primary, #3b82f6) 20%, transparent)
	color: var(--pounce-fg)

button.pounce-checkbutton:not(.pounce-checkbutton-checked):hover
	background-color: var(--pounce-bg-hover, rgba(0, 0, 0, 0.05))

button.pounce-checkbutton.pounce-checkbutton-checked:hover
	filter: brightness(0.95)
`

/** Props for {@link CheckButton}. */
export type CheckButtonProps = {
	/** Variant name — looked up in adapter. @default 'primary' */
	variant?: string
	/** Icon name (resolved via adapter iconFactory) or JSX element. */
	icon?: string | JSX.Element
	/** Icon placement relative to label. @default 'start' */
	iconPosition?: 'start' | 'end'
	/** Controlled checked state. @default false */
	checked?: boolean
	/** Called when checked state changes (after internal toggle). */
	onCheckedChange?: (checked: boolean) => void
	/** Pass-through HTML attributes for the underlying `<button>`. */
	el?: JSX.HTMLAttributes<'button'>
	children?: JSX.Children
	/** Accessible label — required when rendering icon-only (no children). */
	'aria-label'?: string
}

const CheckButtonBase = (props: CheckButtonProps) => {
	const adapter = getAdapter('CheckButton')

	const local = reactive({ checked: props.checked ?? false })

	const p = defaults(props, { iconPosition: 'start' as const })

	const state = {
		get iconElement() {
			if (props.icon === undefined) return null
			return (
				<span
					class={adapter.classes?.icon || 'pounce-checkbutton-icon'}
					aria-hidden={typeof props.icon === 'string' ? true : undefined}
				>
					{typeof props.icon === 'string' ? <Icon name={props.icon} size="18px" /> : props.icon}
				</span>
			)
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
		get baseClass() {
			return [
				adapter.classes?.base || 'pounce-checkbutton',
				local.checked ? adapter.classes?.checked || 'pounce-checkbutton-checked' : null,
				this.isIconOnly ? adapter.classes?.iconOnly || 'pounce-checkbutton-icon-only' : null,
			]
		},
	}

	const handleClick = (e: MouseEvent) => {
		if (props.el?.onClick) {
			;(props.el.onClick as (e: MouseEvent) => void)(e)
		}
		if (e.defaultPrevented) return
		local.checked = !local.checked
		props.onCheckedChange?.(local.checked)
	}

	return (
		<button
			type="button"
			{...variantProps(props.variant)}
			{...props.el}
			role="checkbox"
			class={state.baseClass}
			aria-checked={`${local.checked}`}
			aria-label={state.isIconOnly ? (props['aria-label'] ?? 'Toggle') : props['aria-label']}
			onClick={handleClick}
		>
			{p.iconPosition === 'start' ? state.iconElement : null}
			<span if={state.hasLabel} class={adapter.classes?.label || 'pounce-checkbutton-label'}>
				{props.children}
			</span>
			{p.iconPosition === 'end' ? state.iconElement : null}
		</button>
	)
}

/**
 * Toggle button with `role="checkbox"` semantics.
 *
 * Supports variant dot-syntax: `<CheckButton.danger>`.
 *
 * @example
 * ```tsx
 * <CheckButton icon="star" checked={fav} onCheckedChange={setFav}>Favorite</CheckButton>
 * ```
 *
 * Adapter key: `CheckButton` (IconAdaptation)
 */
export const CheckButton = asVariant(CheckButtonBase)
