import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { asVariant, getVariantTrait } from '../shared/variants'

componentStyle.sass`
.pounce-select
	display: inline-block
	min-width: 12rem
	padding: 0.45rem 0.75rem
	border-radius: var(--pounce-border-radius, 0.5rem)
	border: 1px solid var(--pounce-border-color, rgba(0, 0, 0, 0.2))
	background-color: var(--pounce-bg-card, #fff)
	color: var(--pounce-fg, inherit)
	transition: border-color 0.15s ease, box-shadow 0.15s ease

	&:focus-visible
		outline: none
		border-color: var(--pounce-control-accent, var(--pounce-primary))
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--pounce-control-accent, var(--pounce-primary)) 30%, transparent)

	&.pounce-select-full
		width: 100%

.pounce-combobox
	display: inline-flex
	flex-direction: column
	position: relative

	> input
		min-width: 12rem
		padding: 0.45rem 0.75rem
		border-radius: var(--pounce-border-radius, 0.5rem)
		border: 1px solid var(--pounce-border-color, rgba(0, 0, 0, 0.2))
		background-color: var(--pounce-bg-card, #fff)
		color: var(--pounce-fg, inherit)
		transition: border-color 0.15s ease, box-shadow 0.15s ease

		&:focus-visible
			outline: none
			border-color: var(--pounce-control-accent, var(--pounce-primary))
			box-shadow: 0 0 0 2px color-mix(in srgb, var(--pounce-control-accent, var(--pounce-primary)) 30%, transparent)

.pounce-control
	display: inline-flex
	align-items: flex-start
	gap: 0.6rem
	color: var(--pounce-fg, inherit)

	+ .pounce-control
		margin-top: 0.5rem

.pounce-inline > .pounce-control,
.pounce-stack > .pounce-control
	margin-top: 0

.pounce-control-copy
	display: inline-flex
	flex-direction: column
	gap: 0.25rem

.pounce-control-label
	font-weight: 600

.pounce-control-description
	font-size: 0.85rem
	color: var(--pounce-fg-muted, rgba(0, 0, 0, 0.6))

.pounce-control-input
	margin: 0
	accent-color: var(--pounce-control-accent, var(--pounce-primary))
	width: 1.15rem
	height: 1.15rem

.pounce-radio .pounce-control-input
	border-radius: 999px

.pounce-switch
	align-items: center

.pounce-switch-input
	width: 2.5rem
	height: 1.35rem
	border-radius: 999px
	background-color: var(--pounce-border-color, rgba(0, 0, 0, 0.2))
	border: none
	cursor: pointer
	appearance: none
	-webkit-appearance: none
	transition: background-color 0.2s ease

	&:checked
		background-color: var(--pounce-control-accent, var(--pounce-primary))

	&:checked::after
		transform: translateX(1.1rem)

	&:focus-visible
		outline: none
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--pounce-control-accent, var(--pounce-primary)) 20%, transparent)

.pounce-switch-visual
	display: none

.pounce-switch-label-start
	flex-direction: row-reverse

	.pounce-control-copy
		text-align: right

.pounce-control-primary
	--pounce-control-accent: var(--pounce-primary, #3b82f6)

.pounce-control-secondary
	--pounce-control-accent: var(--pounce-secondary, #64748b)

.pounce-control-success
	--pounce-control-accent: var(--pounce-success, #22c55e)

.pounce-control-warning
	--pounce-control-accent: var(--pounce-warning, #f59e0b)

.pounce-control-danger
	--pounce-control-accent: var(--pounce-danger, #ef4444)
`

function toneClass(variant?: string): string | undefined {
	const resolved = variant || 'primary'
	if (getVariantTrait(resolved)) return undefined
	return `pounce-control-${resolved}`
}

/** Props for {@link Select}. Extends native `<select>` attributes. */
export type SelectProps = JSX.IntrinsicElements['select'] & {
	/** Accent color variant. @default 'primary' */
	variant?: string
	/** Stretch to container width. @default false */
	fullWidth?: boolean
}

