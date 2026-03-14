import { ApiTable, Code, Section } from '../../components'

const routeDefinition = `import { Router, A, type ClientRouteDefinition } from '@sursaut'

const routes: ClientRouteDefinition[] = [
  { path: '/', view: HomePage },
  { path: '/about', view: AboutPage },
  { path: '/users/[id]', view: UserPage },
  { path: '/docs/[...slug]', view: DocsPage },  // catch-all
]

function App() {
  return (
    <>
      <nav>
        <A href="/">Home</A>
        <A href="/about">About</A>
        <A href="/users/42">User 42</A>
      </nav>
      <Router routes={routes} notFound={NotFoundPage} />
    </>
  )
}`

const viewFunction = `// The Router calls view(spec, env) where:
//   spec.params — extracted URL parameters
//   env — the current reactive env

function UserPage(spec: { params: { id: string } }) {
  return <h1>User {spec.params.id}</h1>
}

// For catch-all routes:
function DocsPage(spec: { params: { slug: string } }) {
  // /docs/getting-started/install → slug = "getting-started/install"
  return <h1>Docs: {spec.params.slug}</h1>
}`

const aComponent = `import { A } from '@sursaut'

// <A> is a reactive link that uses pushState navigation.
// It sets aria-current="page" on the active link.

<A href="/about">About</A>
<A href="/users/42">User 42</A>

// Equivalent to <a> but intercepts clicks for SPA navigation.
// External links (different origin) fall through to normal navigation.`

const defineRouteExample = `import { defineRoute } from '@sursaut'
import { type } from 'arktype'

// defineRoute() creates a typed route with buildUrl() helper.
const userRoute = defineRoute('/users/[id]')
userRoute.buildUrl({ id: '42' }) // → "/users/42"

// With query schema validation (arktype):
const searchRoute = defineRoute('/search', type({ q: 'string', page: 'number' }))
searchRoute.buildUrl({ q: 'sursaut', page: 1 }) // → "/search?q=sursaut&page=1"`

const notFound = `// notFound receives the unmatched URL
function NotFoundPage({ url }: { url: string }) {
  return (
    <article>
      <h1>404</h1>
      <p>Page not found: {url}</p>
    </article>
  )
}

<Router routes={routes} notFound={NotFoundPage} />`

const routingLayers = `Reactive URL and route matching span a few layers:

@sursaut/kit
  owns route parsing/matching, link behavior, and the SPA Router component

@sursaut/ui
  can compose kit routing primitives into alternate shells such as tabbed navigation

@sursaut/board
  adds file-based route discovery and SSR on top of the same route concepts`

const routerFlow = `Normal SPA flow:

client.url change
  -> Router observes the pathname reactively
  -> route matcher resolves the route definition
  -> Router renders the active view(spec, env)

The Router is the URL-driven component.
It stays responsible for synchronization with client.url.`

const modelSplit = `Think in two responsibilities:

1. Route logic
   parseRoute(), matchRoute(), buildRoute(), defineRoute()
   Pure matching and URL construction.

2. Navigation model
   Opened routes, active route, activate/close/clear/open semantics.
   Headless state that can drive different shells.

In the default docs surface today, the built-in Router exposes the SPA shell.
The same concepts also support richer shells that keep multiple routes alive.`

const dockviewComposition = `One important cross-package pattern is tabbed routing:

@sursaut/kit
  route matching + navigation state

@sursaut/ui
  dockview/tab container primitive

consumer app
  decides whether navigation swaps one page or accumulates open panels

That lets links keep meaning "navigate to this route"
while the presentation shell decides whether that means
replace the visible page or focus/open a tab.`

export default function RouterPage() {
	return (
		<article>
			<h1>Router</h1>
			<p>
				Client-side router with reactive URL matching, parameter extraction, and SPA navigation.
			</p>

			<Section title="Cross-Package Routing Concept">
				<p>
					Routing in Sursaut is not a single monolith. It is a concept that spans the suite: route
					matching lives in Kit, UI packages can compose alternate navigation shells on top of it,
					and Board adds file-based routing and SSR conventions.
				</p>
				<Code code={routingLayers} lang="text" />
			</Section>

			<Section title="URL-Driven SPA Router">
				<p>
					The built-in <code>Router</code> is the SPA shell. It reacts to <code>client.url</code>,
					matches the active route, and renders a single active view. This keeps URL tracking and
					rendering concerns together in Kit.
				</p>
				<Code code={routerFlow} lang="text" />
			</Section>

			<Section title="Route Logic vs Navigation Model">
				<p>
					A useful mental split is <strong>route logic</strong> versus{' '}
					<strong>navigation model</strong>. Route logic answers <em>what matches this URL?</em>{' '}
					Navigation state answers <em>what is open and which route is active right now?</em>
				</p>
				<Code code={modelSplit} lang="text" />
			</Section>

			<Section title="Route Definitions">
				<p>
					Routes are a flat array of objects with <code>path</code> and <code>view</code>.
					Parameters use bracket syntax: <code>[id]</code> for single segments,
					<code>[...slug]</code> for catch-all.
				</p>
				<Code code={routeDefinition} lang="tsx" />
			</Section>

			<Section title="View Functions">
				<p>
					The router calls <code>view(spec, env)</code> where <code>spec.params</code>
					contains the extracted URL parameters.
				</p>
				<Code code={viewFunction} lang="tsx" />
			</Section>

			<Section title="<A> Component">
				<p>
					<code>{'<A>'}</code> is a reactive link that uses <code>pushState</code> navigation and
					sets <code>aria-current="page"</code> on the active link.
				</p>
				<Code code={aComponent} lang="tsx" />
				<p>
					This is another cross-package seam: links express navigation intent, while the active
					shell decides how to realize it. In the default SPA shell, that means swapping the active
					route. In richer shells, the same navigation can open or focus a panel instead.
				</p>
			</Section>

			<Section title="defineRoute()">
				<p>
					<code>defineRoute()</code> creates a typed route definition with a <code>buildUrl()</code>
					helper. Supports query schema validation with arktype.
				</p>
				<Code code={defineRouteExample} lang="tsx" />
			</Section>

			<Section title="404 Handling">
				<Code code={notFound} lang="tsx" />
			</Section>

			<Section title="Tabbed Navigation as Composition">
				<p>
					Kit owns the route semantics, but it does not force a single presentation. A tabbed router
					is a composition pattern: Kit provides route matching and navigation primitives, UI
					provides the tab container, and the consuming app decides whether routes should replace
					each other or stay alive side by side.
				</p>
				<Code code={dockviewComposition} lang="text" />
			</Section>

			<Section title="API Reference">
				<ApiTable
					props={[
						{
							name: 'routes',
							type: 'ClientRouteDefinition[]',
							description: 'Array of route definitions',
							required: true,
						},
						{
							name: 'notFound',
							type: '(spec) => JSX.Element',
							description: 'Component rendered for unmatched URLs',
							required: true,
						},
						{
							name: 'path',
							type: 'string',
							description: 'URL pattern with [param] and [...catchAll] segments',
							required: true,
						},
						{
							name: 'view',
							type: '(spec, env) => JSX.Element',
							description: 'Component to render for this route',
							required: true,
						},
					]}
				/>
			</Section>
		</article>
	)
}
