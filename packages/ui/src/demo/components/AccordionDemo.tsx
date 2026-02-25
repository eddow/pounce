import { accordionModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function AccordionDemo() {
	const state = reactive({
		expanded: ['a'],
	})

	const model = accordionModel({
		get expanded() {
			return state.expanded
		},
		onToggle: (id: string) => {
			if (state.expanded.includes(id)) {
				state.expanded = state.expanded.filter((i) => i !== id)
			} else {
				state.expanded = [...state.expanded, id]
			}
		},
	})

	const items = [
		{
			id: 'a',
			title: 'What is Pounce?',
			content: 'Pounce is a minimal reactive framework for the web.',
		},
		{
			id: 'b',
			title: 'Is it fast?',
			content: 'Yes, it uses mutts for extremely efficient reactivity.',
		},
		{
			id: 'c',
			title: 'Can I use it today?',
			content: 'Absolutely! Check out the docs to get started.',
		},
	]

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>Accordion Primitive Demo</h2>

			<div style="display: flex; flex-direction: column; gap: 8px;">
				<for each={items}>
					{(item) => (
						<div style="border: 1px solid #475569; border-radius: 4px; overflow: hidden;">
							<button
								style={`width: 100%; text-align: left; padding: 12px; background: #334155; border: none; color: white; cursor: pointer; font-weight: bold;`}
								{...model.trigger(item.id)}
							>
								{item.title} {state.expanded.includes(item.id) ? '▾' : '▸'}
							</button>
							<div
								style={`padding: 12px; background: #1e293b; line-height: 1.5;`}
								{...model.content(item.id)}
							>
								{item.content}
							</div>
						</div>
					)}
				</for>
			</div>
		</div>
	)
}
