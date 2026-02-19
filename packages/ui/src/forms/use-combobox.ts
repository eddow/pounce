import { generateId } from '../shared/utils'
import type { ComboboxProps, ComboboxState } from './types'

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
			return props.list ?? generatedId
		},
	}
}
