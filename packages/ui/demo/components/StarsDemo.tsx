import { componentStyle } from '@sursaut/kit'
import { starsModel } from '@sursaut/ui'
import { reactive } from 'mutts'

export default function StarsDemo() {
	const state = reactive({
		rating: 4,
		range: [2, 4] as [number, number],
	})

	const starGlyph = (status: 'before' | 'inside' | 'after' | 'zero') =>
		status === 'after' || status === 'zero' ? '☆' : '★'

	const setSingle = (value: number) => {
		state.rating = value
	}

	const setRangeMax = (max: number) => {
		state.range = [state.range[0], Math.max(state.range[0], max)]
	}

	const collapseRange = (value: number) => {
		state.range = [value, value]
	}

	const singleModel = starsModel({
		get value() {
			return state.rating
		},
		set value(v) {
			state.rating = v
		},
		onChange: (v) => {
			if (typeof v === 'number') state.rating = v
		},
		before: 'star-filled',
		after: 'star-outline',
	})

	const rangeModel = starsModel({
		get value() {
			return state.range
		},
		set value(v) {
			state.range = v
		},
		onChange: (v) => {
			if (Array.isArray(v) && v.length === 2) {
				const [min, max] = v
				if (typeof min === 'number' && typeof max === 'number') {
					state.range = [min, max]
				}
			}
		},
		maximum: 10,
		size: '2rem',
	})

	return (
		<div
			data-test="stars-demo"
			style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;"
		>
			<h2>Stars Primitive Demo</h2>

			<div style="margin-bottom: 32px;">
				<p
					data-test="star-rating"
					data-value={String(state.rating)}
					style="margin-bottom: 8px; font-size: 14px; color: #94a3b8;"
				>
					Single Value: {state.rating}
				</p>
				<div style="display: flex; gap: 6px; margin-bottom: 8px;">
					<button data-test="star-action-single-2" onClick={() => setSingle(2)}>
						Set 2
					</button>
				</div>
				<div
					data-test="stars-single"
					{...singleModel.container}
					style="display: flex; gap: 4px; font-size: 2rem; color: #facc15;"
				>
					<for each={singleModel.starItems}>
						{(item) => (
							<span
								data-test={`star-single-${item.index + 1}`}
								{...item.el}
							>
								{starGlyph(item.status)}
							</span>
						)}
					</for>
				</div>
			</div>

			<div>
				<p
					data-test="star-range"
					data-value={`${state.range[0]}-${state.range[1]}`}
					style="margin-bottom: 8px; font-size: 14px; color: #94a3b8;"
				>
					Range Selection: {state.range[0]} - {state.range[1]}
				</p>
				<div style="display: flex; gap: 6px; margin-bottom: 8px;">
					<button data-test="star-action-range-7" onClick={() => setRangeMax(7)}>
						Set max 7
					</button>
					<button data-test="star-action-collapse-7" onClick={() => collapseRange(7)}>
						Collapse 7
					</button>
				</div>
				<div
					data-test="stars-range"
					{...rangeModel.container}
					style="display: flex; gap: 2px; font-size: 1.5rem; color: #fbbf24;"
				>
					<for each={rangeModel.starItems}>
						{(item) => (
							<span
								data-test={`star-range-${item.index + 1}`}
								{...item.el}
							>
								{starGlyph(item.status)}
							</span>
						)}
					</for>
				</div>
				<p style="font-size: 12px; color: #64748b; margin-top: 8px;">
					Drag to adjust range, double-click to collapse.
				</p>
				<p
					data-test="star-debug"
					style="margin-top: 8px; font-size: 13px; font-family: monospace; color: #38bdf8;"
				>
					model.value={JSON.stringify(rangeModel.value)} | draggingEnd={String(rangeModel.draggingEnd)}
				</p>
			</div>
		</div>
	)
}
