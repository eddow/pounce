export type ButtonGroupProps = {
	children?: JSX.Children
	el?: JSX.IntrinsicElements['div']
}

export function ButtonGroup(props: ButtonGroupProps) {
	return (
		<div role="group" style="display:inline-flex" {...props.el}>
			{props.children}
		</div>
	)
}
