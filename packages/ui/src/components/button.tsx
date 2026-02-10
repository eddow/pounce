import type { Scope } from '@pounce/core'
import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { useDisplayContext } from '../display/display-context'
import { asVariant, getVariantTrait } from '../shared/variants'
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

	const state = compose(
		{
			variant: 'primary',
			iconPosition: 'start',
			disabled: false,
			onClick: () => {},
			ariaLabel: undefined as string | undefined,
			tag: 'button' as const,
		},
		props,
		(s: any) => ({
			get onClick() {
				const original = s.onClick
				if (!original || s.disabled) return undefined
				return (e: MouseEvent) => {
					perf?.mark('button:click:start')
					original(e)
					perf?.mark('button:click:end')
					perf?.measure('button:click', 'button:click:start', 'button:click:end')
				}
			},
			get iconElement() {
				if (!s.icon) return null

				if (typeof s.icon === 'string') {
					return (
						<span class="pounce-button-icon" aria-hidden="true">
							<Icon name={s.icon} />
						</span>
					)
				}

				return <span class="pounce-button-icon" aria-hidden="true">{s.icon}</span>
			},
			get hasLabel() {
				return !!s.children && (!Array.isArray(s.children) || s.children.some((e: any) => !!e))
			},
			get isIconOnly() {
				return !!s.icon && !this.hasLabel
			},
			get baseTrait() {
				const classes = [
					adapter.classes?.base || 'pounce-button',
					this.isIconOnly ? (adapter.classes?.iconOnly || 'pounce-button-icon-only') : null
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

	// Custom render structure from adapter
	if (adapter.renderStructure) {
		return adapter.renderStructure({
			props,
			state: state as Record<string, unknown>,
			children: state.children,
			ariaProps: {
				'aria-label': state.isIconOnly
					? (state.ariaLabel ?? state.el?.['aria-label'] ?? 'Action')
					: (state.ariaLabel ?? state.el?.['aria-label']),
				'aria-disabled': state.disabled || undefined,
			},
		}, useDisplayContext(scope))
	}

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			traits={state.allTraits}
			onClick={state.onClick}
			disabled={state.disabled}
			aria-label={
				state.isIconOnly
					? (state.ariaLabel ?? state.el?.['aria-label'] ?? 'Action')
					: (state.ariaLabel ?? state.el?.['aria-label'])
			}
		>
			<span if={state.iconPosition === 'start'} class="pounce-button-icon-wrapper">
				{state.iconElement}
			</span>
			<fragment>
				<span if={state.hasLabel} class="pounce-button-label">
					{state.children}
				</span>
				<fragment else>{state.children}</fragment>
			</fragment>
			<span if={state.iconPosition === 'end'} class="pounce-button-icon-wrapper">
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
