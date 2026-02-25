import { latch } from '@pounce/core'
import '../dom/index'
import { componentStyle } from '../css'
import { type ClientRouteDefinition, Router, type RouterRender } from '../router/components'
import { type LinkProps, linkModel } from '../router/link-model'
import ApiDemo from './components/ApiDemo'
import ClientState from './components/ClientState'
import IntlDemo from './components/IntlDemo'
import RouterDemo from './components/RouterDemo'
import StorageDemo from './components/StorageDemo'

componentStyle.css`
	.demo-nav {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 32px;
		border-bottom: 1px solid #2d3748;
		padding-bottom: 16px;
	}
	.demo-nav a {
		padding: 6px 14px;
		border-radius: 6px;
		text-decoration: none;
		color: #94a3b8;
		font-size: 14px;
		font-weight: 500;
		transition: background 0.15s, color 0.15s;
	}
	.demo-nav a:hover { background: #1e2535; color: #e2e8f0; }
	.demo-nav a[aria-current="page"] { background: #3b82f6; color: #fff; }
	.demo-title {
		font-size: 22px;
		font-weight: 700;
		margin: 0 0 4px;
		color: #f1f5f9;
	}
	.demo-subtitle {
		font-size: 13px;
		color: #64748b;
		margin: 0 0 28px;
	}
`

function A(props: LinkProps) {
	const model = linkModel(props)
	return (
		<a href={props.href} onClick={model.onClick} aria-current={model.ariaCurrent}>
			{props.children}
		</a>
	)
}

type DemoRoute = ClientRouteDefinition & { label: string | null; view: RouterRender<DemoRoute> }

const routes: DemoRoute[] = [
	{
		path: '/',
		label: 'Client State',
		view: () => <ClientState />,
	},
	{
		path: '/router',
		label: 'Router',
		view: () => <RouterDemo />,
	},
	{
		path: '/router/[...rest]',
		label: null,
		view: () => <RouterDemo />,
	},
	{
		path: '/storage',
		label: 'Storage',
		view: () => <StorageDemo />,
	},
	{
		path: '/intl',
		label: 'Intl',
		view: () => <IntlDemo />,
	},
	{
		path: '/api',
		label: 'API Client',
		view: () => <ApiDemo />,
	},
]

const App = () => (
	<>
		<p class="demo-title">@pounce/kit Demo</p>
		<p class="demo-subtitle">Interactive showcase of all kit features</p>
		<nav class="demo-nav">
			<for each={routes.filter((r) => r.label !== null)}>
				{(route) => (
					<A href={route.path} matchPrefix={route.path === '/router'}>
						{route.label}
					</A>
				)}
			</for>
		</nav>
		<main>
			<Router routes={routes} notFound={() => <p style="color:#f87171">404 — not found</p>} />
		</main>
	</>
)

latch('#app', <App />)
