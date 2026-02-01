import { compose } from '@pounce/core'
import { css } from '../lib/css'
import { Icon } from './icon'
import { Variant, variantClass } from './variants'

css`
.pp-button {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin: 0;
	overflow: visible;
}

.pp-button .pp-button-icon {
	display: inline-flex;
	align-items: center;
}

.pp-button .pp-button-label {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
}

.pp-button-icon-only {
	aspect-ratio: 1;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
	max-width: calc(var(--pico-form-element-height, 2.5rem));
	max-height: calc(var(--pico-form-element-height, 2.5rem));
	width: calc(var(--pico-form-element-height, 2.5rem));
	height: calc(var(--pico-form-element-height, 2.5rem));
}

.pp-button-icon-only .pp-button-icon {
	max-width: 1.5rem;
	max-height: 1.5rem;
	flex-shrink: 1;
}

.pp-button-icon-only .pp-button-icon .pure-glyf-icon {
	max-width: 1.5rem;
	max-height: 1.5rem;
}
`

export type ButtonProps = {
	variant?: Variant
	icon?: string | JSX.Element
	iconPosition?: 'start' | 'end'
	el?: JSX.HTMLAttributes<'button'>
	ariaLabel?: string
	children?: JSX.Children
	onClick?: (event: MouseEvent) => void
	tag?: 'button' | 'span' | 'div'
}

export const Button = (props: ButtonProps) => {
	const state = compose(
		{
			variant: 'primary',
			iconPosition: 'start',
			onClick: () => {},
			ariaLabel: undefined as string | undefined,
			tag: 'button' as const,
		},
		props,
		(state) => ({
			get iconElement() {
				return state.icon !== undefined ? (
					<span
						class="pp-button-icon"
						aria-hidden={typeof state.icon === 'string' ? true : undefined}
					>
						{typeof state.icon === 'string' ? <Icon icon={state.icon} size="18px" /> : state.icon}
					</span>
				) : null
			},
			get hasLabel() {
				return (
					!!state.children && (!Array.isArray(state.children) || state.children.some((e) => !!e))
				)
			},
			get isIconOnly() {
				return state.icon && !this.hasLabel
			},
		})
	)

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			onClick={state.onClick}
			aria-label={
				state.isIconOnly
					? (state.ariaLabel ?? state.el?.['aria-label'] ?? 'Action')
					: (state.ariaLabel ?? (state.el as any)?.['aria-label'])
			}
			class={[
				'pp-button',
				variantClass(state.variant),
				state.isIconOnly ? 'pp-button-icon-only' : undefined,
				state.el?.class,
			]}
		>
			<span if={state.iconPosition === 'start'} class="pp-button-icon">
				{state.iconElement}
			</span>
			<fragment>
				<span if={state.hasLabel} class="pp-button-label">
					{state.children}
				</span>
				<fragment else>{state.children}</fragment>
			</fragment>
			<span if={state.iconPosition === 'end'} class="pp-button-icon">
				{state.iconElement}
			</span>
		</dynamic>
	)
}
