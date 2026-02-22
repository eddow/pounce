import { gather } from '@pounce/ui'
import { type RadioButtonProps, radioButtonModel } from '@pounce/ui/models'
import { picoComponent } from '../factory'

export const RadioButton = picoComponent(function RadioButton(props: RadioButtonProps) {
	const model = radioButtonModel(props)
	return (
		<button class={model.checked ? '' : 'outline secondary'} {...model.button} {...props.el}>
			{model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
			{model.hasLabel && gather(props.children)}
		</button>
	)
})
