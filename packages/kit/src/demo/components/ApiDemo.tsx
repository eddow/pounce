import { reactive, resource } from 'mutts'
import { ApiError } from '../../api/core'
import { componentStyle } from '../../css'
import { api, intercept } from '../../dom/api'

componentStyle.css`
	.ad-section { margin-bottom: 32px; }
	.ad-section h2 { font-size: 16px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
	.ad-card {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		background: #1a2035;
		border-radius: 8px;
		margin-bottom: 8px;
		overflow: hidden;
	}
	.ad-card-full {
		background: #1a2035;
		border-radius: 8px;
		padding: 16px 20px;
		margin-bottom: 8px;
	}
	.ad-card-full h3 { font-size: 11px; font-weight: 600; color: #475569; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .04em; }
	.ad-content { padding: 16px 20px; }
	.ad-content h3 { font-size: 11px; font-weight: 600; color: #475569; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .04em; }
	.ad-code {
		padding: 16px 20px;
		background: #0d1117;
		border-left: 1px solid #1e2535;
		font-family: monospace;
		font-size: 11px;
		color: #64748b;
		white-space: pre-wrap;
		word-break: break-all;
		overflow-y: auto;
	}
	.ad-code.ok { color: #7dd3fc; }
	.ad-code.error { color: #f87171; }
	.ad-code.loading { color: #475569; }
	.ad-btn {
		padding: 5px 12px;
		border-radius: 5px;
		border: 1px solid #2d3748;
		background: #0d1117;
		color: #94a3b8;
		cursor: pointer;
		font-size: 13px;
	}
	.ad-btn:hover { border-color: #3b82f6; color: #7dd3fc; }
	.ad-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.ad-log {
		background: #0d1117;
		border-radius: 6px;
		padding: 10px 14px;
		font-family: monospace;
		font-size: 11px;
		color: #a3e635;
		min-height: 30px;
		max-height: 120px;
		overflow-y: auto;
	}
	.ad-ts-code {
		color: #94a3b8;
		font-family: monospace;
		font-size: 11px;
		padding: 8px 12px;
		background: #0f172a;
		border-radius: 4px;
		margin-bottom: 12px;
		border: 1px solid #1e293b;
	}
	.ad-ts-code b { color: #3b82f6; font-weight: normal; }
	.ad-ts-code i { color: #60a5fa; font-style: normal; }
`

type Post = { id: number; title: string; body: string; userId: number }

const interceptLog = reactive({ entries: [] as string[] })

intercept('**', async (req, next) => {
	req.headers.set('X-Demo', 'pounce-kit')
	interceptLog.entries = [
		...interceptLog.entries,
		`→ ${req.method} ${new URL(req.url).pathname}${new URL(req.url).search} [X-Demo: pounce-kit]`,
	]
	const res = await next(req)
	interceptLog.entries = [...interceptLog.entries, `← ${res.status} ${new URL(req.url).pathname}`]
	return res
})

const state = reactive({
	postId: 1,
	userId: 1,
})

// Define a base entry point
const postsApi = api('https://jsonplaceholder.typicode.com/posts')
// Entry point with path params
const postDetailApi = api('https://jsonplaceholder.typicode.com/posts/[id]')

