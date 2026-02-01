import { compose } from '@pounce/core'
import { css } from '@pounce/toolbox/entry-dom'
import { Icon } from './icon'
import { Variant, variantClass } from './variants'

css`
.pp-radiobutton {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	position: relative;
	margin: 0;
}

.pp-radiobutton .pp-radiobutton-icon {
	display: inline-flex;
	align-items: center;
}

.pp-radiobutton .pp-radiobutton-label {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
}

button.pp-radiobutton {
	border-color: var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
}

button.pp-radiobutton:not(.pp-radiobutton-checked) {
	background-color: transparent;
	border-width: 1px;
	color: var(--pico-contrast);
}

button.pp-radiobutton.pp-radiobutton-checked {
	background-color: color-mix(in srgb, var(--pico-primary, #3b82f6) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-radiobutton.pp-radiobutton-checked.success {
	background-color: color-mix(in srgb, var(--pp-success, #22c55e) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-radiobutton.pp-radiobutton-checked.warning {
	background-color: color-mix(in srgb, var(--pp-warning, #f59e0b) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-radiobutton.pp-radiobutton-checked.danger {
	background-color: color-mix(in srgb, var(--pp-danger, #ef4444) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-radiobutton.pp-radiobutton-checked.secondary {
	background-color: color-mix(in srgb, var(--pico-secondary, #64748b) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-radiobutton.pp-radiobutton-checked.contrast {
	background-color: color-mix(in srgb, var(--pico-contrast, #0f172a) 20%, transparent);
	color: var(--pico-contrast);
}

button.pp-radiobutton:not(.pp-radiobutton-checked):hover {
	background-color: var(--pico-card-background-color, rgba(0, 0, 0, 0.05));
}

button.pp-radiobutton.pp-radiobutton-checked:hover {
	filter: brightness(0.95);
}
`

export type RadioButtonProps<Value = string> = {
	/** Button variant */
	variant?: Variant
	/** Icon name or element */
	icon?: string | JSX.Element
	/** Icon position relative to text */
	iconPosition?: 'start' | 'end'
	/** Value for this radio button */
	value?: Value
	/** 2-way bound: current selected value in the group (checked when group === value) */
	group?: Value
	/** Additional button attributes */
	el?: JSX.HTMLAttributes<'button'>
	/** Button content */
	children?: JSX.Children
	/** Accessible label (required if icon-only) */
	'aria-label'?: string
}

export function RadioButton<Value = string>(props: RadioButtonProps<Value>) {
	const state = compose({ variant: 'primary', iconPosition: 'start' }, props, (state) => ({
		get checked() {
			return state.group !== undefined && state.value !== undefined && state.group === state.value
		},
		get iconElement() {
			return state.icon !== undefined ? (
				<span
					class="pp-radiobutton-icon"
					aria-hidden={typeof state.icon === 'string' ? true : undefined}
				>
					{typeof state.icon === 'string' ? <Icon icon={state.icon} size="18px" /> : state.icon}
				</span>
			) : null
		},
		get hasLabel() {
			return state.children && !(Array.isArray(state.children) && state.children.length === 0)
		},
		get isIconOnly() {
			return state.icon && !this.hasLabel
		},
	}))

	const handleClick = (e: MouseEvent) => {
		if (state.el?.onClick) {
			state.el.onClick(e)
		}
		if (e.defaultPrevented) return
		// 2-way binding: set group = value
		if (state.value !== undefined) {
			state.group = state.value
		}
	}

	return (
		<button
			{...state.el}
			type="button"
			role="radio"
			aria-checked={`${state.checked}`}
			aria-label={
				state.isIconOnly
					? (props['aria-label'] ?? (typeof state.value === 'string' ? state.value : 'Option'))
					: props['aria-label']
			}
			class={[
				'pp-radiobutton',
				variantClass(state.variant),
				state.checked ? 'pp-radiobutton-checked' : undefined,
				state.isIconOnly ? 'pp-radiobutton-icon-only' : undefined,
				state.el?.class,
			]}
			onClick={handleClick}
			data-value={state.value}
		>
			{state.iconPosition === 'start' ? state.iconElement : null}
			{state.hasLabel ? <span class="pp-radiobutton-label">{state.children}</span> : state.children}
			{state.iconPosition === 'end' ? state.iconElement : null}
		</button>
	)
}
