import { reactive } from 'mutts'
import { Radio } from '../../../src/components/forms'

export default function RadioFixture() {
	const state = reactive({ value: 'a' })

	return (
		<div id="radio-controls">
			<div id="radio-group">
				<Radio name="e2e" value="a" group={state.value}>A</Radio>
				<Radio name="e2e" value="b" group={state.value}>B</Radio>
				<Radio name="e2e" value="c" group={state.value}>C</Radio>
			</div>
			<div id="radio-status">Selected: {state.value}</div>
		</div>
	)
}
