import { compose } from '@pounce/core'
import { css } from '@pounce/toolbox/entry-dom'
import type { Variant } from './variants'
import { variantClass } from './variants'

css`
.pp-select {
	display: inline-block;
	min-width: 12rem;
	padding: 0.45rem 0.75rem;
	border-radius: var(--pico-border-radius, 0.5rem);
	border: 1px solid var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
	background-color: var(--pico-card-background-color, #fff);
	color: var(--pico-color, inherit);
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pp-select:focus-visible {
	outline: none;
	border-color: var(--pp-control-accent, var(--pico-primary));
	box-shadow: 0 0 0 2px
		color-mix(in srgb, var(--pp-control-accent, var(--pico-primary)) 30%, transparent);
}

.pp-select-full {
	width: 100%;
}

.pp-combobox {
	display: inline-flex;
	flex-direction: column;
	position: relative;
}

.pp-combobox > input {
	min-width: 12rem;
	padding: 0.45rem 0.75rem;
	border-radius: var(--pico-border-radius, 0.5rem);
	border: 1px solid var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
	background-color: var(--pico-card-background-color, #fff);
	color: var(--pico-color, inherit);
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pp-combobox > input:focus-visible {
	outline: none;
	border-color: var(--pp-control-accent, var(--pico-primary));
	box-shadow: 0 0 0 2px
		color-mix(in srgb, var(--pp-control-accent, var(--pico-primary)) 30%, transparent);
}

.pp-control {
	display: inline-flex;
	align-items: flex-start;
	gap: 0.6rem;
	color: var(--pico-color, inherit);
}

.pp-control + .pp-control {
	margin-top: 0.5rem;
}

.pp-inline > .pp-control,
.pp-stack > .pp-control {
	margin-top: 0;
}

.pp-control-copy {
	display: inline-flex;
	flex-direction: column;
	gap: 0.25rem;
}

.pp-control-label {
	font-weight: 600;
}

.pp-control-description {
	font-size: 0.85rem;
	color: var(--pico-muted-color, rgba(0, 0, 0, 0.6));
}

.pp-control-input {
	margin: 0;
	accent-color: var(--pp-control-accent, var(--pico-primary));
	width: 1.15rem;
	height: 1.15rem;
}

.pp-radio .pp-control-input {
	border-radius: 999px;
}

.pp-switch {
	align-items: center;
}

.pp-switch-input {
	width: 2.5rem;
	height: 1.35rem;
	border-radius: 999px;
	background-color: var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
	border: none;
	cursor: pointer;
	appearance: none;
	-webkit-appearance: none;
	transition: background-color 0.2s ease;
}

.pp-switch-input:checked {
	background-color: var(--pp-control-accent, var(--pico-primary));
}

.pp-switch-input:checked::after {
	transform: translateX(1.1rem);
}

.pp-switch-input:focus-visible {
	outline: none;
	box-shadow: 0 0 0 2px
		color-mix(in srgb, var(--pp-control-accent, var(--pico-primary)) 20%, transparent);
}

.pp-switch-visual {
	display: none;
}

.pp-switch-label-start {
	flex-direction: row-reverse;
}

.pp-switch-label-start .pp-control-copy {
	text-align: right;
}

.pp-control-primary {
	--pp-control-accent: var(--pico-primary, #3b82f6);
}

.pp-control-secondary {
	--pp-control-accent: var(--pico-secondary, #64748b);
}

.pp-control-contrast {
	--pp-control-accent: var(--pico-contrast, #0f172a);
}

.pp-control-success {
	--pp-control-accent: var(--pp-success, #22c55e);
}

.pp-control-warning {
	--pp-control-accent: var(--pp-warning, #f59e0b);
}

.pp-control-danger {
	--pp-control-accent: var(--pp-danger, #ef4444);
}

.pp-select.pp-control-secondary,
.pp-select.pp-control-contrast,
.pp-select.pp-control-success,
.pp-select.pp-control-warning,
.pp-select.pp-control-danger {
	border-color: color-mix(in srgb, var(--pp-control-accent) 50%, transparent);
}

.pp-combobox.pp-control-secondary > input,
.pp-combobox.pp-control-contrast > input,
.pp-combobox.pp-control-success > input,
.pp-combobox.pp-control-warning > input,
.pp-combobox.pp-control-danger > input {
	border-color: color-mix(in srgb, var(--pp-control-accent) 50%, transparent);
}
`

