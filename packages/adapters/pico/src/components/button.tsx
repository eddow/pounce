import { gather } from '@pounce/ui'
import { type ButtonProps, buttonModel } from '@pounce/ui/models'
import { picoComponent } from '../factory'

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
		<button class={`btn btn-${props.variant ?? 'secondary'}`} {...model.button} {...props.el}>
			{model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
			{model.hasLabel && gather(props.children)}
		</button>
	)
})
