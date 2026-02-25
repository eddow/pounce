import { multiselectModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function MultiSelectDemo() {
	const items = [
		{ id: 'js', label: 'JavaScript' },
		{ id: 'ts', label: 'TypeScript' },
		{ id: 'py', label: 'Python' },
		{ id: 'rs', label: 'Rust' },
		{ id: 'go', label: 'Go' },
	]

	const state = reactive({
		selected: new Set([items[0], items[1]]),
	})

	const model = multiselectModel({
		items,
		value: state.selected,
		closeOnSelect: false,
		renderItem: (item, checked) => (
			<div style="display: flex; align-items: center; gap: 8px;">
				<div
					style={`width: 16px; height: 16px; border: 1px solid #475569; border-radius: 3px; display: flex; align-items: center; justify-content: center; background: ${checked ? '#3b82f6' : 'transparent'};`}
				>
					{checked && (
						<div style="width: 8px; height: 8px; background: white; border-radius: 1px;" />
					)}
				</div>
				{item.label}
			</div>
		),
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>MultiSelect Primitive Demo</h2>
			<div style="margin-bottom: 8px; color: #94a3b8; font-size: 14px;">
				Selected tags:{' '}
				{Array.from(state.selected)
					.map((i) => i.label)
					.join(', ') || 'None'}
			</div>

			<details use={model.onMount} {...model.details} style="position: relative;">
				<summary
					{...model.summary}
					style="list-style: none; padding: 10px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
				>
					<span>Choose Languages...</span>
					<span>{state.selected.size} selected</span>
				</summary>
				<ul style="position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; padding: 4px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; list-style: none; max-height: 200px; overflow-y: auto; z-index: 10;">
					<for each={model.items}>
						{(item) => (
							<li
								onClick={item.toggle}
								style={`padding: 8px 12px; border-radius: 4px; cursor: pointer; transition: background 0.2s; background: ${item.checked ? '#334155' : 'transparent'};`}
							>
								{item.rendered}
							</li>
						)}
					</for>
				</ul>
			</details>
		</div>
	)
}
