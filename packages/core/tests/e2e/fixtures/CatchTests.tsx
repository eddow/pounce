import { effect, reactive } from 'mutts'

export default function CatchTests() {
	const state = reactive({
		trigger: false,
		errorCount: 0,
		okCount: 0
	})

	function ThrowingComponent() {
		effect(() => {
			if (state.trigger) throw new Error('Test Error')
		})
		return <div data-testid="ok-content">Everything is fine</div>
	}

	return (
		<div>
			<h1>Catch Directive Tests</h1>
			<button data-action="trigger-error" onClick={() => state.trigger = true}>
				Trigger Error
			</button>
			<div data-testid="catch-boundary">
				<try catch={(err: any, reset) => {
						setTimeout(() => { state.errorCount++ }, 0)
						return (
							<div data-testid="error-fallback">
								<p>Caught: {err.message}</p>
								<button data-action="reset-error" onClick={() => {
									state.trigger = false
									reset?.()
								}}>
									Reset
								</button>
							</div>
						)
					}}
				>
					<ThrowingComponent />
				</try>
				<p>Error Count: <span data-testid="error-count">{state.errorCount}</span></p>
			</div>
		</div>
	)
}
