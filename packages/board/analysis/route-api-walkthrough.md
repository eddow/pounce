# Route API (`expose`) Implementation Walkthrough

This checklist tracks the implementation of the `expose()`-based API routing system.
Spec: [api-routing.md](./api-routing.md) | Types: `src/lib/router/expose.ts`

---

## Phase 1: Runtime `expose()` function

- [x] **1.1** Create `src/lib/router/expose.ts` with the runtime `expose()` implementation
  - *Implemented the recursive flattening logic. Replaced `expose-utils.ts`. Uses `globalThis.__POUNCE_CURRENT_FILE__` to derive base paths.*
  - Reads `globalThis.__POUNCE_CURRENT_FILE__` to determine `baseUrl`
  - Walks the config tree recursively
  - Distinguishes keys: verbs (handler leaves), `middle` (middleware), `provide` (SSR loader), `/`-prefixed (sub-path branches)
  - Flattens into a central `RouteRegistry` (path → verb → { handler, middle[] })
  - Returns the tree `T` for `typeof` extraction on the client
- [x] **1.2** Define the `RouteRegistry` data structure
  - *Defined `RouteRegistry` and `FileRegistry` as Maps. Flattens structural definitions resolving nested configurations directly to their full URL paths.*
  - Stores flattened routes: `Map<string, Map<HTTPVerb, { handler, middle[] }>>`
  - Must support dynamic segments (`/[id]`) and catch-all
  - Matching: exact > dynamic > catch-all priority
  - `provide` entries stored per route path (cascaded + merged parent-first)
- [x] **1.3** Middleware execution engine
  - *Implemented as `executeChain` in `hono.ts`. Recursive async chain runner with double-call guard.*
  - Run `middle` in order: ancestor-first (cascaded from parent directories + parent nodes)
  - Signature: `(req, next) => Response | void | Promise<Response | void>`
  - If void returned and `next()` not called → auto-call next
  - If Response returned → short-circuit
  - If `next()` called → wrap pattern (code runs before and after handler)

## Phase 2: Engine boot sequence

- [x] **2.1** File discovery in `buildRouteTree` (or new function)
  - *Integrated directly into `src/lib/router/index.ts` `buildRouteTree`. Discovers `.ts` files alongside `.tsx` components.*
  - Scan `routes/` for `**/*.ts` files
  - Must be **sequential** (not parallel) — `__POUNCE_CURRENT_FILE__` is a global
- [x] **2.2** Context injection + execution loop
  - *Added robust try/finally block injecting `__POUNCE_CURRENT_FILE__` and `__POUNCE_CURRENT_BASE_URL__` around the dynamic route loader.*
  - For each `.ts` file: set `globalThis.__POUNCE_CURRENT_FILE__`, `await import(file)`, clear global
  - Calculate `baseUrl` from file path relative to `routesDir`
  - Handle HMR: clear registry + re-run on cache invalidation
- [x] **2.3** Cross-tree inheritance resolution
  - *Implemented via a dynamic closest-ancestor lookup strategy in `expose.ts` backed by a Breadth-First filesystem sorting in `buildRouteTree` to guarantee parents are evaluated before children contexts.*
  - **`middle`:** Cascades seamlessly using execution sorting, superseding legacy `common.ts`.
  - **`provide`:** Merges down into `req.provide` using a composed async function wrapper constructed dynamically.
- [x] **2.4** Wire into existing `buildRouteTree`
  - *Both `.tsx` and `.ts` map smoothly during the same scan pass.*
  - `.tsx` files → UI route tree (`index.tsx` = page, `layout.tsx` = wrapping layout)
  - `.ts` files → execute for `expose()` registration (new)
  - Both happen during the same scan pass

## Phase 3: Hono adapter integration

- [x] **3.1** `app.all('*')` catch-all dispatcher
  - *Implemented inside `createPounceMiddleware`. Non-HTML requests are matched against a pre-compiled `routeMatcher` from `@pounce/kit/router/logic` (enforcing exact path matches).*
  - Receive standardized `Request` from Hono
  - Content negotiation: `Accept: text/html` → SSR render `.tsx`, otherwise → API dispatch
  - Look up route in `RouteRegistry`, run `middle` chain, call handler
  - Return `Response`
- [x] **3.2** `provide` integration with SSR
  - *Implemented: `provide` is a purely SSR concept that passes props to components. If `X-Pounce-Provide` header is detected, we run the provide loader directly as its own API endpoint.*
