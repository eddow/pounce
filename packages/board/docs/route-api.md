# Route API documentation (`expose`)

Sursaut utilizes the `expose()` API routing engine to declare server-side HTTP endpoints and data loaders adjacent to your UI components. It cleanly handles type inference, middleware encapsulation, routing nested endpoints, and server-side data cascading logic across directory trees.

## 1. Syntax Overview

A `.ts` companion file placed next to a `.tsx` component file acts as its endpoint router and data loader. Call the default import `expose` exported from `@sursaut/board` to scaffold the tree structure natively.

```typescript
// routes/users/[id]/index.ts
import { expose, type SursautRequest } from '@sursaut/board'

export default expose({
	// HTTP Verbs
	get: async (req: SursautRequest<{ id: string }>) => {
		return { success: true, user: req.params.id }
	},

	// Nested sub-paths must be prefixed with '/'
	'/settings': {
		post: async (req: SursautRequest<{ id: string }>) => {
			return { settingsSaved: true }
		}
	}
})
```

## 2. Server-side Pre-loading (`provide`)

The `provide` loader is executed exclusively by Sursaut during SSR (Server-Side Rendering) or when bridging SPA navigation. It runs on the server and provides serialized JSON data downward over the `.tsx` DOM component as props.

```typescript
// routes/users/index.ts
import { expose } from '@sursaut/board'

export default expose({
	provide: async (req) => {
		return { groupName: 'Administrators' }
	}
})
```

### Inheritance and Merge
`provide` data inherently cascades downwards through the directory structure. 
If an `index.ts` loader provides `{ groupName: 'Administrators' }`, a child `[id]/index.ts` file can read it off `req.provide.groupName` and augment or modify the properties. The ultimate merged dictionary is populated directly into the local `index.tsx` as component props.

## 3. Middleware (`middle`)

Middleware arrays can be defined on any node. They define access checks, intercept requests, run early escapes (e.g. 401 Unauthorized Response), or attach contextual data before control is handed to a handler string.

```typescript
export default expose({
	middle: [requireAuth],
	get: async (req) => { ... }
})
```

### Inheritance
Like `provide`, `middle` definitions cascade down. A `requireAuth` placed inside `routes/dashboard/index.ts` automatically asserts over all direct HTTP verb handlers inside `dashboard/index.ts` natively, and continues to waterfall down into `dashboard/reports/index.ts`. Next-level `middle` pushes sequentially down the middleware chain stack.

## 4. Native Typing and `@sursaut/kit` `api()`

Extract HTTP response types purely via generics into the `@sursaut/kit` Universal `api()` client. No duplicated manual interfaces. 

```tsx
import type UsersRoute from './index.ts'
import { InferVerb } from '@sursaut/board'
import { api } from '@sursaut/kit/api/core'

async function fetchUser() {
    // Automatically typed to return { success: boolean, user: string }
    const result = await api().get<InferVerb<typeof UsersRoute, 'get'>>()
}
```

- `InferVerb<Route, 'get' | 'post' | ...>`: Extracts simple endpoint responses
- `InferPath<Route, '/nested/get'>`: Extracts sub-path verb responses
- `InferProvide<Route>`: Extracts the output shape of the SSR loader object
