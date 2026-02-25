import { reactive } from 'mutts'
import { checkButtonModel } from '@pounce/ui'

export default function CheckButtonTests() {
	const state = reactive({
		checked: false,
		disabled: false
	})

	const model = checkButtonModel({
		get checked() { return state.checked },
		get disabled() { return state.disabled },
		onCheckedChange: (v: boolean) => state.checked = v,
		children: 'Toggle Me'
	})

	return (
		<div>
			<h1>CheckButton Model Tests</h1>
			<p>Checked: <span data-testid="checked-status">{state.checked ? 'Yes' : 'No'}</span></p>

			<button data-testid="check-button" {...model.button}>
				{model.checked ? '[x]' : '[ ]'} {model.button.children}
			</button>

			<button data-action="toggle-disabled" onClick={() => state.disabled = !state.disabled}>
				Toggle Disabled
			</button>
		</div>
	)
}