/**
 * Native `<select>` with variant accent and adapter class support.
 *
 * @example
 * ```tsx
 * <Select><option value="a">A</option></Select>
 * ```
 *
 * Adapter key: `Select` (BaseAdaptation)
 */
const SelectBase = (props: SelectProps) => {
	const adapter = getAdapter('Select')
	const state = compose({ variant: 'primary', fullWidth: false }, props)
	const variantTrait = getVariantTrait(state.variant)

	return (
		<select
			class={[
				adapter.classes?.base || 'pounce-select',
				toneClass(state.variant),
				state.fullWidth ? (adapter.classes?.full || 'pounce-select-full') : undefined,
				state.class,
			]}
			traits={variantTrait ? [variantTrait] : undefined}
			{...state}
		>
			{state.children}
		</select>
	)
}

/** A combobox suggestion — either a plain string or `{ value, label? }`. */
export type ComboboxOption = string | { value: string; label?: string }

/** Props for {@link Combobox}. Extends native `<input>` attributes. */
export type ComboboxProps = JSX.IntrinsicElements['input'] & {
	/** Accent color variant. @default 'primary' */
	variant?: string
	/** Suggestion list rendered as `<datalist>` options. */
	options?: readonly ComboboxOption[]
}

/**
 * Text input with `<datalist>` suggestions.
 *
 * @example
 * ```tsx
 * <Combobox options={['Apple', 'Banana']} placeholder="Pick..." />
 * ```
 *
 * Adapter key: `Combobox` (BaseAdaptation)
 */
