import { gather, type SwitchProps, switchModel } from '@pounce/ui'
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
	const model = switchModel(props)

	return (
		<label style="display:inline-flex;align-items:center">
			<input {...model.input} />
			{gather(props.children)}
		</label>
	)
})
