import { gather } from '@sursaut/ui'
import { type CheckButtonProps as BaseCheckButtonProps, checkButtonModel } from '@sursaut/ui/models'
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
			<span if={model.icon} {...model.icon!.span}>
				{model.icon!.element}
			</span>
			<fragment if={model.hasLabel}>{gather(props.children)}</fragment>
		</button>
	)
})
