import { selectModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function SelectDemo() {
	const state = reactive({
		value: 'blue',
		options: [
			{ value: 'red', label: 'Crimson Red' },
			{ value: 'blue', label: 'Deep Blue' },
			{ value: 'green', label: 'Forest Green' },
		],
	})

	const model = selectModel({
		get value() {
			return state.value
		},
		get options() {
			return state.options
		},
		onInput: (v: any) => (state.value = v),
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px;">
			<h2>Select Primitive Demo</h2>
			<p>
				Chosen color: <span style={`color: ${state.value}; font-weight: bold;`}>{state.value}</span>
			</p>

			<select
				style="padding: 8px; border-radius: 4px; background: #334155; color: white; border: 1px solid #475569;"
				{...model.select}
			>
				<for each={state.options}>
					{(opt) => (
						<option value={opt.value} selected={opt.value === state.value}>
							{opt.label}
						</option>
					)}
				</for>
			</select>
		</div>
	)
}
