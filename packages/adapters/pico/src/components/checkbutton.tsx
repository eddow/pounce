import { gather } from '@pounce/ui'
import { type CheckButtonProps, checkButtonModel } from '@pounce/ui/models'
import { picoComponent } from '../factory'

export const CheckButton = picoComponent(function CheckButton(props: CheckButtonProps) {
	const model = checkButtonModel(props)
	return (
		<button class={model.checked ? 'outline' : 'outline secondary'} {...model.button} {...props.el}>
			{model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
			{model.hasLabel && gather(props.children)}
		</button>
	)
})
