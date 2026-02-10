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
import { defineRoute } from '@pounce/kit'
import { type } from 'arktype'

const userRoute = defineRoute('/users/[id]')
userRoute.buildUrl({ id: '42' }) // → '/users/42'

const searchRoute = defineRoute('/search', type({ q: 'string', page: 'number' }))
searchRoute.buildUrl({ q: 'hello', page: 1 }) // → '/search?q=hello&page=1'
```

## Components (`router/components.tsx`)

### `<Router>`

Reactive router component. Matches `client.url.pathname` against route definitions and renders the matching view.

```tsx
import { Router } from '@pounce/kit'

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

### `<A>`

Client-side navigation link. Intercepts clicks on internal hrefs (starting with `/`) and uses `client.navigate()` instead of full page reload. Automatically sets `aria-current="page"` when the href matches the current pathname.

```tsx
import { A } from '@pounce/kit'

<A href="/dashboard">Dashboard</A>
<A href="https://external.com">External</A>  // Normal navigation
```
