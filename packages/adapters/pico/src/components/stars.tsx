import { type StarItemState, type StarsProps, starsModel } from '@pounce/ui/models'

function StarItem(props: { item: StarItemState; size: string }) {
	return (
		<span
			style={{ fontSize: props.size, cursor: 'pointer', userSelect: 'none' }}
			onMousedown={props.item.onMousedown}
			onMousemove={props.item.onMousemove}
			onDblclick={props.item.onDblclick}
			data-star-status={props.item.status}
		>
			{props.item.iconName}
		</span>
	)
}

export function Stars(props: StarsProps) {
	const model = starsModel(props)
	return (
		<div
			style={{ display: 'inline-flex', alignItems: 'center', fontSize: model.size }}
			{...model.container}
		>
			{model.hasZeroElement && <StarItem item={model.zeroItem} size={model.size} />}
			<for each={model.starItems}>
				{(item: StarItemState) => <StarItem item={item} size={model.size} />}
			</for>
		</div>
	)
}
