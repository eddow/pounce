import { reactive } from 'mutts'
import { progressModel } from '@pounce/ui'

export default function ProgressTests() {
	const state = reactive({
		value: 50
	})

	const model = progressModel({
		get value() { return state.value },
		max: 100
	})

	const indeterminateModel = progressModel({
		value: undefined
	})

	return (
		<div>
			<h1>Progress Model Tests</h1>
			<p>Value: <span data-testid="progress-value">{state.value}</span></p>

			<progress data-testid="test-progress" {...model.progress} />
			<progress data-testid="indeterminate-progress" {...indeterminateModel.progress} />

			<button data-action="set-75" onClick={() => state.value = 75}>Set 75%</button>
		</div>
	)
}
