import { checkboxModel } from '@sursaut/ui'
import { reactive } from 'mutts'

export default function CheckboxDemo() {
	const state = reactive({
		checked: false as boolean | undefined,
		disabled: false,
	})

	const model = checkboxModel({
		get checked() {
			return state.checked
		},
		get disabled() {
			return state.disabled
		},
		onChange: (v: boolean) => (state.checked = v),
	})

	return (
		<div data-test="checkbox-demo" style="padding: 20px; background: #1e293b; border-radius: 8px;">
			<h2>Checkbox Primitive Demo</h2>
			<p data-test="checkbox-status">
				Status:{' '}
				{state.checked ? 'Checked' : state.checked === false ? 'Unchecked' : 'Indeterminate'}
			</p>

			<div style="margin-bottom: 16px;">
				<label
					data-test="checkbox-label"
					style="display: flex; align-items: center; gap: 8px; cursor: pointer;"
				>
					<input data-test="checkbox-input" {...model.input} />
					Toggle this checkbox
				</label>
			</div>

			<div style="display: flex; gap: 8px;">
				<button data-test="toggle-disabled" onClick={() => (state.disabled = !state.disabled)}>
					Toggle Disabled
				</button>
				<button data-test="toggle-indeterminate" onClick={() => (state.checked = undefined)}>
					Set Indeterminate
				</button>
			</div>
		</div>
	)
}
