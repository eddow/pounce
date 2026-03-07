import { gather } from '@pounce/ui'
import { type CheckButtonProps as BaseCheckButtonProps, checkButtonModel } from '@pounce/ui/models'
import { type PicoButtonLikeProps, picoButtonClass, picoComponent } from '../factory'

export type CheckButtonProps = PicoButtonLikeProps<BaseCheckButtonProps>

export const CheckButton = picoComponent(function CheckButton(props: CheckButtonProps) {
	const model = checkButtonModel(props)
	return (
		<button
			{...props.el}
			class={picoButtonClass(props.variant ?? 'secondary', props.outline ?? !model.checked)}
			{...model.button}
		>
			{model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
			{model.hasLabel && gather(props.children)}
		</button>
	)
})
