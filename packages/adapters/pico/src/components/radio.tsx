import { type RadioProps, useRadio } from '@pounce/ui'
import { picoComponent } from '../factory'

/**
 * PicoCSS Radio component
 *
 * @example
 * ```tsx
 * <Radio group="theme" value="dark" checked={theme === 'dark'} onChange={setTheme}>
 *   Dark mode
 * </Radio>
 * ```
 */
export const Radio = picoComponent(function Radio(props: RadioProps) {
	const state = useRadio(props)

	return (
		<label>
			<input
				type="radio"
				name={String(props.group ?? '')}
				value={String(props.value ?? '')}
				checked={state.isChecked}
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
