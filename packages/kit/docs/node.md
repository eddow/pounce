# SSR & Node

Node-specific utilities exported from `@pounce/kit/node`.

The current node entry exposes three things:
- ALS-backed request context helpers
- file-based routing helpers under `serverRouter`
- a reactive in-memory `stored()` stub

It does **not** currently export a separate node-specific API client or SSR rendering helpers.

## Head Management in SSR

`<Head>` and `useHead()` are shared kit APIs, but their SSR behavior depends on the active adapter.

- in plain kit node usage, they require a configured `mountHead()` delegate
- `@pounce/board` installs that delegate for you and collects head HTML during SSR
- the collected head HTML is injected into the final document `<head>` before the response is returned

## Request Context

`src/node/context.ts` installs an `AsyncLocalStorage`-backed context reader for the shared API/context layer.

Available helpers:
- `createScope()` from the shared API context surface
- `runWithContext()` from `@pounce/kit/node`
- `getContext()` from the shared API context surface

```typescript
import { createScope, getContext } from '@pounce/kit'
import { runWithContext } from '@pounce/kit/node'

const scope = createScope({ timeout: 5000, retries: 1 })
scope.origin = 'http://localhost:3000'

await runWithContext(scope, async () => {
  const current = getContext()
  // API calls here see this request-scoped config/interceptor set
})
```

## File-Based Routing

`serverRouter` re-exports the helpers from `src/node/router.ts`.

```typescript
import { serverRouter } from '@pounce/kit/node'

const tree = await serverRouter.buildRouteTree('./src/routes')
const match = serverRouter.matchFileRoute('/users/123', tree, 'GET')
```

Useful outputs from `matchFileRoute()`:
- `handler`
- `component`
- `middlewareStack`
- `layouts`
- `params`
- `path`

### File conventions

| File | Purpose |
|------|---------|
| `index.ts` | API handlers — exports `get`, `post`, `put`, `del`, `patch` |
| `index.tsx` | Page component — `default` export |
| `common.ts` | Middleware — `middleware` export (inherited by children) |
| `common.tsx` | Layout — `default` export (wraps children) |
| `[id].ts` | Dynamic segment handler |
| `[...slug].tsx` | Catch-all page |
| `(group)/` | Route group (transparent in URL) |

### Match priority

1. Static segments
2. Dynamic segments
3. Route groups
4. Catch-all

## `stored()` in Node

The node entry exports a simple reactive in-memory storage stub:

```typescript
import { stored } from '@pounce/kit/node'

const state = stored({ theme: 'dark' })
state.theme = 'light'
```

This does not persist to disk or localStorage. It exists so shared code can depend on `stored()` shape in node contexts without browser APIs.
