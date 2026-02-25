import { reactive } from 'mutts'

export default function AttributeTests() {
	const state = reactive({
		disabled: true,
		checked: false,
		indeterminate: true
	})

	return (
		<div>
			<h1>Attribute Tests</h1>
			<div class="controls">
				<button data-action="toggle-disabled" onClick={() => state.disabled = !state.disabled}>Toggle Disabled</button>
				<button data-action="toggle-checked" onClick={() => state.checked = !state.checked}>Toggle Checked</button>
				<button data-action="toggle-indeterminate" onClick={() => state.indeterminate = !state.indeterminate}>Toggle Indeterminate</button>
			</div>
			<div class="test-fields">
				<button data-testid="target-button" disabled={state.disabled}>Target Button</button>
				<input type="checkbox" data-testid="target-checkbox" {...({ checked: state.checked, indeterminate: state.indeterminate } as any)} />
			</div>
			<p>Disabled: <span data-testid="disabled-status">{String(state.disabled)}</span></p>
			<p>Checked: <span data-testid="checked-status">{String(state.checked)}</span></p>
			<p>Indeterminate: <span data-testid="indeterminate-status">{String(state.indeterminate)}</span></p>
		</div>
	)
}
