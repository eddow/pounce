import { isString, PounceElement } from '@pounce/core'
import { isObject } from 'mutts'
import type { CheckboxProps, ControlState } from './types'

/**
 * Headless checkbox logic.
 *
 * Resolves label/description from props, handles the label-as-attrs pattern.
 *
 * @example
 * ```tsx
 * const Checkbox = (props: CheckboxProps) => {
 *   const state = useCheckbox(props)
 *   return (
 *     <label {...state.labelAttrs}>
 *       <input type="checkbox" checked={props.checked} />
 *       <span>{state.labelText}</span>
 *     </label>
 *   )
 * }
 * ```
 */
export function useCheckbox(props: CheckboxProps): ControlState {
	return {
		get labelAttrs() {
			return isObject(props.label) && !(props.label instanceof PounceElement)
				? (props.label as Record<string, unknown>)
				: {}
		},
		get labelText() {
			return isString(props.label) || props.label instanceof PounceElement
				? props.label
				: props.children
		},
	}
}
