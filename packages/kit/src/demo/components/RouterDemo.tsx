import { reactive } from 'mutts'
import { componentStyle } from '../../css'
import { client } from '../../platform/shared'
import { type ClientRouteDefinition, Router, type RouterRender } from '../../router/components'
import { defineRoute } from '../../router/defs'
import { type LinkProps, linkModel } from '../../router/link-model'

componentStyle.css`
	.rd-section { margin-bottom: 32px; }
	.rd-section h2 { font-size: 16px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
	.rd-nav {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}
	.rd-nav a {
		padding: 5px 12px;
		border-radius: 5px;
		text-decoration: none;
		color: #94a3b8;
		font-size: 13px;
		border: 1px solid #2d3748;
	}
	.rd-nav a:hover { border-color: #3b82f6; color: #93c5fd; }
	.rd-nav a[aria-current="page"] { background: #1e3a5f; border-color: #3b82f6; color: #7dd3fc; }
	.rd-outlet {
		background: #1a2035;
		border-radius: 8px;
		padding: 20px;
		min-height: 80px;
		font-size: 14px;
	}
	.rd-code {
		background: #0d1117;
		border-radius: 6px;
		padding: 12px 16px;
		font-family: monospace;
		font-size: 12px;
		color: #7dd3fc;
		margin-top: 16px;
		white-space: pre;
	}
	.rd-param { color: #f59e0b; }
	.rd-url { color: #a78bfa; margin-top: 8px; font-size: 12px; font-family: monospace; }
`

function A(props: LinkProps) {
	const model = linkModel(props)
	return (
		<a href={props.href} onClick={model.onClick} aria-current={model.ariaCurrent}>
			{props.children}
		</a>
	)
}

const userRoute = defineRoute('/router/users/[id]')

type SubRoute = ClientRouteDefinition & { label: string; view: RouterRender<SubRoute> }

const subRoutes: SubRoute[] = [
	{
		path: '/router',
		label: 'Home',
		view: () => (
			<div>
				<strong>Router home</strong>
				<p style="color:#94a3b8;font-size:13px;margin:8px 0 0">
					Navigate to a user to see typed params.
				</p>
			</div>
		),
	},
	{
		path: '/router/about',
		label: 'About',
		view: () => (
			<div>
				<strong>About</strong>
				<p style="color:#94a3b8;font-size:13px;margin:8px 0 0">Static route — no params.</p>
			</div>
		),
	},
	{
		path: '/router/users/[id]',
		label: 'User',
		view: (spec) => (
			<div>
				<strong>User Profile</strong>
				<p style="margin:8px 0 4px;font-size:13px;color:#94a3b8">
					Typed param via <code style="color:#f59e0b">defineRoute('/router/users/[id]')</code>:
				</p>
				<div class="rd-code">
					params.id = <span class="rd-param">{spec.params.id}</span>
				</div>
				<p class="rd-url">
					buildUrl({'{'} id: '{spec.params.id}' {'}'}) →{' '}
					{userRoute.buildUrl({ id: spec.params.id })}
				</p>
			</div>
		),
	},
]

const state = reactive({ customId: '42' })

export default function RouterDemo() {
	return (
		<section class="rd-section">
			<h2>Router</h2>
			<p style="font-size:13px;color:#94a3b8;margin:0 0 16px">
				<code style="color:#7dd3fc">&lt;Router&gt;</code> matches{' '}
				<code style="color:#7dd3fc">client.url.pathname</code> reactively.{' '}
				<code style="color:#7dd3fc">&lt;A&gt;</code> uses{' '}
				<code style="color:#7dd3fc">linkModel</code> for SPA navigation +{' '}
				<code style="color:#7dd3fc">aria-current</code>.
			</p>
			<nav class="rd-nav">
				<A href="/router">Home</A>
				<A href="/router/about">About</A>
				<A href="/router/users/1">User 1</A>
				<A href="/router/users/abc">User abc</A>
				<A href="/router/nowhere">404</A>
			</nav>
			<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;font-size:13px">
				<span style="color:#64748b">Custom ID:</span>
				<input
					type="text"
					value={state.customId}
					style="background:#0d1117;border:1px solid #2d3748;border-radius:4px;color:#e2e8f0;padding:4px 8px;font-size:12px;width:80px"
				/>
				<A href={`/router/users/${state.customId}`}>Go</A>
			</div>
			<div class="rd-outlet">
				<Router
					routes={subRoutes}
					notFound={(ctx) => (
						<div style="color:#f87171">
							No route for <code>{ctx.url}</code>
						</div>
					)}
				/>
			</div>
			<div class="rd-code" style="margin-top:12px">
				{'client.url.pathname = '}
				<span class="rd-param">{client.url.pathname}</span>
			</div>
		</section>
	)
}
