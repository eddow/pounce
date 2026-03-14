import {
	type ContainerProps,
	containerModel,
	type HeadingProps,
	headingModel,
	setupToolbarNav,
	type TextProps,
	type ToolbarNavOptions,
	textModel,
} from '@sursaut/ui/models'

export type { ContainerProps, HeadingProps, TextProps }

export type ToolbarProps = {
	orientation?: ToolbarNavOptions['orientation']
	cycleSegments?: ToolbarNavOptions['cycleSegments']
	el?: JSX.IntrinsicElements['div']
	children?: JSX.Children
}

export type ToolbarSpacerProps = {
	el?: JSX.IntrinsicElements['span']
}

/**
 * Container - wrapper with Pico's .container class
 */
export function Container(props: ContainerProps) {
	const model = containerModel(props)
	return (
		<dynamic tag={model.tag} class={model.fluid ? 'container-fluid' : 'container'} {...props.el}>
			{props.children}
		</dynamic>
	)
}

/**
 * Heading - semantic heading with level prop
 */
const PICO_COLOR: Record<string, string> = {
	primary: 'var(--pico-primary)',
	secondary: 'var(--pico-secondary)',
	contrast: 'var(--pico-contrast)',
	success: 'var(--pico-ins-color)',
	danger: 'var(--pico-del-color)',
	warning: 'var(--pico-mark-background-color)',
}

export function Heading(props: HeadingProps) {
	const model = headingModel(props)
	return (
		<dynamic
			tag={model.tag}
			style={{
				textAlign: model.align !== 'start' ? model.align : undefined,
				color: props.variant ? PICO_COLOR[props.variant] : undefined,
			}}
			{...props.el}
		>
			{props.children}
		</dynamic>
	)
}

/**
 * Text - paragraph wrapper
 */
export function Text(props: TextProps) {
	const model = textModel(props)
	return (
		<dynamic
			tag={model.tag}
			class={model.muted ? 'secondary' : undefined}
			style={{ color: props.variant ? PICO_COLOR[props.variant] : undefined }}
			{...props.el}
		>
			{props.children}
		</dynamic>
	)
}

/**
 * Toolbar - flex container for horizontal layouts
 */
export const Toolbar: ((props: ToolbarProps) => JSX.Element) & {
	Spacer: (props: ToolbarSpacerProps) => JSX.Element
} = Object.assign(
	(props: ToolbarProps) => (
		<div
			{...props.el}
			role="toolbar"
			use={(element: HTMLElement) =>
				setupToolbarNav(element, {
					orientation: props.orientation,
					cycleSegments: props.cycleSegments,
				})
			}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '0.75rem',
			}}
		>
			{props.children}
		</div>
	),
	{
		Spacer: (props: ToolbarSpacerProps) => (
			<span data-toolbar-spacer="" style={{ flex: 1 }} {...props.el} />
		),
	}
)
