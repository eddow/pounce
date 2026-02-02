# Extending RequestContext

The `RequestContext` interface can be extended to add custom properties that middleware adds to the context.

## Basic Usage

Create a type declaration file (e.g., `types/board.d.ts`):

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

## Example: Auth Middleware

```ts
// routes/common.ts
import type { Middleware } from '@pounce/board/server'

export const middleware: Middleware[] = [
  async (ctx, next) => {
    const token = ctx.request.headers.get('Authorization')
    
    if (token) {
      // Verify token and attach user
      ctx.user = await verifyToken(token)
    }
    
    return next()
  }
]
```

## Example: Using Extended Context in Handlers

```ts
// routes/profile/index.ts
import type { RouteHandler } from '@pounce/board/server'

export const get: RouteHandler = async (ctx) => {
  // TypeScript now knows about ctx.user!
  if (!ctx.user) {
    return { status: 401, error: 'Unauthorized' }
  }
  
  return {
    status: 200,
    data: {
      email: ctx.user.email,
      role: ctx.user.role
    }
  }
}
```

## Multiple Middleware Adding Context

```ts
// routes/common.ts
export const middleware: Middleware[] = [
  // Auth middleware
  async (ctx, next) => {
    ctx.user = await getUser(ctx.request)
    return next()
  },
  
  // Database middleware
  async (ctx, next) => {
    ctx.db = await getDbConnection()
    try {
      return await next()
    } finally {
      await ctx.db.close()
    }
  },
  
  // Session middleware
  async (ctx, next) => {
    ctx.session = await getSession(ctx.request)
    return next()
  }
]
```

## Type-Safe Context Guards

```ts
// utils/guards.ts
import type { RequestContext } from '@pounce/board/server'

export function requireAuth(ctx: RequestContext): asserts ctx is RequestContext & { user: NonNullable<RequestContext['user']> } {
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
}

// Usage in handler
export const get: RouteHandler = async (ctx) => {
  requireAuth(ctx)
  // TypeScript now knows ctx.user is defined
  return { status: 200, data: { userId: ctx.user.id } }
}
```

## Best Practices

1. **Single declaration file**: Keep all context extensions in one place (e.g., `types/board.d.ts`)
2. **Optional properties**: Use optional (`?`) for properties that might not be set by all middleware
3. **Type guards**: Create type guards for required context properties
4. **Documentation**: Document which middleware adds which context properties
