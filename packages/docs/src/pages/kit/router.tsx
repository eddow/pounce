import { Section, Code, ApiTable } from '../../components'

const routeDefinition = `import { Router, A } from '@pounce/kit'
import type { ClientRouteDefinition } from '@pounce/kit'

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

const viewFunction = `// The Router calls view(spec, scope) where:
//   spec.params — extracted URL parameters
//   scope — the current reactive scope

function UserPage(spec: { params: { id: string } }) {
  return <h1>User {spec.params.id}</h1>
}

// For catch-all routes:
function DocsPage(spec: { params: { slug: string } }) {
  // /docs/getting-started/install → slug = "getting-started/install"
  return <h1>Docs: {spec.params.slug}</h1>
}`

const aComponent = `import { A } from '@pounce/kit'

// <A> is a reactive link that uses pushState navigation.
// It sets aria-current="page" on the active link.

<A href="/about">About</A>
<A href="/users/42">User 42</A>

// Equivalent to <a> but intercepts clicks for SPA navigation.
// External links (different origin) fall through to normal navigation.`

const defineRouteExample = `import { defineRoute } from '@pounce/kit'
import { type } from 'arktype'

// defineRoute() creates a typed route with buildUrl() helper.
const userRoute = defineRoute('/users/[id]')
userRoute.buildUrl({ id: '42' }) // → "/users/42"

// With query schema validation (arktype):
const searchRoute = defineRoute('/search', type({ q: 'string', page: 'number' }))
searchRoute.buildUrl({ q: 'pounce', page: 1 }) // → "/search?q=pounce&page=1"`

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

export default function RouterPage() {
  return (
    <article>
      <h1>Router</h1>
      <p>
        Client-side router with reactive URL matching, parameter extraction,
        and SPA navigation.
      </p>

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
          The router calls <code>view(spec, scope)</code> where <code>spec.params</code>
          contains the extracted URL parameters.
        </p>
        <Code code={viewFunction} lang="tsx" />
      </Section>

      <Section title="<A> Component">
        <p>
          <code>{'<A>'}</code> is a reactive link that uses <code>pushState</code> navigation
          and sets <code>aria-current="page"</code> on the active link.
        </p>
        <Code code={aComponent} lang="tsx" />
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

      <Section title="API Reference">
        <ApiTable props={[
          { name: 'routes', type: 'ClientRouteDefinition[]', description: 'Array of route definitions', required: true },
          { name: 'notFound', type: '(spec) => JSX.Element', description: 'Component rendered for unmatched URLs', required: true },
          { name: 'path', type: 'string', description: 'URL pattern with [param] and [...catchAll] segments', required: true },
          { name: 'view', type: '(spec, scope) => JSX.Element', description: 'Component to render for this route', required: true },
        ]} />
      </Section>
    </article>
  )
}
