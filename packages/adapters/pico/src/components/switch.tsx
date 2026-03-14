import { gather } from '@sursaut/ui'
import { type SwitchProps, switchModel } from '@sursaut/ui/models'

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
export function Switch(props: SwitchProps) {
	const model = switchModel(props)

	return (
		<label style="display:inline-flex;align-items:center">
			<input {...props.el} {...model.input} />
			{gather(props.children)}
		</label>
	)
}
