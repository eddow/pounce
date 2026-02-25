import { reactive } from 'mutts'
import { multiselectModel } from '@pounce/ui'

export default function MultiSelectTests() {
	const vm = reactive({
		selected: new Set(['apple', 'banana']),
		get model() {
			return multiselectModel({
				items: ['apple', 'banana', 'cherry'],
				value: this.selected,
				renderItem: (item, checked) => (
					<span data-testid={`item-${item}`}>{item} {checked ? '[x]' : '[ ]'}</span>
				)
			})
		}
	})

	return (
		<div>
			<h1>MultiSelect Model Tests</h1>
			<p>Selected: <span data-testid="selected-count">{vm.selected.size}</span></p>

			<details use={vm.model.onMount} {...vm.model.details}>
				<summary {...vm.model.summary}>Select Fruits</summary>
				<ul>
					<for each={vm.model.items}>
						{(item) => (
							<li data-testid={`row-${item.item}`} onClick={item.toggle}>
								{item.rendered}
							</li>
						)}
					</for>
				</ul>
			</details>
		</div>
	)
}