const ComboboxBase = (props: ComboboxProps) => {
	const generatedId = `pounce-combobox-${Math.random().toString(36).slice(2, 9)}`
	const adapter = getAdapter('Combobox')
	const state = compose(
		{ variant: 'primary', list: generatedId, options: [] as ComboboxOption[], type: 'text' },
		props
	)
	const variantTrait = getVariantTrait(state.variant)

	return (
		<div class={[adapter.classes?.base || 'pounce-combobox', toneClass(state.variant), state.class]} traits={variantTrait ? [variantTrait] : undefined}>
			<input {...state} />
			<datalist id={state.list}>
				{state.options.map((option) => {
					if (typeof option === 'string') return <option value={option} />
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
	variant?: string
	el?: JSX.IntrinsicElements['label']
	labelProps?: Omit<JSX.IntrinsicElements['label'], 'children'>
	children?: JSX.Element | string
	checked?: boolean
}

/** Props for {@link Checkbox}. */
export type CheckboxProps = ControlBaseProps

/**
 * Labeled checkbox with optional description.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms" checked={accepted} />
 * ```
 *
 * Adapter key: `Checkbox` (BaseAdaptation)
 */
const CheckboxBase = (props: CheckboxProps) => {
	const adapter = getAdapter('Checkbox')
	const state = compose({ variant: 'primary', type: 'checkbox' }, props)
	const variantTrait = getVariantTrait(state.variant)

	return (
		<label
			{...state.labelProps}
			class={[
				adapter.classes?.base || 'pounce-control',
				'pounce-checkbox',
				toneClass(state.variant),
				state.el?.class,
			]}
			traits={variantTrait ? [variantTrait] : undefined}
		>
			<input
				type="checkbox"
				checked={state.checked}
				name={state.name}
				disabled={state.disabled}
				class={[adapter.classes?.input || 'pounce-control-input', state.class]}
			/>
			<span class={adapter.classes?.copy || 'pounce-control-copy'}>
				<span class={adapter.classes?.label || 'pounce-control-label'} if={state.label ?? state.children}>
					{state.label ?? state.children}
				</span>
				<span class={adapter.classes?.description || 'pounce-control-description'} if={state.description}>
					{state.description}
				</span>
			</span>
		</label>
	)
}

/** Props for {@link Radio}. */
export type RadioProps = ControlBaseProps & {
	/** Two-way binding: the selected value in the radio group. Derives `checked` from `group === value`. */
	group?: any
}

/**
 * Labeled radio button. Group radios with a shared `name` attribute.
 *
 * @example
 * ```tsx
 * <Radio name="color" value="red" label="Red" />
 * <Radio name="color" value="blue" label="Blue" checked />
 * ```
 *
 * Adapter key: `Radio` (BaseAdaptation)
 */
const RadioBase = (props: RadioProps) => {
	const adapter = getAdapter('Radio')
	const state = compose(
		{ variant: 'primary', type: 'radio' },
		props,
		(s: any) => ({
			get isChecked() {
				if (s.group !== undefined && s.value !== undefined) return s.group === s.value
				return s.checked
			},
			set isChecked(v: boolean) {
				if (v && s.group !== undefined) s.group = s.value
			}
		})
	)
	const variantTrait = getVariantTrait(state.variant)

	return (
		<label
			{...state.labelProps}
			class={[
				adapter.classes?.base || 'pounce-control',
				'pounce-radio',
				toneClass(state.variant),
				state.el?.class,
			]}
			traits={variantTrait ? [variantTrait] : undefined}
		>
			<input
				type="radio"
				checked={state.isChecked}
				name={state.name}
				value={state.value != null ? String(state.value) : undefined}
				disabled={state.disabled}
				class={[adapter.classes?.input || 'pounce-control-input', state.class]}
			/>
			<span class={adapter.classes?.copy || 'pounce-control-copy'}>
				<span class={adapter.classes?.label || 'pounce-control-label'} if={state.label ?? state.children}>
					{state.label ?? state.children}
				</span>
				<span class={adapter.classes?.description || 'pounce-control-description'} if={state.description}>
					{state.description}
				</span>
			</span>
		</label>
	)
}

/** Props for {@link Switch}. */
export type SwitchProps = ControlBaseProps & {
	/** Label placement relative to the switch track. @default 'end' */
	labelPosition?: 'start' | 'end'
}

/**
 * Toggle switch with `role="switch"` semantics.
 *
 * @example
 * ```tsx
 * <Switch label="Dark mode" checked={dark} />
 * <Switch label="Notifications" labelPosition="start" />
 * ```
 *
 * Adapter key: `Switch` (BaseAdaptation)
 */
const SwitchBase = (props: SwitchProps) => {
	const adapter = getAdapter('Switch')
	const state = compose(
		{ variant: 'primary', labelPosition: 'end', type: 'checkbox' },
		props,
		(s: any) => ({
			get isChecked() {
				return s.checked
			}
		})
	)
	const variantTrait = getVariantTrait(state.variant)

	return (
		<label
			{...state.labelProps}
			class={[
				adapter.classes?.base || 'pounce-control',
				'pounce-switch',
				toneClass(state.variant),
				state.labelPosition === 'start' ? 'pounce-switch-label-start' : undefined,
				state.el?.class,
			]}
			traits={variantTrait ? [variantTrait] : undefined}
		>
			<input
				role="switch"
				type="checkbox"
				checked={state.isChecked}
				name={state.name}
				disabled={state.disabled}
				class={[adapter.classes?.input || 'pounce-control-input', 'pounce-switch-input', state.class]}
				aria-checked={state.isChecked}
			/>
			<span class="pounce-switch-visual" aria-hidden="true" />
			<span class={adapter.classes?.copy || 'pounce-control-copy'} if={state.label || state.children || state.description}>
				<span class={adapter.classes?.label || 'pounce-control-label'} if={state.label || state.children}>
					{state.label ?? state.children}
				</span>
				<span class={adapter.classes?.description || 'pounce-control-description'} if={state.description}>
					{state.description}
				</span>
			</span>
		</label>
	)
}

export const Select = asVariant(SelectBase)
export const Combobox = asVariant(ComboboxBase)
export const Checkbox = asVariant(CheckboxBase)
export const Radio = asVariant(RadioBase)
export const Switch = asVariant(SwitchBase)
