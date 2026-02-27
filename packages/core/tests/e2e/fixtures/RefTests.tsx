import { reactive } from 'mutts'

export default function RefTests() {
	const state = reactive({
		show: true,
		refValue: undefined as HTMLDivElement | undefined,
		callbackRef: undefined as HTMLElement | undefined
	})


	return (
		<div>
			<h1>Ref Tests (this=)</h1>
			<button data-action="toggle-refs" onClick={() => state.show = !state.show}>
				Toggle Refs
			</button>
			<div data-testid="ref-container">
				{state.show ? (
					<>
						<div
							data-testid="reactive-prop-ref"
							this={state.refValue}
						>
							ReactiveProp Ref Target
						</div>
						<div
							data-testid="callback-ref"
							this={(node: Node | readonly Node[]) => state.callbackRef = node as HTMLElement}
						>
							Callback Ref Target
						</div>
					</>
				) : null}
			</div>
			<p>Manual Ref Set: <span data-testid="reactive-prop-status">{state.refValue ? 'Yes' : 'No'}</span></p>
			<p>Callback Ref Set: <span data-testid="callback-status">{state.callbackRef ? 'Yes' : 'No'}</span></p>
		</div>
	)
}
