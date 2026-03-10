# API Client

Kit provides a universal HTTP client with **interceptors**, **shared context hooks**, **middleware**, **streaming**, and **automatic retry**. The exported singleton starts with standard `fetch` forwarding behavior, and server/framework integrations patch behavior through the shared hooks.

## Quick Start

```typescript
import { api } from '@pounce/kit'

// Simple GET
const users = await api('/api/users').get<User[]>()

// POST with body
const created = await api('/api/users').post<User>({ name: 'Alice' })

// With path params (type-inferred from URL)
const user = await api('/api/users/[id]').get<User>({ id: '42' })

// With callable endpoints (recommended)
import { defineRoute } from '@pounce/kit'
const users = {
  byId: defineRoute('/api/users/[id]'),
  list: defineRoute('/api/users'),
}
const user = await users.byId({ id: '42' }).get<User>()
const all = await users.list().get<User[]>()

// Warm a GET before it is needed
await api('/api/users/[id]').prefetch<User>({ id: '42' })
```

## `ApiClientInstance`

```typescript
interface ApiClientInstance<P extends string> {
  get<T>(params?: ExtractPathParams<P>): Promise<T>
  prefetch<T>(params?: ExtractPathParams<P>, options?: { ttl?: number; signal?: AbortSignal }): Promise<T>
  post<T>(body: unknown): Promise<T>
  put<T>(body: unknown): Promise<T>
  del<T>(params?: ExtractPathParams<P>): Promise<T>
  patch<T>(body: unknown): Promise<T>
  stream<T>(onMessage: (data: T) => void, onError?: (err: Error) => void): () => void
}
```

`ExtractPathParams` is a type-level utility that extracts `{ id: string }` from `"/users/[id]"`.

`prefetch()` performs a GET early and stores the resolved value in a short-lived in-memory cache. A later `get()` for the same URL reuses the prefetched value while it is still fresh. The default TTL is 5 seconds and can be overridden per call.

## Context Hooks

The shared API context layer exposes hook slots for framework integrations:

```typescript
import {
  setRequestHook,
  setResponseHook,
  setPromiseHook,
  setStreamGuardHook,
} from '@pounce/kit'

setRequestHook((method, url) => {
  // short-circuit GETs from a cache, if desired
})

setResponseHook((method, url, data) => {
  // collect successful responses
})
```

## Streaming (SSE)

The `api()` client provides a `.stream()` method to consume Server-Sent Events natively using the `fetch` API. It supports the same URL resolution and runs through the same interceptors as standard requests.

```typescript
const unsubscribe = api('/api/events').stream<string>(
  (data) => console.log('Received:', data),
  (err) => console.error('Stream error:', err)
)

// Later: close the stream
// unsubscribe()
```

*Note: Streaming has no effect and is a no-op during SSR.*

## Interceptors

Register middleware that runs on every request matching a pattern.

```typescript
import { intercept } from '@pounce/kit'

// Global interceptor — adds auth header
const unsubscribe = intercept('**', async (request, next) => {
  const authedRequest = new Request(request, {
    headers: { ...Object.fromEntries(request.headers), Authorization: `Bearer ${token}` },
  })
  return next(authedRequest)
})

// Pattern matching
intercept('/api/**', handler)        // All /api/ routes
intercept('/api/users', handler)     // Exact path
intercept(/^\/api\/v\d+/, handler)   // Regex
```

Interceptors are scoped: global ones persist, context-scoped ones (registered inside `runWithContext`) are isolated per request.

## Configuration

```typescript
import { config } from '@pounce/kit'

config.timeout = 10000  // Request timeout (ms)
config.retries = 3      // Retry count for 5xx/408 errors
config.retryDelay = 100 // Delay between retries (ms)
```

## Server-Side Middleware

For `@pounce/board` API routes, kit provides a middleware runner:

```typescript
import { runMiddlewares, type Middleware, type RouteHandler } from '@pounce/kit'

const authMiddleware: Middleware = async (ctx, next) => {
  const token = ctx.request.headers.get('Authorization')
  if (!token) return new Response('Unauthorized', { status: 401 })
  ctx.user = await verifyToken(token)
  return next()
}

const handler: RouteHandler = async (ctx) => ({
  status: 200,
  data: { user: ctx.user },
})

const response = await runMiddlewares([authMiddleware], context, handler)
// Response includes Server-Timing header automatically
```

## Helpers

```typescript
import { createJsonResponse, createErrorResponse, addSecurityHeaders, compressResponse } from '@pounce/kit'

createJsonResponse({ ok: true })                    // 200 JSON
createErrorResponse('Not found', 404)               // 404 JSON error
addSecurityHeaders(response)                         // X-Content-Type-Options, CSP, HSTS, etc.
await compressResponse(response, 'gzip')             // CompressionStream
```

## `PounceResponse`

Extended `Response` that caches the body for multiple reads (useful in interceptor chains):

```typescript
const res = PounceResponse.from(fetchResponse)
const json1 = await res.json()  // Reads and caches
const json2 = await res.json()  // Returns cached — no error
res.setData(transformed)        // Override cached data (for interceptor transforms)
```

## `ApiError`

```typescript
class ApiError extends Error {
  status: number
  statusText: string
  data: any       // Parsed error body (if JSON)
  url: string
}
```

Thrown on non-2xx responses. Retries are attempted for `status >= 500` or `status === 408`.
