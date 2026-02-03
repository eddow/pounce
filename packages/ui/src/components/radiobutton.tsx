import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { asVariant, getVariantClass } from '../shared/variants'

// Default RadioButton Styles (SASS)
componentStyle.sass`
.pounce-radiobutton
    position: relative
    display: inline-flex
    align-items: center
    justify-content: center
    gap: 0.5rem
    padding: 0.5rem 1rem
    font-size: 1rem
    font-weight: 500
    line-height: var(--pounce-form-height, 2.5rem)
    border-radius: var(--pounce-border-radius, 0.5rem)
    border: 1px solid var(--pounce-muted-border, rgba(0, 0, 0, 0.2))
    background-color: transparent
    color: var(--pounce-fg)
    cursor: pointer
    transition: all 0.2s ease
    outline: none
    user-select: none

    &:hover:not(:disabled):not(.pounce-radiobutton-checked)
        background-color: var(--pounce-hover-bg, rgba(0, 0, 0, 0.05))

    &.pounce-radiobutton-checked
        background-color: color-mix(in srgb, var(--pounce-primary) 20%, transparent)
        border-color: var(--pounce-primary)

    &:disabled
        opacity: 0.5
        cursor: not-allowed

    &.pounce-radiobutton-icon-only
        aspect-ratio: 1
        padding: 0
        width: var(--pounce-form-height, 2.5rem)
        height: var(--pounce-form-height, 2.5rem)
    
    .pounce-radiobutton-label
        display: inline-flex
        align-items: center
        gap: 0.25rem
`

export type RadioButtonProps<Value = any> = {
	variant?: string
	icon?: string | JSX.Element
	iconPosition?: 'start' | 'end'
	value?: Value
	group?: Value
	disabled?: boolean
	onClick?: (e: MouseEvent) => void
	ariaLabel?: string
	el?: JSX.HTMLAttributes<any>
	children?: JSX.Children
}

const RadioButtonBase = (props: RadioButtonProps<any>) => {
	const adapter = getAdapter('RadioButton')

	const state = compose(
		{
			variant: 'primary',
			iconPosition: 'start',
			disabled: false,
			onClick: () => { },
		},
		props,
		(s: any) => ({
			get checked() {
				return s.group !== undefined && s.value !== undefined && s.group === s.value
			},
			get iconElement() {
				if (!s.icon) return null

				if (typeof s.icon === 'string') {
					const resolver = adapter.iconResolver
					return (
						<span class="pounce-radiobutton-icon" aria-hidden="true">
							{resolver ? resolver(s.icon) : s.icon}
						</span>
					)
				}

				return <span class="pounce-radiobutton-icon">{s.icon}</span>
			},
			get hasLabel() {
				return !!s.children && (!Array.isArray(s.children) || s.children.some((e: any) => !!e))
			},
			get isIconOnly() {
				return !!s.icon && !this.hasLabel
			},
			get classes() {
				const base = adapter.classes?.base || 'pounce-radiobutton'
				const variant = getVariantClass(s.variant, adapter)
				const checked = this.checked ? (adapter.classes?.checked || 'pounce-radiobutton-checked') : undefined
				const iconOnly = this.isIconOnly
					? adapter.classes?.iconOnly || 'pounce-radiobutton-icon-only'
					: undefined

				return [base, variant, checked, iconOnly, s.el?.class].filter(Boolean)
			},
		})
	)

	const handleClick = (e: MouseEvent) => {
		if (state.disabled) return
		if (state.onClick) state.onClick(e)
	}

	if (adapter.renderStructure) {
		return adapter.renderStructure({
			props,
			state: state as any,
			children: state.children as any,
			ariaProps: {
				'role': 'radio',
				'aria-checked': `${state.checked}`,
				'aria-label': state.isIconOnly
					? (state.ariaLabel ?? (typeof state.value === 'string' ? state.value : 'Option'))
					: state.ariaLabel,
				'aria-disabled': state.disabled || undefined,
			},
		})
	}

	return (
		<button
			{...state.el}
			type="button"
			role="radio"
			aria-checked={`${state.checked}`}
			aria-label={
				state.isIconOnly
					? (state.ariaLabel ?? state.el?.['aria-label'] ?? (typeof state.value === 'string' ? state.value : 'Option'))
					: (state.ariaLabel ?? state.el?.['aria-label'])
			}
			disabled={state.disabled}
			class={state.classes}
			onClick={handleClick}
		>
			<span if={state.iconPosition === 'start'} class="pounce-radiobutton-icon-wrapper">
				{state.iconElement}
			</span>
			<fragment>
				<span if={state.hasLabel} class="pounce-radiobutton-label">
					{state.children}
				</span>
				<fragment else>{state.children}</fragment>
			</fragment>
			<span if={state.iconPosition === 'end'} class="pounce-radiobutton-icon-wrapper">
				{state.iconElement}
			</span>
		</button>
	)
}

/**
 * Framework-agnostic RadioButton component with dynamic variant support.
 * Usage: <RadioButton.primary>, <RadioButton.danger>, or <RadioButton variant="custom">
 */
export const RadioButton = asVariant(RadioButtonBase)
