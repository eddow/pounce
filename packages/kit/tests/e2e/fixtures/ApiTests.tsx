import { api, intercept } from '../../../src/dom/api'
import { reactive, resource } from 'mutts'

// Mock interceptor for E2E
intercept('**', async (req: any, next: any) => {
	if (req.url.endsWith('/e2e/user')) {
		// Add delay to show loading state in tests
		await new Promise(r => setTimeout(r, 100))
		return new Response(JSON.stringify({ id: 1, name: 'E2E User' }), {
			headers: { 'Content-Type': 'application/json' }
		})
	}
	return next(req)
})

export default function ApiTests() {
	const state = reactive({
		trigger: 0
	})

	const user = resource(() => {
		void state.trigger
		return api('/e2e/user').get<{ id: number; name: string }>()
	})

	return (
		<div data-testid="api-view">
			<h1>API Tests</h1>
			<button data-action="refetch" onClick={() => state.trigger++}>Refetch</button>

			<div if={user.loading} data-testid="api-loading">Loading...</div>
			<div else if={user.error} data-testid="api-error">Error: {user.error.message}</div>
			<div else data-testid="api-result">
				<p>User: <span data-testid="api-user-name">{user.value?.name}</span></p>
				<p>ID: <span data-testid="api-user-id">{user.value?.id}</span></p>
			</div>

			<p>Fetch Count: <span data-testid="api-fetch-count">{state.trigger + 1}</span></p>
		</div>
	)
}
