# Extending RequestContext

This guide is for the low-level server middleware APIs exported from `@pounce/board/server`, such as `runMiddlewares`, `RequestContext`, and `RouteHandler`.

It does **not** describe route-local `expose({ middle })` middleware, which uses `PounceRequest` instead of `RequestContext`.

## Basic usage

Create a declaration file such as `types/board.d.ts`:

```ts
import '@pounce/board/server'

declare module '@pounce/board/server' {
	interface RequestContext {
		user?: {
			id: string
			email: string
			role: 'admin' | 'user'
		}
		session?: {
			id: string
			expiresAt: Date
		}
		db?: DatabaseConnection
	}
}
```

## Example: low-level middleware

```ts
import type { Middleware } from '@pounce/board/server'

export const withAuth: Middleware = async (ctx, next) => {
	const token = ctx.request.headers.get('Authorization')
	if (token) {
		ctx.user = await verifyToken(token)
	}
	return next()
}
```

## Example: using extended context in a handler

```ts
import type { RouteHandler } from '@pounce/board/server'

export const getProfile: RouteHandler = async (ctx) => {
	if (!ctx.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	return Response.json({
		email: ctx.user.email,
		role: ctx.user.role,
	})
}
```

## Multiple middleware layers

```ts
import type { Middleware } from '@pounce/board/server'

export const withUser: Middleware = async (ctx, next) => {
	ctx.user = await getUser(ctx.request)
	return next()
}

export const withDb: Middleware = async (ctx, next) => {
	ctx.db = await getDbConnection()
	try {
		return await next()
	} finally {
		await ctx.db.close()
	}
}

export const withSession: Middleware = async (ctx, next) => {
	ctx.session = await getSession(ctx.request)
	return next()
}
```

## Type-safe guards

```ts
import type { RequestContext } from '@pounce/board/server'

export function requireAuth(
	ctx: RequestContext
): asserts ctx is RequestContext & { user: NonNullable<RequestContext['user']> } {
	if (!ctx.user) {
		throw new Error('Unauthorized')
	}
}
```

## Best practices

1. Keep context extensions in one declaration file
2. Use optional properties for middleware-populated fields
3. Add type guards for required fields
4. Document which middleware is responsible for each field
