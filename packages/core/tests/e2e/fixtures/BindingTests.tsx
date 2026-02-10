import { reactive } from 'mutts'

const state = reactive({
	value: 'initial',
	textareaValue: 'initial textarea',
	selectValue: 'b',
})

const fixtureControls = {
	setValue(newValue: string) {
		state.value = newValue
	},
	getValue() {
		return state.value
	},
	getTextareaValue() {
		return state.textareaValue
	},
	getSelectValue() {
		return state.selectValue
	},
	reset() {
		state.value = 'initial'
		state.textareaValue = 'initial textarea'
		state.selectValue = 'b'
	},
}

declare global {
	interface Window {
		__bindingFixture?: typeof fixtureControls
	}
}

window.__bindingFixture = fixtureControls

const BindingFixtureApp = () => (
	<main>
		<h1>2-Way Binding Fixture</h1>
		<p>Test 2-way binding with inputs and display</p>

		<section class="controls">
			<button data-action="reset" onClick={() => fixtureControls.reset()}>
				Reset
			</button>
		</section>

		<section class="output">
			<div data-testid="binding-display" style="margin: 20px 0; padding: 10px; border: 1px solid #ccc;">
				Current value: <strong>{state.value}</strong>
			</div>

			<div data-testid="binding-inputs" style="display: flex; gap: 20px; flex-direction: column;">
				<div>
					<label>Input 1:</label>
					<input type="text" data-testid="input1" value={state.value} style="margin-left: 10px; padding: 5px;" />
				</div>
				<div>
					<label>Input 2:</label>
					<input type="text" data-testid="input2" value={state.value} style="margin-left: 10px; padding: 5px;" />
				</div>
				<div>
					<label>Textarea:</label>
					<textarea data-testid="textarea1" value={state.textareaValue} rows={3} style="margin-left: 10px; padding: 5px;" />
				</div>
				<div>
					<label>Textarea display:</label>
					<span data-testid="textarea-display">{state.textareaValue}</span>
				</div>
				<div>
					<label>Select:</label>
					<select data-testid="select1" value={state.selectValue} style="margin-left: 10px; padding: 5px;">
						<option value="a">Option A</option>
						<option value="b">Option B</option>
						<option value="c">Option C</option>
					</select>
				</div>
				<div>
					<label>Select display:</label>
					<span data-testid="select-display">{state.selectValue}</span>
				</div>
			</div>
		</section>
	</main>
)

export default BindingFixtureApp
