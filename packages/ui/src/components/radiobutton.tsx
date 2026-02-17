import { defaults } from '@pounce/core'
import type { Scope } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'

import { asVariant, variantProps } from '../shared/variants'
import { Icon } from './icon'

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

const RadioButtonBase = (props: RadioButtonProps, scope: Scope) => {
	const adapter = getAdapter('RadioButton')

	const p = defaults(props, { iconPosition: 'start' as const, disabled: false })

	const state = {
		get checked() {
			return props.group !== undefined && props.value !== undefined && props.group === props.value
		},
		get iconElement() {
			if (!props.icon) return null
			if (typeof props.icon === 'string') {
				return (
					<span class="pounce-radiobutton-icon" aria-hidden="true">
						<Icon name={props.icon} />
					</span>
				)
			}
			return <span class="pounce-radiobutton-icon" aria-hidden="true">{props.icon}</span>
		},
		get hasLabel() {
			return !!props.children && (!Array.isArray(props.children) || props.children.some((e: any) => !!e))
		},
		get isIconOnly() {
			return !!props.icon && !this.hasLabel
		},
		get baseClass() {
			return [
				adapter.classes?.base || 'pounce-radiobutton',
				this.checked ? (adapter.classes?.checked || 'pounce-radiobutton-checked') : null,
				this.isIconOnly ? (adapter.classes?.iconOnly || 'pounce-radiobutton-icon-only') : null
			]
		},
	}

	const handleClick = (e: MouseEvent) => {
		if (p.disabled) return
		if (props.onClick) props.onClick(e)
	}

	if (adapter.renderStructure) {
		return adapter.renderStructure({
			props,
			state: state as Record<string, unknown>,
			children: props.children,
			ariaProps: {
				'role': 'radio',
				'aria-checked': `${state.checked}`,
				'aria-label': state.isIconOnly
					? (props.ariaLabel ?? (typeof props.value === 'string' ? props.value : 'Option'))
					: props.ariaLabel,
				'aria-disabled': p.disabled || undefined,
			},
		}, scope)
	}

	return (
		<button
			{...variantProps(props.variant)}
			{...props.el}
			type="button"
			role="radio"
			class={state.baseClass}
			aria-checked={`${state.checked}`}
			aria-label={
				state.isIconOnly
					? (props.ariaLabel ?? props.el?.['aria-label'] ?? (typeof props.value === 'string' ? props.value : 'Option'))
					: (props.ariaLabel ?? props.el?.['aria-label'])
			}
			disabled={p.disabled}
			onClick={handleClick}
		>
			<span if={p.iconPosition === 'start'} class="pounce-radiobutton-icon-wrapper">
				{state.iconElement}
			</span>
			<fragment>
				<span if={state.hasLabel} class="pounce-radiobutton-label">
					{props.children}
				</span>
				<fragment else>{props.children}</fragment>
			</fragment>
			<span if={p.iconPosition === 'end'} class="pounce-radiobutton-icon-wrapper">
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
