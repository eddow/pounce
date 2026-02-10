import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { asVariant, getVariantTrait } from '../shared/variants'
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

	const state = compose(
		{ variant: 'primary', iconPosition: 'start', checked: false },
		props,
		(s) => ({
			get iconElement() {
				if (s.icon === undefined) return null
				return (
					<span
						class={adapter.classes?.icon || 'pounce-checkbutton-icon'}
						aria-hidden={typeof s.icon === 'string' ? true : undefined}
					>
						{typeof s.icon === 'string' ? <Icon name={s.icon} size="18px" /> : s.icon}
					</span>
				)
			},
			get hasLabel() {
				return !!s.children && (!Array.isArray(s.children) || s.children.some((e: unknown) => !!e))
			},
			get isIconOnly() {
				return !!s.icon && !this.hasLabel
			},
			get baseTrait() {
				const classes = [
					adapter.classes?.base || 'pounce-checkbutton',
					s.checked ? (adapter.classes?.checked || 'pounce-checkbutton-checked') : null,
					this.isIconOnly ? (adapter.classes?.iconOnly || 'pounce-checkbutton-icon-only') : null,
				].filter((c): c is string => !!c)
				return { classes }
			},
			get variantTrait() {
				return getVariantTrait(s.variant)
			},
			get allTraits() {
				return [this.baseTrait, this.variantTrait].filter((t): t is import('@pounce/core').Trait => !!t)
			},
		})
	)

	const handleClick = (e: MouseEvent) => {
		if (state.el?.onClick) {
			(state.el.onClick as (e: MouseEvent) => void)(e)
		}
		if (e.defaultPrevented) return
		state.checked = !state.checked
		state.onCheckedChange?.(state.checked)
	}

	return (
		<button
			{...state.el}
			type="button"
			role="checkbox"
			traits={state.allTraits}
			aria-checked={`${state.checked ?? false}`}
			aria-label={state.isIconOnly ? (props['aria-label'] ?? 'Toggle') : props['aria-label']}
			onClick={handleClick}
		>
			{state.iconPosition === 'start' ? state.iconElement : null}
			<span if={state.hasLabel} class={adapter.classes?.label || 'pounce-checkbutton-label'}>
				{state.children}
			</span>
			{state.iconPosition === 'end' ? state.iconElement : null}
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
