import { gather } from '@pounce/ui'
import { type ButtonProps as BaseButtonProps, buttonModel } from '@pounce/ui/models'
import { type PicoButtonLikeProps, picoButtonClass, picoComponent } from '../factory'

export type ButtonProps = PicoButtonLikeProps<BaseButtonProps>

/**
 * PicoCSS Button component
 *
 * @example
 * ```tsx
 * <Button variant="primary">Save</Button>
 * <Button.danger onClick={handleDelete}>Delete</Button.danger>
 * ```
 */
export const Button = picoComponent(function Button(props: ButtonProps) {
	const model = buttonModel(props)

	return (
		<button
			{...props.el}
			class={picoButtonClass(props.variant ?? 'secondary', props.outline)}
			{...model.button}
		>
			<span if={model.icon} {...model.icon!.span}>
				{model.icon!.element}
			</span>
			<fragment if={model.hasLabel}>{gather(props.children)}</fragment>
		</button>
	)
})
