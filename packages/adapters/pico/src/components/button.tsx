import type { Env } from '@pounce/core'
import { type ButtonProps, Icon, useButton } from '@pounce/ui'
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
export const Button = picoComponent(function Button(props: ButtonProps, env: Env) {
	const state = useButton(props, env)

	return (
		<button
			// PicoCSS button classes
			class={`btn btn-${props.variant ?? 'secondary'}`}
			// Disabled state
			disabled={props.disabled}
			// Event handlers
			onClick={state.onClick}
			// A11y attributes
			aria-label={state.ariaProps['aria-label']}
			aria-disabled={state.ariaProps['aria-disabled']}
			// Additional attributes
			{...props.el}
		>
			{/* Icon on the left */}
			{state.iconPosition === 'left' && (
				<span style={{ marginRight: state.isIconOnly ? undefined : '0.5em' }}>
					{typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon}
				</span>
			)}

			{/* Button content */}
			{props.children}

			{/* Icon on the right (or icon-only) */}
			{(state.iconPosition === 'right' || state.isIconOnly) && (
				<span style={{ marginLeft: state.isIconOnly ? undefined : '0.5em' }}>
					{typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon}
				</span>
			)}
		</button>
	)
})
