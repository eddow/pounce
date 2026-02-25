import { reactive } from 'mutts'
import { selectModel } from '@pounce/ui'

export default function SelectTests() {
	const vm = reactive({
		value: 'a',
		options: [
			{ value: 'a', label: 'Option A' },
			{ value: 'b', label: 'Option B' },
			{ value: 'c', label: 'Option C' }
		],
		get model() {
			return selectModel({
				get value() { return this.value },
				get options() { return this.options },
				onInput: (v) => this.value = v
			})
		}
	})

	return (
		<div>
			<h1>Select Model Tests</h1>
			<p>Selected: <span data-testid="selected-value">{vm.value}</span></p>

			<div class="test-case">
				<select
					data-testid="test-select"
					{...vm.model.select}
				>
					<for each={vm.options}>
						{(opt) => (
							<option value={opt.value} selected={opt.value === vm.value}>
								{opt.label}
							</option>
						)}
					</for>
				</select>
			</div>

			<div class="controls">
				<button data-action="select-b" onClick={() => vm.value = 'b'}>
					Select B
				</button>
			</div>
		</div>
	)
}
