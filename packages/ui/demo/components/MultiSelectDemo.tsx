import { multiselectModel } from '@sursaut/ui'
import { reactive } from 'mutts'

type Language = { id: string; label: string }

function sameLanguage(left: Language, right: Language): boolean {
	return left.id === right.id
}

function isSelected(value: Set<Language>, item: Language): boolean {
	return Array.from(value).some((selected) => sameLanguage(selected, item))
}

export default function MultiSelectDemo() {
	const items: Language[] = [
		{ id: 'js', label: 'JavaScript' },
		{ id: 'ts', label: 'TypeScript' },
		{ id: 'py', label: 'Python' },
		{ id: 'rs', label: 'Rust' },
		{ id: 'go', label: 'Go' },
	]

	const state = reactive({
		selected: new Set<Language>([items[0], items[1]]),
	})

	const toggleItem = (item: Language) => (e: Event) => {
		e.preventDefault()
		e.stopPropagation()
		const next = new Set(state.selected as Set<Language>)
		const existing = Array.from(next).find((selected) => sameLanguage(selected, item))
		if (existing) next.delete(existing)
		else next.add(item)
		state.selected = next
	}

	const model = multiselectModel({
		items,
		get value() {
			return state.selected as Set<Language>
		},
		equals: sameLanguage,
		onChange: (value) => {
			state.selected = value
		},
		closeOnSelect: false,
		renderItem: (item) => <span>{item.label}</span>,
	})

	return (
		<div
			data-test="multiselect-demo"
			style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;"
		>
			<h2>MultiSelect Primitive Demo</h2>
			<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px;">
				<div data-test="multiselect-selected" style="color: #94a3b8; font-size: 14px;">
					Selected tags:{' '}
					{Array.from(state.selected as Set<Language>)
						.map((item) => item.label)
						.join(', ') || 'None'}
				</div>
				<button
					data-test="multiselect-clear"
					style="background: #334155; color: white; border: 1px solid #475569; border-radius: 6px; padding: 6px 10px; cursor: pointer;"
					onClick={() => {
						state.selected = new Set<Language>()
					}}
				>
					Clear all
				</button>
			</div>

			<details
				data-test="multiselect-root"
				use={model.onMount}
				{...model.details}
				style="position: relative;"
			>
				<summary
					data-test="multiselect-toggle"
					{...model.summary}
					style="list-style: none; padding: 10px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
				>
					<span>Choose Languages...</span>
					<span data-test="multiselect-count">{state.selected.size} selected</span>
				</summary>
				<ul style="position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; padding: 4px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; list-style: none; max-height: 200px; overflow-y: auto; z-index: 10;">
					<for each={items}>
						{(item) => {
							const checked = isSelected(state.selected as Set<Language>, item)
							return (
								<li
									data-test={`multiselect-item-${item.id}`}
									onClick={toggleItem(item)}
									style={`padding: 8px 12px; border-radius: 4px; cursor: pointer; transition: background 0.2s; background: ${checked ? '#334155' : 'transparent'};`}
								>
									<div style="display: flex; align-items: center; gap: 8px;">
										<div
											style={`width: 16px; height: 16px; border: 1px solid #475569; border-radius: 3px; display: flex; align-items: center; justify-content: center; background: ${checked ? '#3b82f6' : 'transparent'};`}
										>
											{checked ? (
												<div style="width: 8px; height: 8px; background: white; border-radius: 1px;" />
											) : null}
										</div>
										{item.label}
									</div>
								</li>
							)
						}}
					</for>
				</ul>
			</details>
		</div>
	)
}
