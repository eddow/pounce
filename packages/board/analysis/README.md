# Sursaut Framework

The source of truth is [api-routing](./api-routing.md)

**Lightweight, type-safe, full-stack framework with SSR support and explicit middleware management.**

## Features
✅ **File-based routing** – No configuration needed
✅ **Type-safe API calls** – Full TypeScript support
✅ **SSR data injection** – Script-tag based hydration
✅ **Explicit middleware** – Per-route middleware stacks
✅ **External API proxies** – Typed legacy system integration
✅ **Framework** – sursaut-board is to sursaut-ts what sveltekit is to svelte

npm install sursaut-board
```

### 2. Project Structure
├── routes/
│   ├── users/
│   │   ├── [id]/
│   │   │   ├── index.tsx   # Frontend
│   │   │   ├── index.ts    # Backend handlers
│   │   │   ├── types.d.ts  # Shared types
│   │   │   └── common.ts   # Middleware
│   └── api/
│       └── external.ts    # API proxies
```

### 3. Define a Route
```ts
// routes/users/[id]/index.ts
import { expose } from '@sursaut/board/server'

export default expose<{ id: string }>({
	get: async ({ params }) => {
		return {
			status: 200,
			data: { id: params.id, name: 'John Doe' },
		}
	},
})
```

### 4. Add Middleware
```ts
// routes/users/[id]/common.ts
import type { Middleware } from "sursaut/http";

export const middleware: Middleware[] = [
  async (ctx, next) => {
	ctx.user = await getUserFromSession(ctx.request);
	return next();
  }
];
```

### 5. Use in Frontend
```tsx
// routes/users/[id]/index.tsx
import { api } from "sursaut/http";
import { getSSRData } from "sursaut/ssr";

export default function UserPage({ params }) {
  const initialData = getSSRData<User>(`user-${params.id}`);
  const { data: user } = useQuery(
	["user", params.id],
	// Use /api/... for SSR-safe calls to your server
	() => api("/api/users").get({ id: params.id }),
	{ initialData }
  );

  return <h1>{user?.name}</h1>;
}
```

## Documentation
- [Core Concepts](CONCEPTS.md)
- [Architecture Overview](ARCHITECTURE.md)
- [API Reference](API.md)
- [SSR Guide](SSR.md)
- [Middleware](MIDDLEWARE.md)
- [External APIs](EXTERNAL_APIS.md)
- [Implementation Guide](IMPLEMENTATION.md)
- [Examples](EXAMPLES.md)
- [Migration Guide](MIGRATION.md)
- [Best Practices](BEST_PRACTICES.md)