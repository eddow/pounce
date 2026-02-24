import { untracked } from 'mutts'
import type { DisableableProps, ElementPassthroughProps, VariantProps } from '../shared/types'
import { generateId } from '../shared/utils'

// ── Types ───────────────────────────────────────────────────────────────────

export type Option = string | { value: string; label?: string; disabled?: boolean }

export type ValidationProps = {
	/** Whether the field is currently valid. 'true' | 'false' | 'warning' */
	valid?: boolean | 'warning'
	/** Error or validation message to display */
	validationMessage?: JSX.Children
}

// ── Select ──────────────────────────────────────────────────────────────────

export type SelectProps = VariantProps &
	DisableableProps &
	ValidationProps &
	ElementPassthroughProps<'select'> &
	JSX.IntrinsicElements['select'] & {
		fullWidth?: boolean
		options?: readonly Option[]
	}

export type SelectModel = {
	readonly select: JSX.IntrinsicElements['select']
	readonly options: JSX.Element
}

/**
 * Headless select logic.
 *
 * @example
 * ```tsx
 * export const Select = picoComponent(function Select(props: SelectProps) {
 *   const model = selectModel(props)
 *   return (
 *     <select {...model.select} {...props.el}>
 *       {model.options}
 *     </select>
 *   )
 * })
 * ```
 */
export function selectModel(props: SelectProps): SelectModel {
	const initValue = untracked(() => props.value)
	const model: SelectModel = {
		get select() {
			const { options: _, fullWidth: __, variant: ___, ...rest } = props
			return rest
		},
		get options() {
			return (
				<for each={props.options ?? []}>
					{(opt) =>
						typeof opt === 'string' ? (
							<option value={opt}>
								{opt} selected={initValue === opt}
							</option>
						) : (
							<option value={opt.value} disabled={opt.disabled} selected={initValue === opt.value}>
								{opt.label || opt.value}
							</option>
						)
					}
				</for>
			)
		},
	}
	return model
}

// ── Combobox ────────────────────────────────────────────────────────────────
type InputTextAttrs = JSX.BaseHTMLAttributes<HTMLInputElement> & JSX.InputString
export type ComboboxProps = VariantProps &
	DisableableProps &
	ValidationProps & { el?: InputTextAttrs } & Omit<InputTextAttrs, 'list'> & {
		options?: readonly Option[]
	}

export type ComboboxModel = {
	/** Generated or provided datalist id */
	readonly input: InputTextAttrs
	readonly dataList: JSX.Element
}

/**
 * Headless combobox logic.
 *
 * Generates a stable datalist id for linking `<input list>` to `<datalist id>`.
 *
 * @example
 * ```tsx
 * const Combobox = (props: ComboboxProps) => {
 *   const model = comboboxModel(props)
 *   return (
 *     <div>
 *       <input {...props} {...model.input} />
 *       {model.dataList}
 *     </div>
 *   )
 * }
 * ```
 */
export function comboboxModel(props: Pick<ComboboxProps, 'options'>): ComboboxModel {
	const generatedId = generateId('combobox')
	const model: ComboboxModel = {
		get input() {
			return { list: generatedId }
		},
		get dataList() {
			return (
				<datalist id={generatedId}>
					<for each={props.options ?? []}>
						{(opt) =>
							typeof opt === 'string' ? (
								<option value={opt} />
							) : (
								<option value={opt.value} disabled={opt.disabled}>
									{opt.label || opt.value}
								</option>
							)
						}
					</for>
				</datalist>
			)
		},
	}
	return model
}
