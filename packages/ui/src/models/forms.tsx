import type { DisableableProps, VariantProps } from '../shared/types'
import { generateId } from '../shared/utils'

// ── Select ──────────────────────────────────────────────────────────────────

export type ValidationProps = {
	/** Whether the field is currently valid. 'true' | 'false' | 'warning' */
	valid?: boolean | 'warning'
	/** Error or validation message to display */
	validationMessage?: JSX.Children
}

export type SelectProps = VariantProps &
	DisableableProps &
	ValidationProps &
	JSX.IntrinsicElements['select'] & {
		fullWidth?: boolean
	}

// ── Combobox ────────────────────────────────────────────────────────────────

export type ComboboxOption = string | { value: string; label?: string }

export type ComboboxProps = VariantProps &
	DisableableProps &
	ValidationProps &
	Omit<JSX.IntrinsicElements['input'], 'list'> & {
		options?: readonly ComboboxOption[]
	}

export type ComboboxModel = {
	/** Generated or provided datalist id */
	readonly input: JSX.IntrinsicElements['input']
	readonly dataList: JSX.Element
}

// ── Hooks ───────────────────────────────────────────────────────────────────

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
								<option value={opt.value}>{opt.label || opt.value}</option>
							)
						}
					</for>
				</datalist>
			)
		},
	}
	return model
}
