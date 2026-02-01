import { css } from '@pounce/toolbox/entry-dom'
import { compose } from '@pounce/core'
import { Icon } from './icon'
import { Variant, variantClass } from './variants'

css`
.pp-checkbutton {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	position: relative;
	margin: 0;
}

.pp-checkbutton .pp-checkbutton-icon {
	display: inline-flex;
	align-items: center;
}

.pp-checkbutton .pp-checkbutton-label {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
}

button.pp-checkbutton {
	border-color: var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
}

button.pp-checkbutton:not(.pp-checkbutton-checked) {
	background-color: transparent;
	border-width: 1px;
	color: var(--pico-contrast);
}

button.pp-checkbutton.pp-checkbutton-checked {
	background-color: color-mix(in srgb, var(--pico-primary, #3b82f6) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-checkbutton.pp-checkbutton-checked.success {
	background-color: color-mix(in srgb, var(--pp-success, #22c55e) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-checkbutton.pp-checkbutton-checked.warning {
	background-color: color-mix(in srgb, var(--pp-warning, #f59e0b) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-checkbutton.pp-checkbutton-checked.danger {
	background-color: color-mix(in srgb, var(--pp-danger, #ef4444) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-checkbutton.pp-checkbutton-checked.secondary {
	background-color: color-mix(in srgb, var(--pico-secondary, #64748b) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-checkbutton.pp-checkbutton-checked.contrast {
	background-color: color-mix(in srgb, var(--pico-contrast, #0f172a) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-checkbutton:not(.pp-checkbutton-checked):hover {
	background-color: var(--pico-card-background-color, rgba(0, 0, 0, 0.05));
}

button.pp-checkbutton.pp-checkbutton-checked:hover {
	filter: brightness(0.95);
}
`

export type CheckButtonProps = {
	/** Button variant */
	variant?: Variant
	/** Icon name or element */
	icon?: string | JSX.Element
	/** Icon position relative to text */
	iconPosition?: 'start' | 'end'
	/** Whether the button is checked/active */
	checked?: boolean
	/** Event handler for checked state changes */
	onCheckedChange?: (checked: boolean) => void
	/** Additional button attributes */
	el?: JSX.HTMLAttributes<'button'>
	/** Button content */
	children?: JSX.Children
	/** Accessible label (required if icon-only) */
	'aria-label'?: string
}

export const CheckButton = (props: CheckButtonProps) => {
	const state = compose(
		{ variant: 'primary', iconPosition: 'start', checked: false },
		props,
		(s) => ({
			iconElement:
				s.icon !== undefined ? (
					<span
						class="pp-checkbutton-icon"
						aria-hidden={typeof s.icon === 'string' ? true : undefined}
					>
						{typeof s.icon === 'string' ? <Icon icon={s.icon} size="18px" /> : s.icon}
					</span>
				) : null,
		})
	)

	const handleClick = (e: MouseEvent) => {
		if (state.el?.onClick) {
			state.el.onClick(e)
		}
		if (e.defaultPrevented) return
		state.checked = !state.checked
		if (state.onCheckedChange) {
			state.onCheckedChange(state.checked)
		}
	}

	const hasLabel = state.children && !(Array.isArray(state.children) && state.children.length === 0)
	const isIconOnly = state.icon && !hasLabel

	return (
		<button
			{...state.el}
			type="button"
			role="checkbox"
			aria-checked={`${state.checked ?? false}`}
			aria-label={isIconOnly ? (props['aria-label'] ?? 'Toggle') : props['aria-label']}
			class={[
				'pp-checkbutton',
				variantClass(state.variant),
				state.checked ? 'pp-checkbutton-checked' : undefined,
				isIconOnly ? 'pp-checkbutton-icon-only' : undefined,
				state.el?.class,
			]}
			onClick={handleClick}
		>
			{state.iconPosition === 'start' ? state.iconElement : null}
			{hasLabel ? <span class="pp-checkbutton-label">{state.children}</span> : state.children}
			{state.iconPosition === 'end' ? state.iconElement : null}
		</button>
	)
}
