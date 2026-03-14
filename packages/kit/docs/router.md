# Router

Kit provides a two-layer routing system: a **pure logic layer** for parsing/matching/building routes, and a **component layer** for reactive client-side routing.

## Route Syntax

```
/users/[id]                    # Required string param
/users/[id:uuid]               # Required UUID param
/users/[id:integer]            # Required integer param
/posts/[...slug]               # Catch-all (remaining path)
/search?q=[query]&page=[p:integer?]  # Query params (optional with ?)
```

### Supported Formats

| Format | Matches |
|--------|---------|
| `string` (default) | Any non-empty string |
| `integer` / `int` | `-?\d+` |
| `number` / `float` | Any finite number |
| `uuid` | Standard UUID v1-5 |
| `RegExp` | Custom regex (programmatic only) |

## Pure Logic (`router/logic.ts`)

### `parseRoute(pattern)`

Parses a route pattern into structured form.

```typescript
const parsed = parseRoute('/users/[id:uuid]/posts?page=[page:integer?]')
// parsed.path = [{ kind: 'literal', value: 'users' }, { kind: 'param', name: 'id', format: 'uuid' }, ...]
// parsed.query = [{ key: 'page', name: 'page', format: 'integer', optional: true }]
```

### `matchRoute(url, definitions)`

Match a URL against a list of route definitions. Returns the first match with extracted params.

```typescript
const match = matchRoute('/users/123', [
  { path: '/users/[id]' },
  { path: '/posts/[...slug]' },
])
// match?.definition.path === '/users/[id]'
// match?.params === { id: '123' }
// match?.unusedPath === ''
```

### `routeMatcher(routes)`

Pre-compiles routes for efficient repeated matching.

```typescript
const matcher = routeMatcher(routes)
const match = matcher('/users/123')  // Faster for repeated calls
```

### `buildRoute(pattern, params)`

Build a URL from a pattern and parameters.

```typescript
buildRoute('/users/[id]', { id: '42' })
// → '/users/42'

buildRoute('/search?q=[query]', { query: 'hello world' })
// → '/search?q=hello%20world'
```

## Typed Routes (`router/defs.ts`)

### `defineRoute(path, querySchema?)`

Creates a typed route definition with `buildUrl()`. Supports arktype schemas for query validation.

```typescript
import { defineRoute } from '@sursaut/kit'
import { type } from 'arktype'

const userRoute = defineRoute('/users/[id]')
userRoute.buildUrl({ id: '42' }) // → '/users/42'

const searchRoute = defineRoute('/search', type({ q: 'string', page: 'number' }))
searchRoute.buildUrl({ q: 'hello', page: 1 }) // → '/search?q=hello&page=1'
```

## Components (`router/components.tsx`)

### `<Router>`

Reactive router component. Matches the current reactive URL (`pathname + search + hash`) against route definitions and renders the matching view.

```tsx
import { Router } from '@sursaut/kit'

const routes = [
  { path: '/', view: (spec, scope) => <Home /> },
  { path: '/users/[id]', view: (spec, scope) => <User id={spec.params.id} /> },
  { path: '/docs/[...slug]', view: (spec, scope) => <Docs slug={spec.params.slug} /> },
]

<Router
  routes={routes}
  notFound={({ url }) => <h1>404: {url} not found</h1>}
/>
```

Each route's `view` receives a `RouteSpecification` with `definition`, `params`, and `unusedPath`.

`<Router>` also supports navigation analytics callbacks:

```tsx
<Router
	routes={routes}
	notFound={({ url }) => <h1>404: {url} not found</h1>}
	onRouteStart={({ from, to, navigation, route }) => {
		console.log('route:start', { from, to, navigation, path: route?.path })
	}}
	onRouteEnd={({ status, to, navigation, route }) => {
		console.log('route:end', { status, to, navigation, path: route?.path })
	}}
	onRouteError={({ error, to, navigation, route }) => {
		console.error('route:error', { error, to, navigation, path: route?.path })
	}}
/>
```

Navigation hook notes:

- `onRouteStart` fires when the router begins processing a new `client.url`
- `onRouteEnd` reports `status: 'match' | 'not-found'`
- `onRouteError` reports render failures and lazy route load failures
- lazy routes report `onRouteEnd` when the route transition itself is committed; a later lazy-loader failure is surfaced separately through `onRouteError`

Routes may also be lazy:

```tsx
import { Router } from '@sursaut/kit'

const routes = [
  { path: '/', view: () => <Home /> },
  {
    path: '/reports',
    lazy: () => import('./routes/reports').then((mod) => mod.default),
  },
]

<Router
  routes={routes}
  loading={({ route }) => <p>Loading {route.path}…</p>}
  notFound={({ url }) => <h1>404: {url} not found</h1>}
/>
```

Lazy routes may provide route-specific pending and error renderers:

```tsx
const routes = [
  {
    path: '/reports',
    lazy: () => import('./routes/reports').then((mod) => mod.default),
    loading: ({ route }) => <p>Preparing {route.path}…</p>,
    error: ({ error }) => <p>Failed to load reports: {String(error)}</p>,
  },
]
```

Lazy route loaders may resolve to:

- a render function directly
- a module with `default`
- a module with `view`

Router lazy-loading notes:

- the router caches resolved lazy route modules in memory by route path
- revisiting a resolved lazy route reuses the cached view instead of showing the loading UI again
- a lazy route's own `loading` renderer wins over the router-level `loading` fallback
- a lazy route's own `error` renderer wins over the router's built-in error panel
- if `loading` is omitted, the router renders a built-in loading state with `data-testid="router-loading-view"`
- lazy route load failures render the router's built-in error panel

### `linkModel()`

Kit does not currently export a concrete `<A>` component. The headless navigation helper is `linkModel()` from `@sursaut/kit/models`.

```tsx
import { linkModel } from '@sursaut/kit/models'

const model = linkModel({ href: '/dashboard' })

<a href="/dashboard" onClick={model.onClick} aria-current={model.ariaCurrent}>
	Dashboard
</a>
```

`linkModel()`:
- intercepts clicks on internal hrefs starting with `/`
- calls `client.navigate()` for SPA navigation
- computes `aria-current="page"`
- supports `matchPrefix` and underline styling control

It also supports lazy route module prefetch:

```tsx
const model = linkModel({ href: '/reports', prefetch: 'hover' })

<a
	href="/reports"
	{...model}
>
	Reports
</a>
```

Prefetch notes:

- `prefetch: 'hover'` warms lazy route modules on mouse hover or focus
- `prefetch: 'intent'` warms lazy route modules on focus or press-start (`mousedown`)
- `prefetch: 'visible'` warms lazy route modules when the link enters the viewport
- `prefetch: true` currently behaves like eager hover/focus warming
- spread `...model` onto the rendered anchor so the mount and event handlers are preserved
- this only prefetches the lazy route module, not route data loaded inside the route view
