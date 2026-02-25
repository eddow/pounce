import { reactive } from 'mutts'

export default function LifecycleTests() {
	const state = reactive({
		showChild: true,
		mountCount: 0,
		unmountCount: 0
	})

	function Child() {
		return (
			<div
				data-testid="lifecycle-child"
				use={() => {
					state.mountCount++
					return () => {
						state.unmountCount++
					}
				}}
			>
				Child Component
			</div>
		)
	}

	return (
		<div>
			<h1>Lifecycle Tests</h1>
			<button data-action="toggle-child" onClick={() => state.showChild = !state.showChild}>
				Toggle Child
			</button>
			<div data-testid="lifecycle-container">
				{state.showChild ? <Child /> : null}
			</div>
			<p>Mount Count: <span data-testid="mount-count">{state.mountCount}</span></p>
			<p>Unmount Count: <span data-testid="unmount-count">{state.unmountCount}</span></p>
		</div>
	)
}
