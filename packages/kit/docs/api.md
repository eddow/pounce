# API Client

Kit provides a universal HTTP client with **interceptors**, **SSR hydration**, **middleware**, and **automatic retry**. The same API surface works in both browser (fetch) and SSR (server dispatch).

## Quick Start

```typescript
import { api } from '@pounce/kit'

// Simple GET
const users = await api('/api/users').get<User[]>()

// POST with body
const created = await api('/api/users').post<User>({ name: 'Alice' })

// With path params (type-inferred from URL)
const user = await api('/api/users/[id]').get<User>({ id: '42' })

// With typed route definitions
import { defineRoute } from '@pounce/kit'
const userRoute = defineRoute('/api/users/[id]')
const user = await api(userRoute, { id: '42' }).get<User>()
```

## `ApiClientInstance`

```typescript
interface ApiClientInstance<P extends string> {
  get<T>(params?: ExtractPathParams<P>): HydratedPromise<T>
  post<T>(body: unknown): Promise<T>
  put<T>(body: unknown): Promise<T>
  del<T>(params?: ExtractPathParams<P>): Promise<T>
  patch<T>(body: unknown): Promise<T>
  stream<T>(onMessage: (data: T) => void, onError?: (err: Error) => void): () => void
}
```

`ExtractPathParams` is a type-level utility that extracts `{ id: string }` from `"/users/[id]"`.

## SSR Hydration

GET requests support **hydrated promises** — the server pre-fetches data and injects it as `<script>` tags. The client reads the injected data synchronously on first render, avoiding a waterfall.

```typescript
const promise = api('/api/data').get<Data>()
promise.hydrated // Data | undefined — available synchronously if SSR-injected
```

### Server Side

```typescript
import { withSSRContext, getCollectedSSRResponses, injectApiResponses } from '@pounce/kit/node'

const { result, context } = await withSSRContext(async () => {
  return renderApp()
}, 'http://localhost:3000')

const responses = getCollectedSSRResponses()
const responses = getCollectedSSRResponses()
const html = injectApiResponses(result, responses)
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
import { config, enableSSR, disableSSR } from '@pounce/kit'

config.timeout = 10000  // Request timeout (ms)
config.retries = 3      // Retry count for 5xx/408 errors
config.retryDelay = 100 // Delay between retries (ms)

enableSSR()   // Enable SSR data collection
disableSSR()  // Disable and clear SSR data
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
