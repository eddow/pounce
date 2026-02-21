import { type CheckboxProps, checkboxModel, gather } from '@pounce/ui'
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
	const model = checkboxModel(props)

	return (
		<label style="display:inline-flex;align-items:center">
			<input {...model.input} />
			{gather(props.children)}
		</label>
	)
})
