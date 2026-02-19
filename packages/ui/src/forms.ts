import type { DisableableProps, VariantProps } from './shared/types'
import { generateId } from './shared/utils'

// ── Select ──────────────────────────────────────────────────────────────────

export type SelectProps = VariantProps &
	DisableableProps &
	JSX.IntrinsicElements['select'] & {
		fullWidth?: boolean
	}

export type SelectState = {
	readonly fullWidthClass: boolean
}

// ── Combobox ────────────────────────────────────────────────────────────────

export type ComboboxOption = string | { value: string; label?: string }

export type ComboboxProps = VariantProps &
	DisableableProps &
	JSX.IntrinsicElements['input'] & {
		options?: readonly ComboboxOption[]
	}

export type ComboboxState = {
	/** Generated or provided datalist id */
	readonly listId: string
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
 *   const state = useCombobox(props)
 *   return (
 *     <div>
 *       <input {...props} list={state.listId} />
 *       <datalist id={state.listId}>
 *         <for each={props.options ?? []}>{(opt) => <option value={opt} />}</for>
 *       </datalist>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCombobox(props: ComboboxProps): ComboboxState {
	const generatedId = generateId('combobox')
	return {
		get listId() {
			return (props.list as string | undefined) ?? generatedId
		},
	}
}
