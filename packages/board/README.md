# @sursaut/board

`@sursaut/board` is the full-stack layer for Sursaut applications. It combines file-based routing, SSR, typed route helpers, a universal `api()` client, and a Hono adapter for serving API and UI routes from the same route tree.

## What it provides

- File-based UI routing with `layout.tsx` inheritance
- File-based API routing via `expose()` in sibling `.ts` files
- SSR with automatic hydration payload injection
- A universal `api()` client that dispatches locally during SSR and fetches in the browser
- Typed route inference helpers such as `InferVerb`, `InferProvide`, and `InferPath`
- `+shared` / `+components` style route-local modules resolved by walking upward to the routes root

## Package entry points

```ts
import { api, expose, defineRoute, InferVerb, InferProvide } from '@sursaut/board'
import { createSursautMiddleware } from '@sursaut/board/server'
import { getSSRData } from '@sursaut/board/client'
```

- `@sursaut/board`
  - Universal entry point
  - Exposes the API client, route helpers, SSR helpers, and route type utilities
- `@sursaut/board/server`
  - Server-only helpers such as the Hono adapter, route tree building, and SSR request context utilities
- `@sursaut/board/client`
  - Client-side helpers for hydration-aware code

## Route conventions

Inside your routes directory:

- `index.tsx`
  - UI page for the current folder path
- `layout.tsx`
  - Layout wrapper inherited by descendant pages
- `index.ts`
  - API module for the same path, typically using `expose()`
- `about.tsx`
  - UI page for `/about`
- `about.ts`
  - API module for `/about`
- `(group)/...`
  - Route group folder that does not appear in the URL
- `+shared/*`, `+components/*`, any `+*`
  - Ignored as routes and available as route-local support modules

Example:

```text
routes/
├── layout.tsx
├── index.tsx
├── index.ts
├── posts/
│   ├── index.tsx
│   ├── index.ts
│   ├── [id]/
│   │   ├── index.tsx
│   │   └── index.ts
│   └── +shared/
│       └── posts.ts
└── (auth)/
    ├── login.tsx
    └── login.ts
```

## SSR model

`@sursaut/board` treats SSR as a first-class path:

- Local `api()` calls made during SSR dispatch directly to the matched route handler instead of going through the network
- Successful SSR reads are injected into the HTML as `<script type="application/json" id="sursaut-data-...">...`
- On the first client load, `api().get()` reads that payload before falling back to `fetch`
- On client-side navigations, page `provide()` data is fetched through the internal provide channel and merged into page props

`api().get()` returns a promise with an extra synchronous `hydrated` property when data is already available:

```ts
const request = api('/posts').get<Post[]>()
const initialPosts = request.hydrated
const posts = initialPosts ?? (await request)
```

## Minimal route example

```ts
// routes/posts/index.ts
import { expose } from '@sursaut/board'

export default expose({
	provide: async () => ({ posts: [{ id: '1', title: 'Hello' }] }),
	get: async () => [{ id: '1', title: 'Hello' }],
})
```

```tsx
// routes/posts/index.tsx
import type { InferProvide } from '@sursaut/board'
import type PostsRoute from './index'

type Props = InferProvide<typeof PostsRoute>

export default function PostsPage(props: Props) {
	return (
		<section>
			<h1>Posts</h1>
			<ul>
				<for each={props.posts}>{(post) => <li>{post.title}</li>}</for>
			</ul>
		</section>
	)
}
```

## CLI

The package ships a `sursaut` CLI.

```bash
pnpm exec sursaut dev --routes ./routes --html ./index.html
pnpm exec sursaut build --out ./dist
pnpm exec sursaut preview
```

See the detailed CLI guide in `docs/cli.md`.

## Detailed docs

- `docs/api-client.md`
- `docs/cli.md`
- `docs/middleware.md`
- `docs/routing.md`
- `docs/ssr.md`
- `docs/adapters.md`

## Current status

The dev server, SSR flow, route-local `+*` imports, and board demo e2e coverage are actively maintained. If a detailed guide disagrees with runtime behavior, trust the current code and tests in this package.
