import { reactive } from 'mutts'
import { createOverlayStack, drawerSpec } from '@pounce/ui'

export default function DrawerTests() {
	const stack = createOverlayStack()
	const state = reactive({
		isOpen: false
	})

	function openDrawer() {
		state.isOpen = true
		stack.push(drawerSpec({
			title: 'Test Drawer',
			side: 'right',
			children: <div data-testid="drawer-content">Drawer is open</div>,
			onClose: () => state.isOpen = false
		}))
	}

	return (
		<div>
			<h1>Drawer Model Tests</h1>
			<p>Status: <span data-testid="drawer-status">{state.isOpen ? 'Open' : 'Closed'}</span></p>
			<button data-action="open-drawer" onClick={openDrawer}>Open Drawer</button>

			<div data-testid="overlay-stack">
				<for each={stack.entries}>
					{(entry) => <div class="overlay-entry">{entry.element}</div>}
				</for>
			</div>
		</div>
	)
}
