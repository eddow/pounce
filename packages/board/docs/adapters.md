# Server Adapters

`@sursaut/board` is currently centered around a Hono adapter for serving both API and UI routes from the same route tree.

## Hono adapter

Import adapter helpers from `@sursaut/board/server`:

```ts
import { createSursautApp, createSursautMiddleware } from '@sursaut/board/server'
```

## `createSursautApp`

The simplest setup is to create a ready-to-use Hono app:

```ts
import { createSursautApp } from '@sursaut/board/server'

const app = createSursautApp({
	routesDir: './routes',
})

export default app
```

## `createSursautMiddleware`

If you already have a Hono app, attach board middleware manually:

```ts
import { Hono } from 'hono'
import { createSursautMiddleware } from '@sursaut/board/server'

const app = new Hono()

app.use('*', async (c, next) => {
	console.log(`[${c.req.method}] ${c.req.url}`)
	await next()
})

app.use(
	'*',
	createSursautMiddleware({
		routesDir: './routes',
	})
)

app.get('/health', (c) => c.json({ ok: true }))

export default app
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `routesDir` | `string` | `'./routes'` | Routes directory relative to the current working directory. |
| `importFn` | `(path: string) => Promise<any>` | built-in import | Custom module loader, mainly useful in dev with Vite SSR. |
| `globRoutes` | `Record<string, () => Promise<any>>` | none | Precomputed route modules for environments without filesystem scanning. |

## What the middleware does

On each request, the middleware:

1. creates an SSR request context
2. lazily builds and caches the UI route tree for the configured `routesDir`
3. executes sibling route `.ts` modules so `expose()` can populate the API registry
4. matches API requests first when the request is not an HTML navigation, or when it is an internal `provide()` fetch
5. enables SSR and falls through to downstream HTML handlers for UI requests
6. injects collected hydration payloads into HTML responses before returning them

## API vs UI behavior

- API requests
  - resolved from the `expose()` registry
  - endpoint middleware runs for verb handlers
- UI requests
  - board enables SSR and lets downstream HTML rendering run inside the active SSR context
- internal page-prop fetches
  - detected via `X-Sursaut-Provide: true`
  - resolved through the composed `provide()` chain

## Cache invalidation in development

If you are wiring your own dev server, use `clearRouteTreeCache()` when route files change so board rebuilds route discovery and the expose registry.
