import { reactive } from 'mutts'


export interface ErrorBoundaryProps {
	children: JSX.Element | JSX.Element[]
	fallback?: (error: Error, errorInfo: { componentStack: string }) => JSX.Element
	onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

export const ErrorBoundary = (props: ErrorBoundaryProps) => {
	const state = reactive({
		hasError: false,
		error: undefined as Error | undefined,
		errorInfo: undefined as { componentStack: string } | undefined,
	})

	const content = () => {
		if (state.hasError && state.error) {
			if (props.fallback) {
				return props.fallback(state.error, state.errorInfo || { componentStack: '' })
			}
			return (
				<div style="padding: 20px; border: 1px solid #ff6b6b; background-color: #ffe0e0; color: #d63031; margin: 20px;">
					<h3>Something went wrong</h3>
					<details>
						<summary>Error details</summary>
						<pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">
							{state.error.stack}
						</pre>
					</details>
				</div>
			)
		}

		try {
			// If children is a function, call it. If it's a mountable, @pounce/core will handle it.
			// The key is that we are calling it inside this reactive function context.
			return props.children
		} catch (e) {
			console.error('ErrorBoundary caught error:', e)
			state.hasError = true
			state.error = e as Error
			return null
		}
	}

	return <div class="pp-error-boundary">{content}</div>
}

export const ProductionErrorBoundary = (props: { children: JSX.Element | JSX.Element[] }) => {
	const state = reactive({ hasError: false })

	const content = () => {
		if (state.hasError) {
			return (
				<div style="padding: 20px; text-align: center; color: #666;">
					<h2>Something went wrong</h2>
					<p>Please refresh the page and try again.</p>
				</div>
			)
		}
		try {
			return props.children
		} catch (e) {
			console.error('ProductionErrorBoundary caught error:', e)
			state.hasError = true
			return null
		}
	}

	return <div class="pp-error-boundary-prod">{content}</div>
}
