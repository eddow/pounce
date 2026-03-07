import { type ButtonGroupNavOptions, setupButtonGroupNav } from '@pounce/ui/models'

export type ButtonGroupProps = {
	orientation?: ButtonGroupNavOptions['orientation']
	trapTab?: ButtonGroupNavOptions['trapTab']
	roleFilter?: ButtonGroupNavOptions['roleFilter']
	children?: JSX.Children
	el?: JSX.IntrinsicElements['div']
}

export function ButtonGroup(props: ButtonGroupProps) {
	return (
		<div
			{...props.el}
			role="group"
			style="display:inline-flex"
			use={(element: HTMLElement) =>
				setupButtonGroupNav(element, {
					orientation: props.orientation,
					trapTab: props.trapTab,
					roleFilter: props.roleFilter,
				})
			}
		>
			{props.children}
		</div>
	)
}
