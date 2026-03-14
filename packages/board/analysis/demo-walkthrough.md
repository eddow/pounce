# Demo App Walkthrough

A single test consumer app that exercises every `@sursaut/board` feature. Replaces the three legacy consumers (`minimal-app`, `blog-app`, `e-commerce-app`).

---

## File Structure

```
packages/board/demo/
├── routes/
│   ├── index.ts              § Root API + global provide
│   ├── index.tsx             § Home page (provide-as-props)
│   ├── layout.tsx            § Root layout (nav shell)
│   ├── (auth)/
│   │   └── login.ts          § Route group: POST login
│   ├── posts/
│   │   ├── index.ts          § CRUD + middle (timing) + provide (posts list)
│   │   ├── index.tsx         § Posts list page (provide-as-props)
│   │   └── [id]/
│   │       ├── index.ts      § GET/PUT/DELETE + provide (single post)
│   │       ├── index.tsx     § Post detail (provide-as-props, InferVerb)
│   │       └── comments.ts   § stream verb (SSE)
│   └── users/
│       ├── index.ts          § middle (auth guard) + defineRoute/zod
│       ├── index.tsx         § Users list
│       ├── layout.tsx        § Nested layout
│       └── [id]/
│           ├── index.ts      § GET with typed params + provide
│           └── index.tsx     § User detail (api + InferVerb + InferPath)
├── lib/
│   └── external-api.ts      § defineProxy (external comments API)
├── server.ts                 § Hono adapter mount
└── package.json
```

---

## §1 — Server Entry

`server.ts` — the Hono adapter, one-port architecture.

```ts
import { Hono } from 'hono'
import { createSursautMiddleware } from '@sursaut/board/adapters/hono'

const app = new Hono()
app.use('*', createSursautMiddleware({ routesDir: './routes' }))
export default app
```

**Features exercised:** Hono adapter, `createSursautMiddleware`, glob-based route discovery.

---

## §2 — Root: Global Provide + Layout

### `routes/index.ts` — global config provider

```ts
import { expose } from '@sursaut/board'

export default expose({
  provide: async (req) => ({
    siteName: 'Sursaut Demo',
    buildTime: new Date().toISOString(),
  }),
})
```

Every page and layout in the app receives `siteName` and `buildTime` as props via provide cascading.

### `routes/layout.tsx` — root shell

```tsx
import type { Child } from '@sursaut/core'

interface Props { siteName: string; children: Child }

export default function RootLayout({ siteName, children }: Props) {
  return (
    <div class="app-shell">
      <nav>
        <strong>{siteName}</strong>
        {' | '}<a href="/">Home</a>
        {' | '}<a href="/posts">Posts</a>
        {' | '}<a href="/users">Users</a>
      </nav>
      <main>{children}</main>
    </div>
  )
}
```

**Features exercised:** `provide` at root level, `layout.tsx` convention, provide-as-props on layouts, `children` injection by router.

### `routes/index.tsx` — home page

```tsx
interface Props { siteName: string; buildTime: string }

export default function HomePage({ siteName, buildTime }: Props) {
  return (
    <div>
      <h1>Welcome to {siteName}</h1>
      <p>Built at {buildTime}</p>
    </div>
  )
}
```

**Features exercised:** provide-as-props consumption at page level, zero-import data access.

---

## §3 — Route Group: Auth

### `routes/(auth)/login.ts`

```ts
import { expose } from '@sursaut/board'

export default expose({
  post: async (req) => {
    const body = await req.raw.json()
    if (body.username === 'admin' && body.password === 'secret')
      return { token: 'fake-jwt' }
    return new Response('Unauthorized', { status: 401 })
  },
})
```

The `(auth)` directory is a route group — parenthesized segments are stripped from the URL. `POST /login` works, not `POST /auth/login`.

**Features exercised:** Route groups, `req.raw` (the underlying `Request`), returning a raw `Response` for short-circuit.

---

## §4 — Posts: CRUD + Middle + Provide + Stream

### `routes/posts/index.ts` — list/create + middleware

