import { type RadioProps, useRadio } from '@pounce/ui'
import { picoComponent } from '../factory'

/**
 * PicoCSS Radio component
 *
 * @example
 * ```tsx
 * const state = reactive({ color: 'red' })
 * <Radio name="color" value="red" group={state.color}>Red</Radio>
 * <Radio name="color" value="blue" group={state.color}>Blue</Radio>
 * ```
 */
export const Radio = picoComponent(function Radio(props: RadioProps) {
	const state = useRadio(props)

	return (
		<label>
			<input
				type="radio"
				name={props.name}
				checked={state.checked}
				disabled={props.disabled}
				{...props.el}
			/>
			{state.labelText}
		</label>
	)
})
