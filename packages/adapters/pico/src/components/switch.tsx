import { type SwitchProps, useCheckbox } from '@pounce/ui'
import { picoComponent } from '../factory'

/**
 * PicoCSS Switch component (styled checkbox)
 *
 * @example
 * ```tsx
 * <Switch checked={enabled} onChange={setEnabled}>
 *   Enable notifications
 * </Switch>
 * ```
 */
export const Switch = picoComponent(function Switch(props: SwitchProps) {
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
