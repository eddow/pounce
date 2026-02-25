import { reactive } from 'mutts'
import { starsModel } from '@pounce/ui'

export default function StarsTests() {
	const state = reactive({
		value: 3
	})

	const model = starsModel({
		get value() { return state.value },
		onChange: (v) => state.value = v as number,
		maximum: 5
	})

	return (
		<div>
			<h1>Stars Model Tests</h1>
			<p>Rating: <span data-testid="rating-value">{state.value}</span></p>

			<div data-testid="stars-container" {...model.container} style="display: flex; gap: 4px; font-size: 24px;">
				<for each={model.starItems}>
					{(item) => (
						<span
							data-testid={`star-${item.index}`}
							onMousedown={item.onMousedown}
							onMousemove={item.onMousemove}
							onDblclick={item.onDblclick}
							style="cursor: pointer;"
						>
							{item.status === 'before' || item.status === 'inside' ? '★' : '☆'}
						</span>
					)}
				</for>
			</div>
		</div>
	)
}
