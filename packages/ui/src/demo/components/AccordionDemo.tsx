import { accordionModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function AccordionDemo() {
	const state = reactive({
		expanded: ['a'],
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
					{(item) => {
						const model = accordionModel({
							get open() {
								return state.expanded.includes(item.id)
							},
							onToggle: (open: boolean) => {
								if (open && !state.expanded.includes(item.id)) {
									state.expanded = [...state.expanded, item.id]
								} else if (!open && state.expanded.includes(item.id)) {
									state.expanded = state.expanded.filter((i) => i !== item.id)
								}
							},
							summary: null,
						})

						return (
							<details
								style="border: 1px solid #475569; border-radius: 4px; overflow: hidden;"
								use={model.onMount}
								{...model.details}
							>
								<summary style="padding: 12px; background: #334155; color: white; cursor: pointer; font-weight: bold; list-style: none;">
									{item.title} {state.expanded.includes(item.id) ? '▾' : '▸'}
								</summary>
								<div style="padding: 12px; background: #1e293b; line-height: 1.5;">
									{item.content}
								</div>
							</details>
						)
					}}
				</for>
			</div>
		</div>
	)
}
