import { gather } from '@pounce/ui'
import { type RadioButtonProps as BaseRadioButtonProps, radioButtonModel } from '@pounce/ui/models'
import { type PicoButtonLikeProps, picoButtonClass, picoComponent } from '../factory'

export type RadioButtonProps<Value = unknown> = PicoButtonLikeProps<BaseRadioButtonProps<Value>>

export const RadioButton = picoComponent(function RadioButton(props: RadioButtonProps) {
	const model = radioButtonModel(props)
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
