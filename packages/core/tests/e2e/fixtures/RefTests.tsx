import { reactive } from 'mutts'
import { ReactiveProp } from '@pounce/core'

export default function RefTests() {
	const state = reactive({
		show: true,
		refValue: null as HTMLElement | null,
		callbackRef: null as HTMLElement | null
	})

	const manualRef = new ReactiveProp<HTMLElement | null>(
		() => state.refValue,
		(v) => state.refValue = v
	)


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
							this={manualRef as any}
						>
							ReactiveProp Ref Target
						</div>
						<div
							data-testid="callback-ref"
							this={state.callbackRef as any}
						>
							Callback Ref Target
						</div>
					</>
				) : null}
			</div>
			<p>Manual Ref Set: <span data-testid="reactive-prop-status">{manualRef.get() ? 'Yes' : 'No'}</span></p>
			<p>Callback Ref Set: <span data-testid="callback-status">{state.callbackRef ? 'Yes' : 'No'}</span></p>
		</div>
	)
}
