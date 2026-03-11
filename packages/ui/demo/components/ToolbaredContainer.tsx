export type ToolbaredContainerProps = {
	readonly testId?: string
	readonly children?: JSX.Children
}

export function ToolbaredContainer(props: ToolbaredContainerProps) {
	return <div data-test={props.testId}>{props.children}</div>
}
