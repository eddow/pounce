import { reactive } from 'mutts'
import { createOverlayStack, toastSpec } from '@pounce/ui'

export default function ToastTests() {
	const stack = createOverlayStack()
	const state = reactive({
		lastToast: ''
	})

	function showToast() {
		state.lastToast = 'Toast spawned'
		stack.push(toastSpec({
			message: 'Test Message',
			variant: 'success',
			onClose: () => state.lastToast = 'Toast closed'
		}))
	}

	return (
		<div>
			<h1>Toast Model Tests</h1>
			<p>Last Action: <span data-testid="last-action">{state.lastToast}</span></p>
			<button data-action="show-toast" onClick={showToast}>Show Toast</button>

			<div data-testid="toast-container" style="position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px;">
				<for each={stack.entries}>
					{(entry) => (
						<div data-testid="toast-item" class="toast-entry">
							{entry.element}
						</div>
					)}
				</for>
			</div>
		</div>
	)
}
