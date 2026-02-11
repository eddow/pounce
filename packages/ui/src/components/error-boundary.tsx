import { caught, reactive } from 'mutts'
import { reconcile, type Scope } from '@pounce/core'
import { getAdapter } from '../adapter/registry'

/**
 * ErrorBoundary - Catches and displays errors in component trees
 *
 * Architecture: An inner `ErrorReceiver` component wraps the children and
 * registers `caught` to catch errors from child rendering/effects.
 * When an error is caught, it updates shared reactive state. The boundary's
 * `use=` mount callback reactively renders either the receiver or a fallback
 * based on that state — decoupled from the boundary's own `produce`.
 *
 * ⚠️ LIMITATIONS:
 * - Does NOT catch async errors in Promises (use `.catch()`)
 * - Does NOT catch errors in event handlers (use try-catch in handlers)
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
// TODO: Could really be remade with jsx instead of .render()
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

interface ReceiverProps {
	children: JSX.Element | JSX.Element[]
	state: { error: undefined | Error }
	onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

const ErrorReceiver = (props: ReceiverProps) => {
	caught((thrown: unknown) => {
		const error = thrown instanceof Error ? thrown : new Error(String(thrown))
		if (error.name === 'DynamicRenderingError') return
		if (!props.state.error) {
			props.state.error = error
			props.onError?.(error, { componentStack: '' })
		}
	})
	return <span style="display:contents">{props.children}</span>
}

export const ErrorBoundary = (props: ErrorBoundaryProps, scope: Scope) => {
	const adapter = getAdapter('ErrorBoundary')
	const state = reactive({ error: undefined as Error | undefined })

	const mount = (container: Node) => {
		const el = container as HTMLElement

		if (!state.error) {
			const receiver = <ErrorReceiver state={state} onError={props.onError}>{props.children}</ErrorReceiver>
			try {
				return reconcile(el, receiver.render(scope))
			} catch {
				// DynamicRenderingError — ErrorReceiver's caught() already set state.error
			}
		}

		if (state.error) {
			const fallbackJsx = props.fallback
				? props.fallback(state.error, { componentStack: '' })
				: defaultFallback(state.error)
			return reconcile(el, fallbackJsx.render(scope))
		}
	}

	return <div class={adapter.classes?.base || 'pounce-error-boundary'} use={mount} />
}

export const ProductionErrorBoundary = (props: { children: JSX.Element | JSX.Element[] }, scope: Scope) => {
	const adapter = getAdapter('ErrorBoundary')
	const state = reactive({ error: undefined as Error | undefined })

	const mount = (container: Node) => {
		const el = container as HTMLElement

		if (!state.error) {
			const receiver = <ErrorReceiver state={state}>{props.children}</ErrorReceiver>
			try {
				return reconcile(el, receiver.render(scope))
			} catch {
				// DynamicRenderingError — ErrorReceiver's caught() already set state.error
			}
		}

		if (state.error) {
			const fallbackJsx = (
				<div style="padding: 20px; text-align: center; color: #666;">
					<h2>Something went wrong</h2>
					<p>Please refresh the page and try again.</p>
				</div>
			)
			return reconcile(el, fallbackJsx.render(scope))
		}
	}

	return <div class={adapter.classes?.production || 'pounce-error-boundary-prod'} use={mount} />
}