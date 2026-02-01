import { reactive } from 'mutts'
import { forwardProps } from '../../src/lib/index'

console.log('ForwardPropsTests module evaluating')

const ChildInput = (props: any) => {
	return (
		<input
			type="text"
			data-testid="child-input"
			// This is the key part: if spread works correctly with forwardProps,
			// value will be bound (get/set) to the parent's state.
			{...forwardProps(props)}
		/>
	)
}

export default function ForwardPropsTests() {
	const state = reactive({
		text: 'original'
	})

	return (
		<div data-testid="forward-props-test">
			<div data-testid="display-value">{state.text}</div>
			<ChildInput
				value={state.text}
				class="test-class"
			/>
			<button
				data-testid="reset-btn"
				onClick={() => state.text = 'reset'}
			>
				Reset
			</button>
		</div>
	)
}
