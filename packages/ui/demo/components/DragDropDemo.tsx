import { reactive } from 'mutts'
import { drag, drop, dragging } from '../../src/directives/drag-drop'

export default function DragDropDemo(_: {}, scope: any) {
	const state = reactive({
		items: [
			{ id: 1, text: 'Drag Me (Item 1)' },
			{ id: 2, text: 'Or Me (Item 2)' },
			{ id: 3, text: "Don't forget Me (Item 3)" },
		]
	})

	Object.assign(scope, { drag, drop, dragging })

	const handleDrop = (payload: any, targetId: number) => {
		const currentItems = state.items
		const draggedIndex = currentItems.findIndex((i: any) => i.id === payload.id)
		const targetIndex = currentItems.findIndex((i: any) => i.id === targetId)

		if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return

		// Reorder
		const newItems = [...currentItems]
		const [draggedItem] = newItems.splice(draggedIndex, 1)
		newItems.splice(targetIndex, 0, draggedItem)
		state.items = newItems
	}

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '8px',
				maxWidth: '300px',
				padding: '20px',
				border: '1px solid #ccc',
				borderRadius: '8px',
				color: 'white'
			}}
		>
			<h3>Drag & Drop Demo</h3>
			<p style={{ fontSize: '12px', color: '#94a3b8' }}>
				Reorder the items below using native drag and drop.
			</p>

			<for each={state.items}>
				{(item: any) => {
					const isHovered = reactive({ value: false })

					return (
						<div
							style={{
								padding: '12px',
								background: isHovered.value ? '#334155' : '#1e293b',
								border: isHovered.value ? '2px dashed #38bdf8' : '1px solid #475569',
								borderRadius: '4px',
								cursor: 'grab',
								userSelect: 'none',
								transition: 'all 0.1s',
							}}
							use:drag={item}
							use:dragging={(payload: any) => {
								if (payload.id === item.id) return false

								isHovered.value = true
								return () => {
									isHovered.value = false
								}
							}}
							use:drop={(payload: any) => {
								handleDrop(payload, item.id)
							}}
						>
							{item.text}
						</div>
					)
				}}
			</for>
		</div>
	)
}
