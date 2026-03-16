import { arranged } from '@sursaut/ui'
import { type StarItemState, type StarsProps, starsModel } from '@sursaut/ui/models'

const STAR_GLYPHS: Record<string, string> = {
	'star-filled': '★',
	'star-outline': '☆',
}

function starGlyph(iconName: string): string {
	return STAR_GLYPHS[iconName] ?? iconName
}

function StarItem(props: { item: StarItemState; size: string }) {
	return (
		<span
			style={{ fontSize: props.size, cursor: 'pointer', userSelect: 'none' }}
			onMousedown={props.item.onMousedown}
			onMousemove={props.item.onMousemove}
			onDblclick={props.item.onDblclick}
			data-star-status={props.item.status}
		>
			{starGlyph(props.item.iconName)}
		</span>
	)
}

export function Stars(props: StarsProps, scope: Record<string, unknown>) {
	const o = arranged(scope, props)
	const model = starsModel({
		...props,
		get orientation() {
			return o.orientation
		},
	})
	return (
		<div
			class={o.class}
			style={{
				display: 'inline-flex',
				flexDirection: o.orientation === 'vertical' ? 'column-reverse' : 'row',
				alignItems: o.align === 'start' ? 'flex-start' : o.align,
				fontSize: model.size,
			}}
			{...model.container}
		>
			{model.hasZeroElement && <StarItem item={model.zeroItem} size={model.size} />}
			<for each={model.starItems}>
				{(item: StarItemState) => <StarItem item={item} size={model.size} />}
			</for>
		</div>
	)
}
