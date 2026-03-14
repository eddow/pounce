import { gather } from '@sursaut/ui'
import { type RadioProps, radioModel } from '@sursaut/ui/models'
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
	const model = radioModel(props)

	return (
		<label style="display:inline-flex;align-items:center">
			<input {...props.el} {...model.input} />
			{gather(props.children)}
		</label>
	)
})
