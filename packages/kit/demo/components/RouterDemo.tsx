import { reactive } from 'mutts'
import { componentStyle } from '../../src/css'
import { client } from '../../src/platform/shared'
import { type ClientRouteDefinition, Router, type RouterRender, type RouterRouteDefinition } from '../../src/router/components'
import { defineRoute } from '../../src/router/defs'
import { type LinkProps, linkModel } from '../../src/router/link-model'

const perfEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
const isPerfMode = perfEnv.VITE_PERF === 'true'

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
	const { prefetch: _prefetch, ...anchorProps } = props
	return (
		<a
			{...anchorProps}
			{...model}
		>
			{props.children}
		</a>
	)
}

const userRoute = defineRoute('/router/users/[id]')

type SubRoute = ClientRouteDefinition & { label: string }

function loadLazyRoute(): Promise<RouterRender<SubRoute>> {
	return new Promise((resolve) => {
		window.setTimeout(() => {
			resolve(() => (
				<div data-testid="lazy-view">
					<h1>Lazy</h1>
					<p style="color:#94a3b8;font-size:13px;margin:8px 0 0">
						Loaded on demand, then cached in the router.
					</p>
				</div>
			))
		}, 180)
	})
}

function loadLazyErrorRoute(): Promise<RouterRender<SubRoute>> {
	return new Promise((_, reject) => {
		window.setTimeout(() => {
			reject(new Error('Demo lazy route failed to load'))
		}, 120)
	})
}

const subRoutes: RouterRouteDefinition<SubRoute>[] = [
	{
		path: '/router',
		label: 'Home',
		view: () => (
			<div data-testid="home-view">
				<h1>Home</h1>
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
			<div data-testid="about-view">
				<h1>About</h1>
				<p style="color:#94a3b8;font-size:13px;margin:8px 0 0">Static route — no params.</p>
			</div>
		),
	},
	{
		path: '/router/users/[id]',
		label: 'User',
		view: (spec) => (
			<div data-testid="user-view">
				<h1>User Profile</h1>
				<p data-testid="user-id">ID: {spec.params.id}</p>
				<p data-testid="user-name">Name: User {spec.params.id}</p>
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
				<nav data-testid="user-nav">
					<A href="/router/users/1" data-testid="link-user-1">User 1</A>
					{' | '}
					<A href="/router/users/2" data-testid="link-user-2">User 2</A>
					{' | '}
					<A href="/router/users/42" data-testid="link-user-42">User 42</A>
				</nav>
			</div>
		),
	},
	{
		path: '/router/long',
		label: 'Long',
		view: () => (
			<div data-testid="long-view" style="height: 2000px; padding: 20px;">
				<h1>Long Page</h1>
				<p>Scroll down to find the footer link.</p>
				<div style="margin-top: 1800px;">
					<A href="/router" data-testid="link-home-bottom">Back to Home</A>
				</div>
			</div>
		),
	},
	{
		path: '/router/lazy',
		label: 'Lazy',
		lazy: loadLazyRoute,
	},
	{
		path: '/router/lazy-pending',
		label: 'Lazy Pending',
		lazy: loadLazyRoute,
		loading: () => (
			<div data-testid="route-loading-view" style="color:#fbbf24">
				Custom route loading…
			</div>
		),
	},
	{
		path: '/router/lazy-error',
		label: 'Lazy Error',
		lazy: loadLazyErrorRoute,
		error: ({ error }) => (
			<div data-testid="route-error-view" style="color:#f87171">
				<h1>Lazy route error</h1>
				<p>{error instanceof Error ? error.message : String(error)}</p>
			</div>
		),
	},
]

const state = reactive({ customId: '42' })

const navState = reactive({ entries: [] as string[] })

function recordNavigation(entry: string) {
	navState.entries = [entry, ...navState.entries].slice(0, 8)
}

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
				<A href="/router" data-testid="nav-home">Home</A>
				<A href="/router/about" data-testid="nav-about">About</A>
				<A href="/router/users/1" data-testid="nav-user-1">User 1</A>
				<A href="/router/users/2" data-testid="nav-user-2">User 2</A>
				<A href="/router/users/abc">User abc</A>
				<A href="/router/long" data-testid="nav-long">Long</A>
				<A href="/router/lazy" data-testid="nav-lazy">Lazy</A>
				<A href="/router/lazy" prefetch="hover" data-testid="nav-lazy-prefetch">Lazy prefetch</A>
				<A href="/router/lazy" prefetch="intent" data-testid="nav-lazy-intent">Lazy intent</A>
				<A href="/router/lazy" prefetch="visible" data-testid="nav-lazy-visible">Lazy visible</A>
				<A href="/router/lazy-pending" data-testid="nav-lazy-pending">Lazy pending</A>
				<A href="/router/lazy-error" data-testid="nav-lazy-error">Lazy error</A>
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
			<div class="rd-code" data-testid="nav-event-log" style="margin:0 0 12px; color:#a3e635; min-height:44px">
				<for each={navState.entries}>{(entry) => <div data-testid="nav-event">{entry}</div>}</for>
				<div if={navState.entries.length === 0} style="color:#475569">No navigation events yet</div>
			</div>
			<div class="rd-outlet">
				<Router
					routes={subRoutes}
					onRouteStart={
						isPerfMode
							? undefined
							: ({ from, navigation, route, to }) =>
								recordNavigation(`start ${navigation} ${from ?? '(none)'} -> ${to} ${route?.path ?? '(none)'}`)
					}
					onRouteEnd={
						isPerfMode
							? undefined
							: ({ navigation, route, status, to }) =>
								recordNavigation(`end ${status} ${navigation} ${to} ${route?.path ?? '(none)'}`)
					}
					onRouteError={
						isPerfMode
							? undefined
							: ({ error, navigation, route, to }) =>
								recordNavigation(
									`error ${navigation} ${to} ${route?.path ?? '(none)'} ${error instanceof Error ? error.message : String(error)}`
								)
					}
					loading={({ route }) => (
						<div data-testid="router-loading-view" style="color:#93c5fd">
							Router loading {route.path}…
						</div>
					)}
					notFound={(ctx) => (
						<div data-testid="not-found-view" style="color:#f87171">
							<h1>404</h1>
							No route for <code>{ctx.url}</code>
						</div>
					)}
				/>
			</div>
			<div class="rd-code" style="margin-top:12px">
				{'client.url.pathname = '}
				<span class="rd-param" data-testid="current-path">{client.url.pathname}</span>
			</div>
		</section>
	)
}
