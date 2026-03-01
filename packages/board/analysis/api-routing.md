# Pounce Framework: API Routing & `expose` Specification

## 1. Architectural Overview

The Pounce Framework utilizes a hybrid File-System + Recursive Record routing system for its Server-Side (Board) API endpoints. 

* `**/*.tsx` files are strictly Client/UI routes (`index.tsx` = page, `layout.tsx` = wrapping layout).
* `**/*.ts` files in the `routes` directory are API/Server routes (configured via `expose()`).

Instead of exporting standard HTTP verbs (`export const get = ...`), developers export the result of an `expose()` function. The configuration passed to `expose()` is a recursive tree that defines HTTP verbs, sub-paths, and cascading middleware (`middle`) without needing `_special` configuration files. Sub-path keys are structurally disambiguated by requiring a `/` prefix.

[Image of a diagram comparing traditional flat file-system routing with a recursive record-based API routing tree]

---

## 2. The Engine Mechanism (Execution-Based Registration)

The Board Engine discovers and registers routes using an execution-context injection pattern.

### The Boot Sequence

1.  **Discovery:** The engine scans the `routes` directory for all `.ts` files.
2.  **Context Injection:** Before importing a file, the engine sets a global identifier (e.g., `globalThis.__POUNCE_CURRENT_FILE__ = '/absolute/path/to/routes/api/users.ts'`).
3.  **Execution:** The engine dynamically imports the file: `await import(filePath)`.
4.  **Capture:** The file executes and calls `expose(config)`. Inside `expose`, the function reads `globalThis.__POUNCE_CURRENT_FILE__` to know exactly which file is currently defining routes. It then calculates the `baseUrl` (e.g., `/api/users`) and flattens the `config` tree into the central Router registry.
5.  **Cleanup:** The engine clears or updates the global variable and moves to the next file.

---

## 3. The `expose` Configuration Object

The argument passed to `expose` is a recursive `ExposedPoint` record. Keys in this record fall into three categories:

### A. HTTP Verbs (The Leaves)
These are standard HTTP methods plus framework-specific actions. If a key matches one of these, its value is the route handler function.
* **Reserved Verbs:** `get`, `post`, `put`, `patch`, `delete`, `stream`.
* **UI Loader:** `provide` (restricted to the root of the file, used to pass data to the sibling `.tsx` file).

### B. Metadata (The Modifiers)
Modify the behavior of the current node and its children.
* **`middle` (Function[]):** Middleware functions. See §4 for semantics.
* **`provide` (Function):** SSR data loader. See §4b for semantics.

### C. Sub-Paths (The Branches)
Any key starting with `/` is a sub-path branch. This prefix structurally disambiguates branches from verbs and metadata — no whitelist collision possible.
* **Example:** A key named `/profile` appends `/profile` to the current path.
* **Example:** A key named `/[id]` appends `/:id` (dynamic segment) to the current path.

---

## 4. Middleware (`middle`) & Data Loading (`provide`)

### 4a. `middle` — Middleware

Replaces the need for `_middleware.ts` or `common.ts` files.

* **Signature:** `(req, next) => Response | void | Promise<Response | void>`
* **Abort:** Return a `Response` to short-circuit the chain (e.g., 401).
* **Pass-through:** Return `void`/`undefined` — the next middleware (or handler) runs automatically.
* **Wrap:** Call `next()` to execute the downstream chain, then run post-handler logic.
* **Context:** Mutate `req` (e.g., `req.user = ...`) to pass data downstream.
* **In-file inheritance:** `middle` on a node applies to all verbs on that node AND all nested `/sub-paths`.
* **Cross-tree inheritance:** `middle` declared in `routes/admin/index.ts` cascades to ALL sibling `.ts` files in `routes/admin/` (e.g., `users.ts`, `settings.ts`) and their children.
* **Stacking:** Parent-first. If ancestor declares `middle: [A]` and descendant declares `middle: [B]`, the chain is `[A, B]`.
* **Cost:** Computed once at boot (+ HMR). Stored flat in the registry. Zero overhead per request beyond iterating the chain.

### 4b. `provide` — SSR Data Loader

