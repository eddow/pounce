import { reactive } from 'mutts'
import { createOverlayStack, dialogSpec } from '@pounce/ui'

export default function OverlayTests() {
	const stack = createOverlayStack()

	const state = reactive({
		dialogOpen: false,
		lastAction: 'None'
	})

	function openDialog() {
		state.dialogOpen = true
			stack.push(dialogSpec({
				title: 'Test Dialog',
				message: <span data-testid="test-dialog-content">This is an E2E dialog.</span>,
				buttons: {
					close: { text: 'Close', variant: 'primary' }
				}
			})).then((result) => {
				state.lastAction = result === 'close' ? 'Closed via button' : 'Closed via spec'
				state.dialogOpen = false
			})
	}

	return (
		<div>
			<h1>Overlay Model Tests</h1>
			<p>Last Action: <span data-testid="last-action">{state.lastAction}</span></p>
			<p>Is Open: <span data-testid="is-open">{state.dialogOpen ? 'Yes' : 'No'}</span></p>

			<div class="test-case">
				<button data-action="open-dialog" onClick={openDialog}>
					Open Dialog
				</button>
			</div>

			{/* Render the stack */}
			<div data-testid="overlay-stack">
				<for each={stack.stack}>
					{(entry) => (
						<div class="overlay-backdrop">
							<div class="overlay-container">
								{entry.render ? entry.render(entry.resolve) : null}
							</div>
						</div>
					)}
				</for>
			</div>
		</div>
	)
}
