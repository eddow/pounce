import { effect, reactive } from 'mutts'
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
`

type Post = { id: number; title: string; body: string; userId: number }

const interceptLog = reactive({ entries: [] as string[] })

intercept('**', async (req, next) => {
	req.headers.set('X-Demo', 'pounce-kit')
	interceptLog.entries = [
		...interceptLog.entries,
		`→ ${req.method} ${new URL(req.url).pathname} [X-Demo: pounce-kit]`,
	]
	const res = await next(req)
	interceptLog.entries = [...interceptLog.entries, `← ${res.status} ${new URL(req.url).pathname}`]
	return res
})

const postState = reactive({
	status: 'idle' as 'idle' | 'loading' | 'ok' | 'error',
	data: null as Post | null,
	error: '',
	postId: 1,
})

const errorState = reactive({
	status: 'idle' as 'idle' | 'loading' | 'ok' | 'error',
	error: '',
})

async function fetchPost(id: number) {
	postState.status = 'loading'
	postState.data = null
	postState.error = ''
	try {
		const data = await api(`https://jsonplaceholder.typicode.com/posts/${id}`).get<Post>()
		postState.data = data
		postState.status = 'ok'
	} catch (err) {
		postState.error =
			err instanceof ApiError
				? `ApiError ${(err as ApiError).status}: ${(err as ApiError).message}`
				: String(err)
		postState.status = 'error'
	}
}

async function fetchError() {
	errorState.status = 'loading'
	errorState.error = ''
	try {
		await api('https://jsonplaceholder.typicode.com/posts/999999').get<Post>()
		errorState.status = 'ok'
	} catch (err) {
		errorState.error =
			err instanceof ApiError
				? `ApiError ${(err as ApiError).status}: ${(err as ApiError).message}`
				: String(err)
		errorState.status = 'error'
	}
}

export default function ApiDemo() {
	effect(() => {
		fetchPost(postState.postId)
	})

	function prev() {
		if (postState.postId > 1) postState.postId = postState.postId - 1
	}
	function next() {
		if (postState.postId < 100) postState.postId = postState.postId + 1
	}

	return (
		<section class="ad-section">
			<h2>API Client</h2>
			<p style="font-size:13px;color:#94a3b8;margin:0 0 16px">
				<code style="color:#7dd3fc">api(url).get()</code> with a global interceptor injecting{' '}
				<code style="color:#7dd3fc">X-Demo: pounce-kit</code>. Data from{' '}
				<code style="color:#64748b">jsonplaceholder.typicode.com</code>.
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
					<h3>GET /posts/[id]</h3>
					<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
						<button class="ad-btn" onClick={prev}>
							◄
						</button>
						<span style="font-family:monospace;color:#f59e0b;font-size:16px;font-weight:700">
							{postState.postId}
						</span>
						<button class="ad-btn" onClick={next}>
							►
						</button>
					</div>
					<div style="font-size:12px;color:#475569">
						<span if={postState.status === 'loading'} style="color:#64748b">
							Loading…
						</span>
						<span if={postState.status === 'ok'} style="color:#4ade80">
							✓ {postState.data?.title}
						</span>
						<span if={postState.status === 'error'} style="color:#f87171">
							{postState.error}
						</span>
						<span if={postState.status === 'idle'}>idle</span>
					</div>
				</div>
				<div class={`ad-code ${postState.status}`}>
					<span if={postState.status === 'loading'}>Loading…</span>
					<span if={postState.status === 'error'}>{postState.error}</span>
					<span if={postState.status === 'ok'}>{JSON.stringify(postState.data, null, 2)}</span>
					<span if={postState.status === 'idle'}>—</span>
				</div>
			</div>

			<div class="ad-card">
				<div class="ad-content">
					<h3>ApiError</h3>
					<p style="font-size:12px;color:#64748b;margin:0 0 12px">
						Fetch a non-existent resource to trigger an error.
					</p>
					<button class="ad-btn" onClick={fetchError}>
						GET /posts/999999
					</button>
				</div>
				<div class={`ad-code ${errorState.status}`}>
					<span if={errorState.status === 'idle'} style="color:#2d3748">
						Click to trigger
					</span>
					<span if={errorState.status === 'loading'}>Loading…</span>
					<span if={errorState.status === 'error'}>{errorState.error}</span>
					<span if={errorState.status === 'ok'}>Unexpected success</span>
				</div>
			</div>
		</section>
	)
}