Feeds data to the sibling `.tsx` component during server rendering. NOT an HTTP endpoint.

* **Cross-tree inheritance:** `provide` cascades across the directory hierarchy, merged parent-first. If `routes/admin/index.ts` provides `{ user, perms }` and `routes/admin/users.ts` provides `{ userList }`, the component receives `{ user, perms, userList }`.
* **Child access:** A child `provide` receives the parent's merged result in `req`, so it can use parent data.
* **Client access (SSR):** `provide` data is serialized into the HTML as a hydration payload.
* **Client access (SPA nav):** On client-side route change, the framework fetches `provide` data via an internal convention (e.g., a dedicated header). The server calls `provide` and returns the result.

#### Component consumption: provide-as-props

The merged `provide` result is **spread as props** to the sibling `.tsx` component. No magic import needed — the component is a pure function of its props.

```ts
// routes/users/[id]/index.ts
export default expose({
  provide: async (req) => ({
    user: await fetchUser(req.params.id),
    permissions: await getPermissions(req)
  })
})
```

```tsx
// routes/users/[id]/index.tsx — receives { user, permissions } as props
interface Props { user: User; permissions: Permissions }

export default function UserPage({ user, permissions }: Props) {
  return <div>{user.name} — {permissions.level}</div>
}
```

The framework does `<UserPage {...mergedProvideResult} />` internally.

* **Cascading merge is transparent:** Parent provides `auth`, child provides `user` → page gets `{ auth, user }`. The component declares only the props it cares about.
* **Layouts receive their level's accumulated provide:**

```tsx
// routes/users/layout.tsx — receives provide from routes/index.ts + routes/users/index.ts
export default function UsersLayout({ auth, children }: { auth: AuthInfo; children: Node }) {
  return <div class="users-shell">{auth.role} — {children}</div>
}
```

`children` is injected by the router (the nested page content). A layout receives provide data from its level and above — never from children below it.

* **Why props?** Props are read-only in pounce-ts — a natural fit since `provide` data shouldn't be mutated by the component. Components stay pure and testable. No framework-specific import required.
* **Typing:** The component's prop interface is the contract. TypeScript catches mismatches between `provide` return shape and component expectations.

[Image of a tree data structure illustrating middleware and provide cascading down nested route branches]

### 4c. `layout.tsx` — UI Layouts (File Convention)

Layouts are a **UI concern**, not an API concern. They stay in `.tsx` land and are **not** part of `expose()`.

* **Convention:** A file named `layout.tsx` in a directory wraps all child page components in that directory.
* **Inheritance:** Layouts nest parent-first. `routes/layout.tsx` wraps `routes/admin/layout.tsx` wraps `routes/admin/index.tsx`.
* **Why not in `expose()`?** Layouts are consumed by the **client-side router**. If they lived in `expose()`, client `.tsx` files would need to import server `.ts` files — breaking the dependency direction (client must never pull in Node/fs code).
* **Replaces:** The legacy `common.tsx` convention.

---

## 5. Concrete Walkthrough Example

**File:** `src/routes/api/admin.ts`
**Injected Base URL:** `/api/admin`

```typescript
import { expose } from '@pounce/board';
import { requireAuth, checkOwnership } from '../middle';

// `export default` so the client can infer types via `typeof`
export default expose({
    middle: [requireAuth],

    provide: async (req) => {
        return { adminName: 'Admin Panel' };
    },
    
    get: (req) => { return { status: 'ok' } },

    '/users': {
        get: (req) => { return [{ id: 1 }] },
        
        '/[id]': {
            middle: [checkOwnership], // Stacks: [requireAuth, checkOwnership]
            
            get: (req) => { return { id: req.params.id } },
            patch: (req) => { /* PATCH /api/admin/users/123 */ },
        }
    }
});
```

## 6. Hono

The Verdict
Yes, Hono is still an excellent choice, but you should change how you use it. Don't use Hono to build your route tree. Build your route tree with your expose engine, compile it into a highly optimized Map or Trie, and use Hono solely as the "Adapter" that catches all requests (app.all('*')) and standardizes them. This guarantees your framework will run on Cloudflare, Deno, Bun, and Node.js without you having to write a single polyfill.