import { api, intercept } from '../../../src/dom/api'
import { reactive, resource } from 'mutts'
import 'mutts/debug'

// Mock interceptor for E2E
intercept('**', async (req: any, next: any) => {
	const url = new URL(req.url, 'http://localhost')
	console.log(`[E2E] intercept called for ${req.url}, pathname: ${url.pathname}`)
	if (url.pathname === '/e2e/user') {
		console.log(`[E2E] matched USER route`)
		await new Promise(r => setTimeout(r, 100))
		return new Response(JSON.stringify({ id: 1, name: 'E2E User' }), {
			headers: { 'Content-Type': 'application/json' }
		})
	}
	const postMatch = url.pathname.match(/^\/e2e\/post\/(\d+)$/)
	if (postMatch) {
		const id = Number(postMatch[1])
		console.log(`[E2E] matched POST route: id=${id}`)
		await new Promise(r => setTimeout(r, 100))
		return new Response(JSON.stringify({ id, title: `Post ${id}` }), {
			headers: { 'Content-Type': 'application/json' }
		})
	}
	console.log(`[E2E] falling through to next(req) for ${url.pathname}`)
	return next(req)
})

const postApi = api('/e2e/post/[id]')

export default function ApiTests() {
	const state = reactive({
		trigger: 0,
		postId: 1,
	})

	const user = resource(() => {
		void state.trigger
		return api('/e2e/user').get<{ id: number; name: string }>()
	})

	const post = resource(({ signal }) =>
		postApi.get<{ id: number; title: string }>({ id: state.postId }, { signal })
	)

	return (
		<div data-testid="api-view">
			<h1>API Tests</h1>

			<section>
				<h2>User (trigger-based refetch)</h2>
				<button data-action="refetch" onClick={() => state.trigger++}>Refetch</button>
				<div if={user.loading} data-testid="api-loading">Loading...</div>
				<div else if={user.error} data-testid="api-error">Error: {user.error.message}</div>
				<div else data-testid="api-result">
					<p>User: <span data-testid="api-user-name">{user.value?.name}</span></p>
					<p>ID: <span data-testid="api-user-id">{user.value?.id}</span></p>
				</div>
				<p>Fetch Count: <span data-testid="api-fetch-count">{state.trigger + 1}</span></p>
			</section>

			<section>
				<h2>Post (ID-based resource)</h2>
				<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
					<button data-action="prev-post" onClick={() => { if (state.postId > 1) state.postId-- }}>◄</button>
					<span data-testid="api-post-id">{state.postId}</span>
					<button data-action="next-post" onClick={() => state.postId++}>►</button>
				</div>
				<div if={post.loading} data-testid="api-post-loading">Loading...</div>
				<div else if={post.error} data-testid="api-post-error">Error: {post.error.message}</div>
				<div else data-testid="api-post-result">
					<p>Title: <span data-testid="api-post-title">{post.value?.title}</span></p>
				</div>
			</section>
		</div>
	)
}
