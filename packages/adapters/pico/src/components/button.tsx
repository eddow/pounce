import { type ButtonProps, useButton } from '@pounce/ui'
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
	const state = useButton(props)

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
			{/* Icon at start */}
			{props.icon && props.iconPosition === 'start' && (
				<span style={{ marginRight: '0.5em' }}>
					{typeof props.icon === 'string' ? (
						<span data-icon={props.icon}>{props.icon}</span>
					) : (
						props.icon
					)}
				</span>
			)}

			{/* Button content */}
			{props.children}

			{/* Icon at end */}
			{props.icon && props.iconPosition === 'end' && (
				<span style={{ marginLeft: '0.5em' }}>
					{typeof props.icon === 'string' ? (
						<span data-icon={props.icon}>{props.icon}</span>
					) : (
						props.icon
					)}
				</span>
			)}

			{/* Icon-only button */}
			{state.isIconOnly && typeof props.icon === 'string' && (
				<span data-icon={props.icon} aria-hidden="true">
					{props.icon}
				</span>
			)}
		</button>
	)
})
