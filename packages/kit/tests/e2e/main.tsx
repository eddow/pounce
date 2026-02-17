import { latch } from '@pounce/core'
import { A, Router, type RouteWildcard } from '../../src/dom/index'
import { client } from '../../src/dom/client'

type Route = {
	readonly path: RouteWildcard
	readonly label: string
	readonly view: (spec: { params: Record<string, string> }) => JSX.Element
}

const routes: Route[] = [
	{
		path: '/users/[id]',
		label: 'User',
		view: (spec) => (
			<section data-testid="user-view">
				<h1>User Profile</h1>
				<p data-testid="user-id">ID: {spec.params.id}</p>
				<p data-testid="user-name">Name: User {spec.params.id}</p>
				<nav data-testid="user-nav">
					<A href="/users/1" data-testid="link-user-1">User 1</A>
					{' | '}
					<A href="/users/2" data-testid="link-user-2">User 2</A>
					{' | '}
					<A href="/users/42" data-testid="link-user-42">User 42</A>
				</nav>
			</section>
		),
	},
	{
		path: '/about',
		label: 'About',
		view: () => (
			<section data-testid="about-view">
				<h1>About</h1>
				<p>About page content.</p>
			</section>
		),
	},
	{
		path: '/',
		label: 'Home',
		view: () => (
			<section data-testid="home-view">
				<h1>Home</h1>
				<p>Welcome to the router e2e test.</p>
			</section>
		),
	},
]

const notFound = (ctx: { url: string }) => (
	<section data-testid="not-found-view">
		<h1>404</h1>
		<p>No route for <code>{ctx.url}</code></p>
	</section>
)

const App = () => (
	<div id="root">
		<nav data-testid="global-nav">
			<A href="/" data-testid="nav-home">Home</A>
			<A href="/about" data-testid="nav-about">About</A>
			<A href="/users/1" data-testid="nav-user-1">User 1</A>
			<A href="/users/2" data-testid="nav-user-2">User 2</A>
		</nav>
		<main data-testid="router-outlet">
			<Router routes={routes} notFound={notFound} />
		</main>
		<footer data-testid="footer">
			<span data-testid="current-path">{client.url.pathname}</span>
		</footer>
	</div>
)

latch('#app', <App />)
