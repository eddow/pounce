import { buttonModel } from '@sursaut/ui'
import { reactive } from 'mutts'

export default function ButtonDemo() {
	const state = reactive({
		clicked: 0,
		disabled: false,
	})

	const model = buttonModel({
		get children() {
			return 'Click me'
		},
		get disabled() {
			return state.disabled
		},
		onClick: () => {
			state.clicked++
			console.log('Button clicked!')
		},
	})

	return (
		<div data-test="button-demo" style="padding: 20px; background: #1e293b; border-radius: 8px;">
			<h2>Button Primitive Demo</h2>
			<p data-test="click-count">Click Count: {state.clicked}</p>

			<div style="display: flex; gap: 12px; align-items: center;">
				<button
					data-test="model-button"
					style="padding: 8px 16px; border: none; border-radius: 4px; background: #3b82f6; color: white; cursor: pointer; opacity: state.disabled ? 0.5 : 1;"
					{...model.button}
				>
					Button Model
				</button>

				<button data-test="toggle-disabled" onClick={() => (state.disabled = !state.disabled)}>
					{state.disabled ? 'Enable' : 'Disable'}
				</button>
			</div>
		</div>
	)
}
