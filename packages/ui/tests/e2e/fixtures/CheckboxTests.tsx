import { reactive } from 'mutts'
import { checkboxModel } from '@pounce/ui'

export default function CheckboxTests() {
	const vm = reactive({
		checked: false,
		disabled: false,
		indeterminate: false,
		get model() {
			return checkboxModel({
				get checked() { return this.checked },
				get disabled() { return this.disabled },
				get indeterminate() { return this.indeterminate },
				onChange: (v) => this.checked = v
			})
		}
	})

	return (
		<div>
			<h1>Checkbox Model Tests</h1>
			<p>Status: <span data-testid="status-text">{vm.checked ? 'Checked' : 'Unchecked'}{vm.indeterminate ? ' (Indeterminate)' : ''}</span></p>

			<div class="test-case">
				<label>
					<input
						data-testid="test-checkbox"
						{...vm.model.input}
					/>
					Click Me
				</label>
			</div>

			<div class="controls">
				<button data-action="toggle-checked" onClick={() => vm.checked = !vm.checked}>
					Toggle Checked
				</button>
				<button data-action="toggle-disabled" onClick={() => vm.disabled = !vm.disabled}>
					Toggle Disabled
				</button>
				<button data-action="toggle-indeterminate" onClick={() => vm.indeterminate = !vm.indeterminate}>
					Toggle Indeterminate
				</button>
			</div>
		</div>
	)
}