```ts
import { expose } from '@sursaut/board'
import type { SursautRequest } from '@sursaut/board'

const posts = [
  { id: '1', title: 'First Post', content: 'Hello World' },
  { id: '2', title: 'Sursaut Board', content: 'Is awesome' },
]
let nextId = 3

export default expose({
  middle: [
    async (req: SursautRequest, next) => {
      const start = Date.now()
      const res = await next()
      res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
      return res
    },
  ],

  provide: async () => ({ posts }),

  get: async () => posts,

  post: async (req) => {
    const body = await req.raw.json()
    const post = { id: String(nextId++), title: body.title, content: body.content }
    posts.push(post)
    return post
  },
})
```

The `middle` cascades to all children (including `[id]/`). The `provide` feeds the posts list to the sibling `.tsx`.

### `routes/posts/index.tsx` — posts list page

```tsx
interface Post { id: string; title: string; content: string }
interface Props { siteName: string; posts: Post[] }

export default function PostsPage({ posts }: Props) {
  return (
    <div>
      <h1>Posts</h1>
      <ul>
        <for each={posts}>
          {(post) => (
            <li><a href={`/posts/${post.id}`}>{post.title}</a></li>
          )}
        </for>
      </ul>
    </div>
  )
}
```

**Note:** `siteName` is also available (from root provide) but this component doesn't destructure it — cascading merge is transparent.

### `routes/posts/[id]/index.ts` — single post CRUD + provide

```ts
import { expose } from '@sursaut/board'
import type { SursautRequest } from '@sursaut/board'

// Imported from sibling for shared state (test fixture; real apps use a DB)
import { posts } from '../index.js'

const findPost = (id: string) => posts.find(p => p.id === id)

export default expose<{ id: string }>({
  provide: async (req) => {
    const post = findPost(req.params.id)
    return { post: post ?? null }
  },

  get: async (req) => {
    const post = findPost(req.params.id)
    if (!post) return new Response('Not found', { status: 404 })
    return post
  },

  put: async (req) => {
    const post = findPost(req.params.id)
    if (!post) return new Response('Not found', { status: 404 })
    const body = await req.raw.json()
    Object.assign(post, body)
    return post
  },

  delete: async (req) => {
    const idx = posts.findIndex(p => p.id === req.params.id)
    if (idx === -1) return new Response('Not found', { status: 404 })
    posts.splice(idx, 1)
    return { deleted: true }
  },
})
```

**Features exercised:** `expose<{ id: string }>()` — typed file-level params. `provide` at child level merges with parent: page receives `{ siteName, buildTime, posts, post }`. The timing `middle` from `posts/index.ts` cascades here automatically.

### `routes/posts/[id]/index.tsx` — post detail page

```tsx
import type { InferVerb } from '@sursaut/board'
import type PostRoute from './index'

type Post = InferVerb<typeof PostRoute, 'get'>

interface Props { post: Post | null; siteName: string }

export default function PostDetail({ post }: Props) {
  if (!post) return <p>Post not found.</p>
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <a href="/posts">&larr; Back</a>
    </article>
  )
}
```

**Features exercised:** `InferVerb` type extraction from the sibling `.ts` route, provide-as-props (`post` comes from `provide`, not from a client fetch on initial load).

### `routes/posts/[id]/comments.ts` — SSE stream

```ts
import { expose } from '@sursaut/board'

export default expose<{ id: string }>({
  stream: async function* (req) {
    // Simulated real-time comment feed
    for (let i = 0; i < 5; i++) {
      yield { id: i, text: `Comment ${i} on post ${req.params.id}`, ts: Date.now() }
      await new Promise(r => setTimeout(r, 1000))
    }
  },
})
```

**Features exercised:** `stream` verb — returns an async generator, consumed on the client via `@sursaut/kit`'s SSE client.

---

## §5 — Users: Auth Guard + Zod + Nested Layout

### `routes/users/index.ts` — auth guard middleware + schema

```ts
import { expose } from '@sursaut/board'
import type { SursautRequest, MiddleNext } from '@sursaut/board'

const requireAuth = async (req: SursautRequest, next: MiddleNext) => {
  const token = req.raw.headers.get('Authorization')
  if (!token) return new Response('Unauthorized', { status: 401 })
  ;(req as any).user = { id: 'admin', role: 'root' }
  return next()
}

const users = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'user' },
]

export default expose({
  middle: [requireAuth],

  provide: async () => ({ users }),

  get: async () => users,
})
```

### `routes/users/layout.tsx` — nested layout

