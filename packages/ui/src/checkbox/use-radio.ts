import { isString, PounceElement } from '@pounce/core'
import { isObject } from 'mutts'
import type { RadioProps, RadioState } from './types'

/**
 * Headless radio button logic.
 *
 * Derives `isChecked` from `group === value` when group binding is used,
 * otherwise falls back to the explicit `checked` prop.
 *
 * @example
 * ```tsx
 * const Radio = (props: RadioProps) => {
 *   const state = useRadio(props)
 *   return (
 *     <label {...state.labelAttrs}>
 *       <input type="radio" checked={state.isChecked} name={props.name} value={props.value} />
 *       <span>{state.labelText}</span>
 *     </label>
 *   )
 * }
 * ```
 */
export function useRadio(props: RadioProps): RadioState {
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
		get isChecked() {
			if (props.group !== undefined && props.value !== undefined) {
				return props.group === props.value
			}
			return props.checked
		},
	}
}