- [x] **3.3** `provide` integration with SPA navigation
  - *Implemented: `isSpaProvideFetch` intercepts SPA navigation requests.*
- [x] **3.4** `setRouteRegistry()` call
  - *Implemented inside `hono.ts` route builder loop so SSR matches locally rather than HTTP loopback.*
  - The expose engine populates the registry, then calls `setRouteRegistry()` once
  - SSR `dispatchToHandler` uses this for server-side API calls during render

## Phase 4: Client-side type extraction

- [x] **4.1** Verify `InferVerb`, `InferProvide`, `InferPath` work with `/`-prefixed keys
  - *Added `expose-types.spec.ts` type-level test proving accurate string chopping and verb resolution across generic tree depths.*
- [x] **4.2** Integrate with `@pounce/kit` API client
  - *Validated and incorporated. `@pounce/kit` already leverages `.get<T>()`, updated `minimal-app` strictly binding client `.get()` to server `InferVerb` types.*
  - `api(route).get<InferVerb<typeof Route, 'get'>>()` pattern works.
  - `stream` verb → SSE client from `@pounce/kit`

## Phase 5: CLI & dev experience

- [x] **5.1** Update `dev.ts` — hook expose engine into Vite dev server
  - *Added `clearExposeRegistry()` into `hono.ts` `clearRouteTreeCache` so the API maps flush fully on `.ts` HMR saves.*
- [x] **5.2** Update `build.ts` — include expose engine in production server entry
  - *Verified `import.meta.glob` captures both `.tsx` and `.ts`, meaning the expose backend inherently boots alongside components safely.*
- [x] **5.3** Validate `stream` verb end-to-end (SSE from handler → kit client)
  - *Validated during earlier conversation using manual EventSource connections.*

## Phase 6: Testing & documentation

- [x] **6.1** Unit test tree flattening
- [x] **6.2** Unit test param extraction (types and runtime URL parsing)
- [x] **6.3** Unit test `middle` inheritance (parent → child merging)
- [x] **6.4** Unit test `provide` cascading (parent + child async merging)
- [x] **6.5** Integration test: full request lifecycle (Hono → expose → middle → handler → Response)
- [x] **6.6** Integration test: SSR with cascaded `provide` loader
- [x] **6.7** Integration test: SPA navigation `provide` fetch
- [x] **6.8** Update `LLM.md` and `walkthrough.md`
  - *Done. Walkthrough summarizes the completed architecture.*
- [x] **6.9** Update consumer test apps (`minimal-app`) with expose-style routes
  - *Fixtures updated: `index.ts` and `users/[id]/index.ts` use `expose()` with `PounceRequest`. `users/common.ts` converted from legacy `middleware` export to `expose()` with `middle`. Full validation requires 2.3 (cross-tree inheritance).*

---

## Design Decisions (settled)

| Decision | Choice | Rationale |
|---|---|---|
| Sub-path disambiguation | `/`-prefixed keys | Structural — no whitelist collision, extensible metadata |
| Handler signature | `(req) => value` | No `res` object, return-based |
| Middleware name | `middle` | It IS middleware (cross-tree, wrap+abort) — not just guards |
| Middleware signature | `(req, next) => Response \| void` | Combines abort + wrap patterns |
| `middle` scope | Cross-tree (directory hierarchy) | `index.ts`'s `middle` cascades to sibling files + children |
| `provide` scope | Cross-tree, merged parent-first | Parent `provide` data available to child via `req` |
| `provide` client access | Hydration (SSR) + internal fetch (SPA nav) | Transparent to the component |
| `provide` consumption | Merged result spread as props to sibling `.tsx` | Props are read-only in pounce-ts; component stays pure & testable; no magic import needed |
| `provide` + layouts | `layout.tsx` receives provide from its level and above | `children` injected by router; layouts never see child-level provide data |
| `expose` return | Returns `T` | Enables `typeof` for client type extraction |
| Boot concurrency | Sequential file imports | `__POUNCE_CURRENT_FILE__` is a mutable global |
| `path` metadata | Removed | Sub-path key IS the path; `/` prefix makes `path` redundant |
| Layout convention | `layout.tsx` file (not in `expose()`) | Layouts are UI concerns consumed by the client router; putting them in `.ts` would break dependency direction (client must never import server code) |
| Replaces `common.tsx` | `layout.tsx` | Same role (wrapping layout), clearer name |
