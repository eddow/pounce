import { type ArrangedProps, arranged } from '@sursaut/ui'
import { type ButtonGroupNavOptions, setupButtonGroupNav } from '@sursaut/ui/models'

export type ButtonGroupProps = ArrangedProps & {
	trapTab?: ButtonGroupNavOptions['trapTab']
	roleFilter?: ButtonGroupNavOptions['roleFilter']
	children?: JSX.Children
	el?: JSX.IntrinsicElements['div']
}

function crossAlign(align: ArrangedProps['align']) {
	return align === 'start' ? 'flex-start' : align
}

export function ButtonGroup(props: ButtonGroupProps, scope: Record<string, unknown>) {
	const o = arranged(scope, props)
	return (
		<div
			{...props.el}
			class={[o.class, props.el?.class]}
			role="group"
			style={{
				display: 'inline-flex',
				flexDirection: o.orientation === 'vertical' ? 'column' : 'row',
				alignItems: crossAlign(o.align),
			}}
			use={(element: HTMLElement) =>
				setupButtonGroupNav(element, {
					orientation: o.orientation,
					trapTab: props.trapTab,
					roleFilter: props.roleFilter,
				})
			}
		>
			{props.children}
		</div>
	)
}