function tone(variant?: Variant): string {
	if (!variant || variant === 'primary') return 'primary'
	return variantClass(variant) || variant
}

export type SelectProps = JSX.IntrinsicElements['select'] & {
	variant?: Variant
	fullWidth?: boolean
}

export const Select = (props: SelectProps) => {
	const state = compose({ variant: 'primary', fullWidth: false }, props)

	return (
		<select
			class={[
				'pp-select',
				`pp-control-${tone(state.variant)}`,
				state.fullWidth ? 'pp-select-full' : undefined,
				state.class,
			]}
			{...state}
		>
			{state.children}
		</select>
	)
}

export type ComboboxOption = string | { value: string; label?: string }

export type ComboboxProps = JSX.IntrinsicElements['input'] & {
	variant?: Variant
	options?: readonly ComboboxOption[]
}

export const Combobox = (props: ComboboxProps) => {
	const generatedId = `pp-combobox-${Math.random().toString(36).slice(2, 9)}`
	const state = compose(
		{ variant: 'primary', list: generatedId, options: [] as ComboboxOption[], type: 'text' },
		props
	)

	return (
		<div class={['pp-combobox', `pp-control-${tone(state.variant)}`, state.class]}>
			<input {...state} />
			<datalist id={state.list}>
				{state.options.map((option) => {
					if (typeof option === 'string') {
						return <option value={option} />
					}
					return <option value={option.value}>{option.label ?? option.value}</option>
				})}
				{state.children}
			</datalist>
		</div>
	)
}

type ControlBaseProps = Omit<JSX.IntrinsicElements['input'], 'checked'> & {
	label?: JSX.Element | string
	description?: JSX.Element | string
	variant?: Variant
	el?: JSX.IntrinsicElements['label']
	labelProps?: Omit<JSX.IntrinsicElements['label'], 'children'>
	children?: JSX.Element | string
	checked?: boolean
}

export type CheckboxProps = ControlBaseProps

export const Checkbox = (props: CheckboxProps) => {
	const state = compose({ variant: 'primary', type: 'checkbox' }, props)
	return (
		<label
			{...state.labelProps}
			class={['pp-control', 'pp-checkbox', `pp-control-${tone(state.variant)}`, state.el?.class]}
		>
			<input
				{...(state as any)}
				checked={state.checked}
				class={['pp-control-input', state.class]}
			/>
			<span class="pp-control-copy">
				<span class="pp-control-label" if={state.label ?? state.children}>
					{state.label ?? state.children}
				</span>
				<span class="pp-control-description" if={state.description}>
					{state.description}
				</span>
			</span>
		</label>
	)
}

export type RadioProps = ControlBaseProps

export const Radio = (props: RadioProps) => {
	const state = compose({ variant: 'primary', type: 'radio' }, props)

	return (
		<label
			{...state.labelProps}
			class={['pp-control', 'pp-radio', `pp-control-${tone(state.variant)}`, state.el?.class]}
		>
			<input
				{...(state as any)}
				checked={state.checked}
				class={['pp-control-input', state.class]}
			/>
			<span class="pp-control-copy">
				<span class="pp-control-label" if={state.label ?? state.children}>
					{state.label ?? state.children}
				</span>
				<span class="pp-control-description" if={state.description}>
					{state.description}
				</span>
			</span>
		</label>
	)
}

export type SwitchProps = ControlBaseProps & {
	labelPosition?: 'start' | 'end'
}

export const Switch = (props: SwitchProps) => {
	const state = compose({ variant: 'primary', labelPosition: 'end', type: 'checkbox' }, props)

	return (
		<label
			{...state.labelProps}
			class={[
				'pp-control',
				'pp-switch',
				`pp-control-${tone(state.variant)}`,
				state.labelPosition === 'start' ? 'pp-switch-label-start' : undefined,
				state.el?.class,
			]}
		>
			<input
				role="switch"
				{...(state as any)}
				class={['pp-control-input', 'pp-switch-input', state.class]}
				aria-checked={state.checked as any}
			/>
			<span class="pp-switch-visual" aria-hidden="true" />
			<span class="pp-control-copy" if={state.label || state.children || state.description}>
				<span class="pp-control-label" if={state.label || state.children}>
					{state.label ?? state.children}
				</span>
				<span class="pp-control-description" if={state.description}>
					{state.description}
				</span>
			</span>
		</label>
	)
}
