import {
	type GridProps,
	gridModel,
	type InlineProps,
	inlineModel,
	type StackProps,
	stackModel,
} from '@pounce/ui/models'

export function Stack(props: StackProps) {
	const model = stackModel(props)
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: model.gap,
				alignItems: model.alignItems,
				justifyContent: model.justifyContent,
			}}
			{...props.el}
		>
			{props.children}
		</div>
	)
}

export function Inline(props: InlineProps) {
	const model = inlineModel(props)
	return (
		<div
			style={{
				display: 'flex',
				gap: model.gap,
				alignItems: model.alignItems,
				justifyContent: model.justifyContent,
				flexWrap: model.flexWrap,
				overflowX: model.scrollable ? 'auto' : undefined,
			}}
			{...props.el}
		>
			{props.children}
		</div>
	)
}

export function Grid(props: GridProps) {
	const model = gridModel(props)
	return (
		<div
			style={{
				display: 'grid',
				gap: model.gap,
				gridTemplateColumns: model.gridTemplateColumns,
				alignItems: model.alignItems,
				justifyItems: model.justifyItems,
			}}
			{...props.el}
		>
			{props.children}
		</div>
	)
}
