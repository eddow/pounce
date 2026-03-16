import { accordionModel } from '@sursaut/ui'
import { reactive } from 'mutts'

export default function AccordionDemo() {
	const state = reactive({
		single: 'a' as string | null,
		multi: ['a'] as string[],
	})

	const items = [
		{
			id: 'a',
			title: 'What is Sursaut?',
			content: 'Sursaut is a minimal reactive framework for the web.',
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
		<div
			data-test="accordion-demo"
			style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;"
		>
			<h2>Accordion Primitive Demo</h2>
			<p style="color: #94a3b8; margin-bottom: 16px;">
				`group` can be a single value (exclusive) or an array/set (multi-open).
			</p>

			<h3 style="margin-bottom: 8px;">Exclusive (single value group)</h3>
			<div style="display: flex; gap: 8px; margin-bottom: 8px;">
				<button data-test="accordion-single-open-b" onClick={() => (state.single = 'b')}>
					Open B
				</button>
				<button data-test="accordion-single-clear" onClick={() => (state.single = null)}>
					Close all
				</button>
			</div>
			<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
				<for each={items}>
					{(item) => {
						const model = accordionModel({
							value: item.id,
							get group() {
								return state.single
							},
							set group(v) {
								if (typeof v === 'string' || v === null) state.single = v
							},
							summary: null,
						})

						return (
							<details
								data-test={`accordion-single-${item.id}`}
								style="border: 1px solid #475569; border-radius: 4px; overflow: hidden;"
								use={model.onMount}
								{...model.details}
							>
								<summary
									data-test={`accordion-single-summary-${item.id}`}
									style="padding: 12px; background: #334155; color: white; cursor: pointer; font-weight: bold; list-style: none;"
								>
									{item.title} {model.details.open ? '▾' : '▸'}
								</summary>
								<div style="padding: 12px; background: #1e293b; line-height: 1.5;">
									{item.content}
								</div>
							</details>
						)
					}}
				</for>
			</div>

			<h3 style="margin-bottom: 8px;">Multi-open (array group)</h3>
			<div style="display: flex; gap: 8px; margin-bottom: 8px;">
				<button
					data-test="accordion-multi-open-all"
					onClick={() => (state.multi = items.map((item) => item.id))}
				>
					Open all
				</button>
				<button data-test="accordion-multi-clear" onClick={() => (state.multi = [])}>
					Close all
				</button>
			</div>
			<div style="display: flex; flex-direction: column; gap: 8px;">
				<for each={items}>
					{(item) => {
						const model = accordionModel({
							value: item.id,
							get group() {
								return state.multi
							},
							set group(v) {
								if (Array.isArray(v)) state.multi = v
							},
							summary: null,
						})

						return (
							<details
								data-test={`accordion-multi-${item.id}`}
								style="border: 1px solid #475569; border-radius: 4px; overflow: hidden;"
								use={model.onMount}
								{...model.details}
							>
								<summary
									data-test={`accordion-multi-summary-${item.id}`}
									style="padding: 12px; background: #334155; color: white; cursor: pointer; font-weight: bold; list-style: none;"
								>
									{item.title} {model.details.open ? '▾' : '▸'}
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
