# Middleware System

`@sursaut/board` uses a hierarchical middleware model defined through `expose()`. Middleware is attached to route modules, inherited across descendant route paths, and executed in ancestor-to-descendant order for API endpoint requests.

## Where middleware lives

Middleware is declared in sibling route `.ts` files, not in `common.ts` files.

```ts
import { expose } from '@sursaut/board'

export default expose({
	middle: [async (req, next) => next()],
})
```

If a route file contributes a base path such as `/users`, its `middle` array is inherited by descendant API endpoints below that path.

## Execution order

Middleware runs in ancestor-to-descendant order before the matched endpoint handler.

For a request like `GET /users/123`, the chain can look like:

1. root route middleware
2. `/users` route middleware
3. `/users/[id]` endpoint handler

Each middleware receives:

- `req`
  - a `SursautRequest` with `params`, `url`, and `raw`
- `next`
  - a function returning the downstream `Response`

## Defining middleware

```ts
import { expose } from '@sursaut/board'

async function logRequest(req: any, next: () => Promise<Response>) {
	const start = performance.now()
	const response = await next()
	response.headers.set('X-Response-Time', `${performance.now() - start}ms`)
	return response
}

export default expose({
	middle: [logRequest],
	get: async () => ({ ok: true }),
})
```

## `provide()` interaction

`provide()` is related to routing but behaves differently from API verbs:

- for normal API endpoint requests
  - board runs the middleware chain and then the matched verb handler
- for internal SPA page-prop fetches using `X-Sursaut-Provide: true`
  - board invokes the composed `provide()` chain directly
  - endpoint middleware is intentionally skipped

This separation avoids leaking endpoint-only concerns such as auth guards or API-only headers into page-prop loading.

## Common patterns

### Authentication

```ts
import { expose } from '@sursaut/board'

async function requireAuth(req: any, next: () => Promise<Response>) {
	const auth = req.raw.headers.get('Authorization')
	if (!auth) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}
	return next()
}

export default expose({
	middle: [requireAuth],
	get: async () => ({ ok: true }),
})
```

### Logging / timing

```ts
import { expose } from '@sursaut/board'

async function withTiming(_req: any, next: () => Promise<Response>) {
	const start = performance.now()
	const response = await next()
	response.headers.set('X-Response-Time', `${performance.now() - start}ms`)
	return response
}

export default expose({
	middle: [withTiming],
})
```

### Parent `provide()` composition

```ts
import { expose } from '@sursaut/board'

export default expose({
	provide: async () => ({ currentUser: { id: 'admin' } }),
	'/users': {
		provide: async (req: any) => ({ inheritedUser: req.provide?.currentUser }),
	},
})
```

## Tests as documentation

The most useful middleware references are:

- `tests/integration/route-api.spec.ts`
- `tests/e2e/demo-api.spec.ts`
