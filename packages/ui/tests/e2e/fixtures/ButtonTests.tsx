import { reactive } from 'mutts'
import { buttonModel } from '@pounce/ui'

export default function ButtonTests() {
	const vm = reactive({
		clicked: 0,
		disabled: false,
		label: 'Click Me',
		get model() {
			return buttonModel({
				get children() { return this.label },
				get disabled() { return this.disabled },
				onClick: () => this.clicked++
			})
		}
	})

	return (
		<div>
			<h1>Button Model Tests</h1>
			<p>Click Count: <span data-testid="click-count">{vm.clicked}</span></p>

			<div class="test-case">
				<h2>Basic Button</h2>
				<button
					data-testid="test-button"
					{...vm.model.button}
				>
					{vm.label}
				</button>
			</div>

			<div class="controls">
				<button data-action="toggle-disabled" onClick={() => vm.disabled = !vm.disabled}>
					Toggle Disabled
				</button>
				<button data-action="change-label" onClick={() => vm.label = 'Value Changed'}>
					Change Label
				</button>
			</div>
		</div>
	)
}
