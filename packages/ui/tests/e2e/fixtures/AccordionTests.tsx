import { reactive } from 'mutts'
import { accordionModel } from '@pounce/ui'

export default function AccordionTests() {
	const state = reactive({
		expanded: ['item-1']
	})

	const model = accordionModel({
		get expanded() { return state.expanded },
		onToggle: (id: string) => {
			if (state.expanded.includes(id)) {
				state.expanded = state.expanded.filter(i => i !== id)
			} else {
				state.expanded = [...state.expanded, id]
			}
		}
	})

	return (
		<div>
			<h1>Accordion Model Tests</h1>
			<p>Expanded: <span data-testid="expanded-items">{state.expanded.join(', ')}</span></p>

			<div data-testid="accordion-container">
				<div data-testid="item-1">
					<button data-action="toggle-1" {...model.trigger('item-1')}>Toggle Item 1</button>
					<div {...model.content('item-1')}>Content for Item 1</div>
				</div>
				<div data-testid="item-2">
					<button data-action="toggle-2" {...model.trigger('item-2')}>Toggle Item 2</button>
					<div {...model.content('item-2')}>Content for Item 2</div>
				</div>
			</div>
		</div>
	)
}
