# Server-Side Rendering and Hydration

`@pounce/board` treats SSR as a first-class path. The server establishes an SSR request context, renders the matched route tree, and injects hydration payloads into the HTML response.

## Universal `api()` behavior

The same `api()` call behaves differently depending on where it runs:

```ts
import { api } from '@pounce/board'

const posts = await api('/posts').get<Post[]>()
```

- During SSR for a local route on the same origin
  - board dispatches directly to the matched handler through the route registry
  - no network round-trip is used
- In the browser on first load
  - board checks for a matching hydration payload first
- In the browser after navigation
  - board falls back to `fetch`
- For external absolute URLs
  - board uses `fetch` even on the server

## SSR request context

Board wraps requests in an SSR context that carries:

- request-local configuration
- collected SSR payloads
- collected head HTML from kit `<Head>` / `useHead()` usage
- pending promises to flush before final HTML is returned
- the active route registry for local server dispatch

That context is what allows `api()` and `provide()` to cooperate during rendering.

## Hydration payloads

SSR data is injected into the HTML as JSON script tags:

```html
<script type="application/json" id="pounce-data-..."></script>
```

The script ID is deterministic and based on the requested path, including query parameters when relevant.

On the client:

- `api().get()` checks `getSSRData(getSSRId(url))`
- if a payload exists, it is used immediately
- otherwise the request falls back to the normal client path

The promise returned by `api().get()` also exposes a synchronous `hydrated` property when data is already available.

## Head content

When your UI uses `@pounce/kit`'s `<Head>` or `useHead()`, board collects that content during SSR and injects it into the final document `<head>`.

```tsx
import { Head } from '@pounce/kit'

function Page() {
	return <>
		<Head>
			<title>Dashboard</title>
			<link rel="canonical" href="https://example.com/dashboard" />
		</Head>
		<main>...</main>
	</>
}
```

Notes:

- browser mounting stays additive; multiple `<Head>` instances compose
- SSR injection happens inside the active board SSR context before the HTML response is finalized
- hydration payload scripts and collected head HTML share the same request-scoped injection pass

## `provide()` page props

Sibling route `.ts` modules can export `provide()` through `expose()`:

```ts
import { expose } from '@pounce/board'

export default expose({
	provide: async () => ({ siteName: 'Pounce Demo' }),
})
```

During SSR:

- the composed `provide()` chain is executed for the matched page route
- the result is merged into page props
- the same payload is injected into hydration scripts

During SPA navigation:

- the client requests page props through the internal provide channel using the `X-Pounce-Provide: true` header
- board invokes the composed `provide()` chain and returns JSON
- that result becomes the next page's props

## Dev SSR path

In development, board uses Vite middleware mode and renders the matched UI route inside the active SSR context.

Important details:

- route modules are loaded through Vite SSR for UI rendering
- route-local `+shared` and `+components` imports are resolved before execution
- hydration content must be injected before leaving the SSR context so collected payloads are preserved

## URL forms supported by `api()`

- absolute URL
  - `https://example.com/api/posts`
- site-absolute URL
  - `/posts`
- site-relative URL
  - `./stats`
- route definition
  - `api(postsRoute, { id: '1' })`

## Best practices

- Keep `GET` handlers and `provide()` loaders idempotent
- Avoid browser-only globals during initial server render
- In dev SSR, keep framework modules on a single Vite SSR execution path to avoid duplicate runtime instances

## Common pitfalls

- Empty root HTML usually means the route component did not render or SSR failed before `renderToStringAsync`
- Hydration warnings usually mean the expected `pounce-data-*` script was not emitted for that route
- Layout components should come from `layout.tsx` and render `props.children` exactly once
