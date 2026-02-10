# SSR & Node

Server-side utilities exported from `@pounce/kit/node`.

## Client Isolation

Each SSR request needs its own `client` instance. Kit uses `AsyncLocalStorage` to provide thread-safe isolation.

### `runWithClient(fn, options?)`

```typescript
import { runWithClient } from '@pounce/kit/node'

runWithClient((client) => {
  // client.url.pathname === '/page'
  // This client is isolated to this execution context
  renderApp()
}, { url: 'http://example.com/page' })
```

### `createClientInstance(url?)`

Creates a standalone reactive client with SSR defaults:
- Viewport: 1920×1080
- Language: `'en-US'`, Timezone: `'UTC'`, Direction: `'ltr'`
- `navigate()`, `replace()`, `reload()` throw in SSR

### `createClientProxy()`

Returns an `AsyncLocalStorage`-backed `Proxy` that resolves to the current request's client. This is what `@pounce/kit/node` binds as the `client` singleton.

## SSR Rendering

### `withSSR(fn, options?)`

Composes `@pounce/core`'s JSDOM isolation with kit's client isolation:

```typescript
import { withSSR } from '@pounce/kit/node'

const html = await withSSR(async () => {
  return renderToString(<App />)
}, { url: req.url })
```

### `withSSRContext(fn, origin?)`

Creates a `RequestScope` for API data collection during SSR:

```typescript
import { withSSRContext, getCollectedSSRResponses, injectApiResponses } from '@pounce/kit/node'

const { result, context } = await withSSRContext(async () => {
  return renderApp()
}, 'http://localhost:3000')

const responses = getCollectedSSRResponses()
const finalHtml = injectApiResponses(result, responses)
// Injects <script type="application/json" id="pounce-data-...">...</script> tags
```

## Server API Dispatch

The Node API client dispatches local requests directly to the route registry (no HTTP roundtrip), and falls back to `fetch()` for external URLs.

```typescript
import { api, setRouteRegistry } from '@pounce/kit/node'

// Register your route handlers
setRouteRegistry(myRegistry)

// Local request → dispatched to handler
const data = await api('/api/users').get<User[]>()

// External request → uses fetch()
const external = await api('https://api.example.com/data').get()
```

## File-Based Routing

`node/router.ts` provides filesystem-based route discovery for `@pounce/board`.

### `buildRouteTree(routesDir, importFn?, globRoutes?)`

Scans a directory (or `import.meta.glob()` results) and builds a route tree.

```typescript
import { buildRouteTree, matchFileRoute } from '@pounce/kit/node'

// From filesystem (Node.js)
const tree = await buildRouteTree('./src/routes')

// From Vite glob imports (build-time)
const tree = await buildRouteTree('src/routes', undefined,
  import.meta.glob('/src/routes/**/*.{ts,tsx}')
)

const match = matchFileRoute('/users/123', tree, 'GET')
// match.handler — RouteHandler
// match.component — Page component
// match.middlewareStack — Middleware[] (inherited from ancestors)
// match.layouts — Layout[] (inherited from ancestors)
// match.params — { id: '123' }
```

### File Conventions

| File | Purpose |
|------|---------|
| `index.ts` | API handlers — exports `get`, `post`, `put`, `del`, `patch` |
| `index.tsx` | Page component — `default` export |
| `common.ts` | Middleware — `middleware` export (inherited by children) |
| `common.tsx` | Layout — `default` export (wraps children) |
| `[id].ts` | Dynamic segment handler |
| `[...slug].tsx` | Catch-all page |
| `(group)/` | Route group (transparent in URL) |

### Match Priority

1. Static segments (exact match)
2. Dynamic segments (`[id]`)
3. Route groups (`(group)`)
4. Catch-all (`[...slug]`)

## Request Context

```typescript
import { createScope, runWithContext, getContext, flushSSRPromises } from '@pounce/kit/node'

const scope = createScope({ ssr: true, timeout: 5000 })
scope.origin = 'http://localhost:3000'

await runWithContext(scope, async () => {
  // getContext() returns this scope
  // API calls within this context use scope's config
  // SSR promises are tracked automatically
  
  const promises = flushSSRPromises()
  await Promise.all(promises)
})
```
