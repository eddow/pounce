import { defaults } from '@pounce/core'
import type { Scope } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'

import { asVariant, variantProps } from '../shared/variants'
import { Icon } from './icon'
import { perf } from '../perf'

// Default Button Styles (SASS)
componentStyle.sass`
.pounce-button
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
    border: 1px solid transparent
    background-color: var(--pounce-secondary)
    color: var(--pounce-bg)
    cursor: pointer
    transition: all 0.2s ease
    text-decoration: none
    outline: none
    user-select: none

    &:hover
        filter: brightness(1.1)

    &:active
        filter: brightness(0.9)

    &:disabled
        opacity: 0.5
        cursor: not-allowed

    &.pounce-button-icon-only
        aspect-ratio: 1
        padding: 0
        width: var(--pounce-form-height, 2.5rem)
        height: var(--pounce-form-height, 2.5rem)
    
    .pounce-button-label
        display: inline-flex
        align-items: center
        gap: 0.25rem
`

export type ButtonProps = {
	variant?: string
	icon?: string | JSX.Element
	iconPosition?: 'start' | 'end'
	disabled?: boolean
	onClick?: (e: MouseEvent) => void
	ariaLabel?: string
	tag?: 'button' | 'a' | 'div' | 'span'
	el?: JSX.HTMLAttributes<any>
	children?: JSX.Children
}

const ButtonBase = (props: ButtonProps, scope: Scope) => {
	const adapter = getAdapter('Button')

	const p = defaults(props, { iconPosition: 'start' as const, disabled: false, tag: 'button' as const })

	const state = {
		get onClick() {
			const original = props.onClick ?? (() => { })
			if (!original || p.disabled) return undefined
			return (e: MouseEvent) => {
				perf?.mark('button:click:start')
				original(e)
				perf?.mark('button:click:end')
				perf?.measure('button:click', 'button:click:start', 'button:click:end')
			}
		},
		get iconElement() {
			if (!props.icon) return null
			if (typeof props.icon === 'string') {
				return (
					<span class="pounce-button-icon" aria-hidden="true">
						<Icon name={props.icon} />
					</span>
				)
			}
			return <span class="pounce-button-icon" aria-hidden="true">{props.icon}</span>
		},
		get hasLabel() {
			return !!props.children && (!Array.isArray(props.children) || props.children.some((e: any) => !!e))
		},
		get isIconOnly() {
			return !!props.icon && !this.hasLabel
		},
		get baseClass() {
			return [
				adapter.classes?.base || 'pounce-button',
				this.isIconOnly ? (adapter.classes?.iconOnly || 'pounce-button-icon-only') : null
			]
		},
	}

	// Custom render structure from adapter
	if (adapter.renderStructure) {
		return adapter.renderStructure({
			props,
			state: state as Record<string, unknown>,
			children: props.children,
			ariaProps: {
				'aria-label': state.isIconOnly
					? (props.ariaLabel ?? props.el?.['aria-label'] ?? 'Action')
					: (props.ariaLabel ?? props.el?.['aria-label']),
				'aria-disabled': p.disabled || undefined,
			},
		}, scope)
	}

	return (
		<dynamic
			tag={p.tag}
			{...variantProps(props.variant)}
			{...props.el}
			class={state.baseClass}
			onClick={state.onClick}
			disabled={p.disabled}
			aria-label={
				state.isIconOnly
					? (props.ariaLabel ?? props.el?.['aria-label'] ?? 'Action')
					: (props.ariaLabel ?? props.el?.['aria-label'])
			}
		>
			<span if={p.iconPosition === 'start'} class="pounce-button-icon-wrapper">
				{state.iconElement}
			</span>
			<fragment>
				<span if={state.hasLabel} class="pounce-button-label">
					{props.children}
				</span>
				<fragment else>{props.children}</fragment>
			</fragment>
			<span if={p.iconPosition === 'end'} class="pounce-button-icon-wrapper">
				{state.iconElement}
			</span>
		</dynamic>
	)
}

/**
 * Framework-agnostic Button component with dynamic variant support.
 * Usage: <Button.primary>, <Button.danger>, or <Button variant="custom">
 */
export const Button = asVariant(ButtonBase)
