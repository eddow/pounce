import { starsModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function StarsDemo() {
	const state = reactive({
		rating: 4,
		range: [2, 4] as [number, number],
	})

	const singleModel = starsModel({
		get value() {
			return state.rating
		},
		onChange: (v) => (state.rating = v as number),
		before: 'star-filled',
		after: 'star-outline',
	})

	const rangeModel = starsModel({
		get value() {
			return state.range
		},
		onChange: (v) => (state.range = v as [number, number]),
		maximum: 10,
		size: '2rem',
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>Stars Primitive Demo</h2>

			<div style="margin-bottom: 32px;">
				<p style="margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
					Single Value: {state.rating}
				</p>
				<div
					{...singleModel.container}
					style="display: flex; gap: 4px; font-size: 2rem; color: #facc15;"
				>
					<for each={singleModel.starItems}>
						{(item) => (
							<span
								onMousedown={item.onMousedown}
								onMousemove={item.onMousemove}
								style="cursor: pointer;"
							>
								{item.status === 'before' ? '★' : '☆'}
							</span>
						)}
					</for>
				</div>
			</div>

			<div>
				<p style="margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
					Range Selection: {state.range[0]} - {state.range[1]}
				</p>
				<div
					{...rangeModel.container}
					style="display: flex; gap: 2px; font-size: 1.5rem; color: #fbbf24;"
				>
					<for each={rangeModel.starItems}>
						{(item) => (
							<span
								onMousedown={item.onMousedown}
								onMousemove={item.onMousemove}
								onDblclick={item.onDblclick}
								style={`cursor: pointer; opacity: ${item.status === 'inside' || item.status === 'before' ? '1' : '0.3'}`}
							>
								★
							</span>
						)}
					</for>
				</div>
				<p style="font-size: 12px; color: #64748b; margin-top: 8px;">
					Drag to adjust range, double-click to collapse.
				</p>
			</div>
		</div>
	)
}
