# Routing System

`@sursaut/board` uses a file-based router for both UI pages and API handlers. The router scans the routes directory, builds a route tree for `.tsx` pages and `layout.tsx` wrappers, and executes sibling `.ts` files so `expose()` can register API endpoints, middleware, and `provide()` loaders.

## Route files

- `index.tsx`
  - UI page for the directory path
- `layout.tsx`
  - Layout inherited by child UI routes
- `index.ts`
  - API module for the same path, usually `export default expose(...)`
- `foo.tsx`
  - UI page for `/foo`
- `foo.ts`
  - API module for `/foo`

Example:

```text
routes/
├── layout.tsx
├── index.tsx
├── index.ts
├── posts/
│   ├── index.tsx
│   ├── index.ts
│   └── [id]/
│       ├── index.tsx
│       └── index.ts
└── users/
    ├── layout.tsx
    ├── index.tsx
    └── index.ts
```

## Dynamic segments and route groups

- `[id]`
  - Single dynamic segment
- `[...slug]`
  - Catch-all segment
- `(auth)`
  - Route group folder that is transparent in the URL

Examples:

- `routes/users/[id]/index.tsx` -> `/users/123`
- `routes/docs/[...slug]/index.tsx` -> `/docs/a/b`
- `routes/(auth)/login.tsx` -> `/login`

The matcher prioritizes:

1. Static segments
2. Dynamic segments
3. Catch-all segments
4. Route groups

## Layout inheritance

Layouts come from `layout.tsx`, not `common.tsx`.

Every matched page receives the collected layouts from root to leaf. For `/users/1`, the page may be wrapped by:

- `routes/layout.tsx`
- `routes/users/layout.tsx`

## API modules with `expose()`

Route-local API behavior is declared in sibling `.ts` files:

```ts
import { expose } from '@sursaut/board'

export default expose({
	provide: async () => ({ siteName: 'Sursaut Demo' }),
	get: async () => ({ ok: true }),
	'/stats': {
		get: async () => ({ visits: 42 }),
	},
})
```

Key points:

- API endpoints are declared only inside `expose({ ... })`
- `get`, `post`, `put`, `patch`, `delete`, and `stream` are the supported endpoint keys
- nested keys beginning with `/` define subpaths
- `stream` is served as `text/event-stream`
- `provide()` is not a normal HTTP endpoint; it is used for SSR and SPA page-prop loading

## Middleware and `provide()` inheritance

Board does not use `common.ts` middleware files.

Instead, middleware and page loaders are declared inside `expose()` and cascade through the route tree:

```ts
import { expose } from '@sursaut/board'

export default expose({
	middle: [async (req, next) => next()],
	provide: async () => ({ currentUser: { id: 'admin' } }),
})
```

- `middle`
  - applies to the current route and descendant API endpoints
- `provide`
  - merges parent-first across the directory hierarchy
  - becomes page props during SSR
  - is also available during SPA navigation through the internal provide fetch path

For API requests, middleware runs for endpoint verbs.

For SPA `provide()` fetches, board intentionally skips endpoint middleware and invokes the composed `provide()` chain directly.

## `+*` support folders and route-local imports

Any file or folder beginning with `+` is ignored by route discovery.

That allows patterns such as:

- `+shared/posts.ts`
- `+components/card.tsx`

Imports like `+shared/posts` or `+components/card` are resolved by walking upward from the importing route directory until the routes root is reached.

This keeps route-local shared modules colocated without accidentally becoming routes.

## Tests as documentation

The most reliable routing behavior references are:

- `tests/integration/component-discovery.spec.ts`
- `tests/integration/route-scanner.spec.ts`
- `tests/integration/route-api.spec.ts`
- `src/lib/router/index.spec.ts`
