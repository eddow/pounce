import { reactive } from 'mutts'
import { radioButtonModel } from '@pounce/ui'

export default function RadioButtonTests() {
	const state = reactive({
		group: 'a'
	})

	const modelA = radioButtonModel({
		value: 'a',
		get group() { return state.group },
		onClick: () => state.group = 'a'
	})

	const modelB = radioButtonModel({
		value: 'b',
		get group() { return state.group },
		onClick: () => state.group = 'b'
	})

	return (
		<div>
			<h1>RadioButton Model Tests</h1>
			<p>Selected: <span data-testid="selected-value">{state.group}</span></p>

			<button data-testid="radio-a" {...modelA.button}>Option A</button>
			<button data-testid="radio-b" {...modelB.button}>Option B</button>
		</div>
	)
}