export default function ApiDemo() {
	// Showing the resource code using number parameter and cancellation signal
	const post = resource((_, signal) => postDetailApi.get({ id: state.postId }, { signal }))

	// Query params demo using a base entry point with numbers
	const userPosts = resource((_, signal) => postsApi.get({ userId: state.userId }, { signal }))

	// Error demo
	const missingPost = resource((_, signal) => postDetailApi.get({ id: 999999 }, { signal }))

	function prevPost() {
		if (state.postId > 1) state.postId--
	}
	function nextPost() {
		if (state.postId < 100) state.postId++
	}

	function prevUser() {
		if (state.userId > 1) state.userId--
	}
	function nextUser() {
		if (state.userId < 10) state.userId++
	}

	const formatError = (err: any) =>
		err instanceof ApiError ? `ApiError ${err.status}: ${err.message}` : String(err)

	return (
		<section class="ad-section">
			<h2>API Client</h2>
			<p style="font-size:13px;color:#94a3b8;margin:0 0 16px">
				Showcasing <code style="color:#7dd3fc">resource</code> for async state and{' '}
				<code style="color:#7dd3fc">api</code> entry points with path and query parameters.
			</p>

			<div class="ad-card-full">
				<h3>Interceptor log</h3>
				<div class="ad-log">
					<for each={interceptLog.entries}>{(entry) => <div>{entry}</div>}</for>
					<div if={interceptLog.entries.length === 0} style="color:#2d3748">
						intercept('**', …) registered — no requests yet
					</div>
				</div>
			</div>

			<div class="ad-card">
				<div class="ad-content">
					<h3>Path Params: /posts/[id]</h3>
					<div class="ad-ts-code">
						<b>const</b> post = <i>resource</i>((_, signal) ={'>'}
						<br />
						&nbsp;&nbsp;postDetailApi.<i>get</i>({'{'} id: {state.postId} {'}'}, {'{'} signal {'}'})
						<br />)
					</div>
					<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
						<button class="ad-btn" onClick={prevPost}>
							◄
						</button>
						<span style="font-family:monospace;color:#f59e0b;font-size:16px;font-weight:700">
							{state.postId}
						</span>
						<button class="ad-btn" onClick={nextPost}>
							►
						</button>
					</div>
					<div
						if={post.value}
						style="margin-top:12px;padding:12px;background:#0f172a;border-radius:6px;border:1px solid #1e293b"
					>
						<div style="font-weight:600;color:#f8fafc;margin-bottom:4px">
							{(post.value as Post).title}
						</div>
						<div style="font-size:12px;color:#94a3b8;line-height:1.4">
							{(post.value as Post).body}
						</div>
					</div>
				</div>
				<div class={`ad-code ${post.loading ? 'loading' : post.error ? 'error' : 'ok'}`}>
					<span if={post.loading}>Loading…</span>
					<span if={post.error}>{formatError(post.error)}</span>
					<span if={post.value}>{JSON.stringify(post.value, null, 2)}</span>
				</div>
			</div>

			<div class="ad-card">
				<div class="ad-content">
					<h3>Query Params: ?userId=[id]</h3>
					<div class="ad-ts-code">
						<b>const</b> posts = <i>resource</i>((_, signal) ={'>'}
						<br />
						&nbsp;&nbsp;postsApi.<i>get</i>({'{'} userId: {state.userId} {'}'}, {'{'} signal {'}'})
						<br />)
					</div>
					<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
						<button class="ad-btn" onClick={prevUser}>
							◄
						</button>
						<span style="font-family:monospace;color:#10b981;font-size:16px;font-weight:700">
							User {state.userId}
						</span>
						<button class="ad-btn" onClick={nextUser}>
							►
						</button>
					</div>
					<div if={userPosts.value} style="margin-top:12px;max-height:150px;overflow-y:auto">
						<for each={userPosts.value as Post[]}>
							{(p) => (
								<div style="padding:4px 0;border-bottom:1px solid #1e293b;font-size:12px;color:#cbd5e1">
									• {p.title}
								</div>
							)}
						</for>
					</div>
				</div>
				<div class={`ad-code ${userPosts.loading ? 'loading' : 'ok'}`}>
					<span if={userPosts.loading}>Loading…</span>
					<span if={userPosts.value}>{JSON.stringify(userPosts.value, null, 2)}</span>
				</div>
			</div>

			<div class="ad-card">
				<div class="ad-content">
					<h3>ApiError / 404</h3>
					<p style="font-size:12px;color:#64748b;margin:0 0-12px">
						Using <code style="color:#7dd3fc">resource.reload()</code> to retry.
					</p>
					<button
						class="ad-btn"
						onClick={() => missingPost.reload()}
						disabled={missingPost.loading}
					>
						Reload /posts/999999
					</button>
				</div>
				<div class={`ad-code ${missingPost.loading ? 'loading' : 'error'}`}>
					<span if={missingPost.loading}>Loading…</span>
					<span if={missingPost.error}>{formatError(missingPost.error)}</span>
					<span if={!missingPost.loading && !missingPost.error}>Unexpected success</span>
				</div>
			</div>
		</section>
	)
}
