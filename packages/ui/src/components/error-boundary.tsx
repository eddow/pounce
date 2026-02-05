import { onEffectThrow } from 'mutts'
import { compose } from '@pounce/core'

/**
 * ErrorBoundary - Catches and displays errors in component trees
 *
 * Uses mutts' onEffectThrow to properly catch errors in reactive effects.
 * Errors in child components and effects propagate up and are caught by
 * the error handler registered via onEffectThrow.
 *
 * ⚠️ LIMITATIONS:
 * - Catches errors in effects and component rendering
 * - Does NOT catch:
 *   - Async errors in Promises (use .catch() on Promises)
 *   - Errors in event handlers (use try-catch in handlers)
 *
 * @example
 * <ErrorBoundary
 *   fallback={(error) => <div>Custom error: {error.message}</div>}
 *   onError={(error) => logToService(error)}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 */
export interface ErrorBoundaryProps {
	children: JSX.Element | JSX.Element[]
	fallback?: (error: Error, errorInfo: { componentStack: string }) => JSX.Element
	onError?: (error: Error, errorInfo: { componentStack: string }) => void
}
const defaultFallback = (error: Error) => (
	<div style="padding: 20px; border: 1px solid #ff6b6b; background-color: #ffe0e0; color: #d63031; margin: 20px;">
		<h3>Something went wrong</h3>
		<details>
			<summary>Error details</summary>
			<pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">
				{error.stack}
			</pre>
		</details>
	</div>
)
export const ErrorBoundary = (props: ErrorBoundaryProps) => {
	const state = compose({
			error: undefined as Error | undefined,
		},
		props
	)

	// Register error handler in current effect context (component runs inside effect)
	onEffectThrow((error: unknown) => {
		state.error = error as Error
		props.onError?.(error as Error, { componentStack: '' })
	})

	return (
		<div class="pounce-error-boundary">
			<div if={state.error}>
				{props.fallback ? props.fallback(state.error!, { componentStack: '' }) : defaultFallback(state.error!)}
			</div>
			<fragment else>{props.children}</fragment>
		</div>
	)
}