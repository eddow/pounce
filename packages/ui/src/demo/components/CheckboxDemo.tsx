import { checkboxModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function CheckboxDemo() {
	const state = reactive({
		checked: false,
		disabled: false,
		indeterminate: false,
	})

	const model = checkboxModel({
		get checked() {
			return state.checked
		},
		get disabled() {
			return state.disabled
		},
		get indeterminate() {
			return state.indeterminate
		},
		onChange: (v: any) => (state.checked = v),
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px;">
			<h2>Checkbox Primitive Demo</h2>
			<p>
				Status: {state.checked ? 'Checked' : 'Unchecked'}
				{state.indeterminate ? ' (Indeterminate)' : ''}
			</p>

			<div style="margin-bottom: 16px;">
				<label
					{...model.label}
					style="display: flex; align-items: center; gap: 8px; cursor: pointer;"
				>
					<input type="checkbox" {...model.input} />
					Toggle this checkbox
				</label>
			</div>

			<div style="display: flex; gap: 8px;">
				<button onClick={() => (state.disabled = !state.disabled)}>Toggle Disabled</button>
				<button onClick={() => (state.indeterminate = !state.indeterminate)}>
					Toggle Indeterminate
				</button>
			</div>
		</div>
	)
}
