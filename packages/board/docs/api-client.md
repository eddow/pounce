# API Client

The universal `api()` client in `@pounce/board` handles local SSR dispatch, hydration reuse, and normal browser fetches through one interface.

## Basic usage

```ts
import { api, defineRoute } from '@pounce/board'

// Inline paths — quick one-off calls
const post = await api('/posts/[id]').get<{ id: string; title: string }>({ id: '1' })
const created = await api('/posts').post<{ id: string }>({ title: 'Hello' })

// Callable endpoints — reusable and type-safe
const posts = {
  byId: defineRoute('/posts/[id]'),
  list: defineRoute('/posts'),
}

const samePost = await posts.byId({ id: '1' }).get<{ id: string; title: string }>()
const allPosts = await posts.list().get<{ id: string; title: string }[]>()
```

## Supported inputs

`api()` accepts:

- a site-absolute path
  - `api('/posts')`
- a site-relative path
  - `api('./stats')`
- an absolute URL
  - `api('https://example.com/api/posts')`

The package also exposes direct methods bound to the current route:

```ts
import { get, post } from '@pounce/board'

const current = await get<{ ok: true }>()
const updated = await post<{ ok: true }>({ enabled: true })
```

## SSR and hydration behavior

For `GET` requests:

- during SSR on the same origin
  - board dispatches directly to the matched route handler without a network call
- on first client load
  - board checks for a matching hydration script first
- on later client navigation
  - board falls back to `fetch`

`api().get()` returns a promise with an extra `hydrated` property:

```ts
const request = api('/posts').get<Post[]>()
const initial = request.hydrated
const posts = initial ?? (await request)
```

## Interceptors

Use `intercept()` to register request/response middleware around the client.

```ts
import { intercept } from '@pounce/board'

const unregister = intercept('**', async (req, next) => {
	req.headers.set('X-App-Version', '1.0.0')
	const res = await next(req)
	console.log(`${req.method} ${req.url} -> ${res.status}`)
	return res
})
```

Interceptors are:

- ordered FIFO by registration time
- SSR-aware
- allowed to wrap local SSR dispatch as well as browser `fetch`

### Path matching

- `**`
  - matches all requests
- `*`
  - matches a single segment
- `/path`
  - matches one exact pathname
- `/path/**`
  - matches a pathname prefix
- `https://...`
  - matches an exact full URL
- `RegExp`
  - full regex matching

## Response mutation

Board uses `PounceResponse`, which supports repeated body reads and body replacement through `setData()`.

```ts
import { intercept, PounceResponse } from '@pounce/board'

intercept('/posts/**', async (req, next) => {
	const response = PounceResponse.from(await next(req))
	const data = await response.json()
	if (data && typeof data === 'object' && 'error' in data) {
		response.setData({ ...data, userMessage: 'Something went wrong' })
	}
	return response
})
```

## Timeouts

Global timeout:

```ts
import { api, config } from '@pounce/board'

config.timeout = 5_000
await api('/slow').get()
```

Per-request override:

```ts
await api('/slow', { timeout: 30_000 }).get()
```

## Retries

Global configuration:

```ts
import { api, config } from '@pounce/board'

config.retries = 3
config.retryDelay = 1_000
await api('/unstable').get()
```

Per-request override:

```ts
await api('/unstable', { retries: 5, retryDelay: 500 }).get()
```

Retries apply to:

- network failures
- timeout failures
- HTTP `408`
- HTTP `>= 500`

## File uploads

`FormData` bodies are passed through without forcing JSON headers:

```ts
const formData = new FormData()
formData.append('avatar', fileInput.files[0])
formData.append('username', 'alice')

await api('/profile').post(formData)
```

This works in browser fetch mode and in SSR dispatch mode, provided the server runtime handles multipart bodies.
