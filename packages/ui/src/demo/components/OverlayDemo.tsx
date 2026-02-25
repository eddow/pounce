import { createOverlayStack, dialogSpec } from '@pounce/ui'
import { reactive } from 'mutts'

export default function OverlayDemo() {
	const stack = createOverlayStack()

	const state = reactive({
		dialogOpen: false,
	})

	function openDialog() {
		state.dialogOpen = true
		stack.push(
			dialogSpec({
				title: 'A Headless Dialog',
				children: (
					<div style="background: #1e293b; color: white; padding: 24px; border-radius: 12px; border: 1px solid #475569; position: relative;">
						<h3 style="margin-top: 0;">Interactive Overlay</h3>
						<p>This dialog is part of the Pounce overlay stack.</p>
						<button
							style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
							onClick={() => stack.pop()}
						>
							Dismiss
						</button>
					</div>
				),
				onClose: () => {
					state.dialogOpen = false
				},
			})
		)
	}

	return (
		<div style="padding: 20px; background: #0f172a; border-radius: 8px;">
			<h2>Overlay & Dialog Demo</h2>

			<button
				style="background: #3b82f6; padding: 12px 20px; border: none; color: white; border-radius: 8px; font-weight: bold; cursor: pointer;"
				onClick={openDialog}
			>
				Open Dynamic Overlay
			</button>

			<div style="margin-top: 20px;">
				<for each={stack.entries}>
					{(entry) => (
						<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
							{entry.element}
						</div>
					)}
				</for>
			</div>
		</div>
	)
}
