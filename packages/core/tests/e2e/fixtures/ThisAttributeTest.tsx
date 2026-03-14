import { reactive } from 'mutts'
import { latch } from '@sursaut'

export default function ThisAttributeTest() {
	const state = reactive({
		directCallbackCalled: false,
		directCallbackElement: undefined as HTMLElement | undefined,
	})

	return (
		<div>
			<h1>this= Attribute Test</h1>
			<div>
				<input
					data-testid="direct-callback"
					this={(el) => {
						console.log('mounted', el)
						state.directCallbackCalled = true
						state.directCallbackElement = el as HTMLElement
					}}
				/>
			</div>
			<p>Direct Callback Called: <span data-testid="direct-called">{state.directCallbackCalled ? 'Yes' : 'No'}</span></p>
			<p>Element Captured: <span data-testid="element-captured">{state.directCallbackElement ? 'Yes' : 'No'}</span></p>
		</div>
	)
}
