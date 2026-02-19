import { type CheckboxProps, useCheckbox } from '@pounce/ui'
import { picoComponent } from '../factory'

/**
 * PicoCSS Checkbox component
 *
 * @example
 * ```tsx
 * <Checkbox checked={state.agree} onChange={setAgree}>
 *   I agree to the terms
 * </Checkbox>
 * ```
 */
export const Checkbox = picoComponent(function Checkbox(props: CheckboxProps) {
	const state = useCheckbox(props)

	return (
		<label>
			<input
				type="checkbox"
				checked={props.checked}
				onChange={(e) => {
					if (e.target instanceof HTMLInputElement) {
						props.onChange?.(e.target.checked)
					}
				}}
				disabled={props.disabled}
			/>
			{state.labelText}
		</label>
	)
})