```tsx
import type { Child } from '@sursaut/core'

interface Props { siteName: string; children: Child }

export default function UsersLayout({ children }: Props) {
  return (
    <div class="users-shell">
      <h2>Users Section</h2>
      {children}
    </div>
  )
}
```

Layout receives provide from root (`siteName`) and its own level (`users`), but not from child `[id]`.

### `routes/users/[id]/index.ts` — typed dynamic params + provide

```ts
import { expose } from '@sursaut/board'

import { users } from '../index.js'

export default expose<{ id: string }>({
  provide: async (req) => {
    const user = users.find(u => u.id === req.params.id)
    return { user: user ?? null }
  },

  get: async (req) => {
    const user = users.find(u => u.id === req.params.id)
    if (!user) return new Response('Not found', { status: 404 })
    return user
  },
})
```

### `routes/users/[id]/index.tsx` — client-side type-safe API call

```tsx
import { api } from '@sursaut/board'
import type { InferVerb, InferPath } from '@sursaut/board'
import type UserRoute from './index'

type User = InferVerb<typeof UserRoute, 'get'>

interface Props { user: User | null }

export default function UserDetail({ user }: Props) {
  if (!user) return <p>User not found.</p>
  return (
    <div id="user-profile">
      <h1>{user.name}</h1>
      <p>Role: {user.role}</p>
      <a href="/users">&larr; Back</a>
    </div>
  )
}
```

**Features exercised:** `InferVerb`, `InferPath`, provide-as-props, typed params.

---

## §6 — External API Proxy

### `lib/external-api.ts`

```ts
import { defineProxy } from '@sursaut/board'

export interface Comment {
  id: number
  postId: number
  name: string
  body: string
}

export const commentsApi = defineProxy({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoints: {
    getComments: {
      method: 'GET',
      path: '/posts/{postId}/comments',
      mock: (params) => [
        { id: 1, postId: Number(params.postId), name: 'Alice', body: 'Great post!' },
        { id: 2, postId: Number(params.postId), name: 'Bob', body: 'Thanks for sharing.' },
      ] as Comment[],
    },
  },
})
```

**Features exercised:** `defineProxy` for external APIs, mock data for dev/test.

---

## Feature Coverage Matrix

| Feature | File(s) |
|---|---|
| `expose()` basic verbs (GET/POST/PUT/DELETE) | `posts/index.ts`, `posts/[id]/index.ts` |
| `middle` cross-tree cascade | `posts/index.ts` → `posts/[id]/*` |
| `middle` auth guard | `users/index.ts` → `users/[id]/*` |
| `provide` (root) | `index.ts` → every page |
| `provide` (cascading merge) | `posts/index.ts` → `posts/[id]/index.ts` |
| `provide-as-props` | Every `.tsx` file |
| `layout.tsx` (root + nested) | `layout.tsx`, `users/layout.tsx` |
| Route groups | `(auth)/login.ts` |
| Dynamic params `[id]` | `posts/[id]`, `users/[id]` |
| Typed file params `expose<{ id: string }>` | `posts/[id]/index.ts`, `users/[id]/index.ts` |
| `stream` verb (SSE) | `posts/[id]/comments.ts` |
| `defineProxy` (external API) | `lib/external-api.ts` |
| `InferVerb` / `InferPath` | `posts/[id]/index.tsx`, `users/[id]/index.tsx` |
| `api()` client | `users/[id]/index.tsx` |
| `req.raw` (underlying Request) | `(auth)/login.ts`, `posts/[id]/index.ts` |
| Raw `Response` short-circuit | `(auth)/login.ts`, `posts/[id]/index.ts` |
| Hono adapter | `server.ts` |

---

## Test Compatibility

The existing test files reference `minimal-app/routes` by path:
- `hono.spec.ts`
- `route-scanner.spec.ts`
- `component-discovery.spec.ts`
- `ssr-hydration.spec.ts`

The demo-app's tree is a **superset** of minimal-app's structure (`index`, `users/[id]`, `users/layout.tsx`), so test path updates are mechanical — change `minimal-app` → `demo-app`.

`blog-app` and `e-commerce-app` are **not referenced by any test file** and can be deleted outright.

---

## Migration

1. Create `demo-app/` with the structure above
2. Update 4 test files: `s/minimal-app/demo-app/`
3. Delete `minimal-app/`, `blog-app/`, `e-commerce-app/`
4. Run tests, verify 189/189 still pass
