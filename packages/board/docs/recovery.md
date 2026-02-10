# Pounce-Board Recovery Report

> **Date:** 2026-02-10
> **Context:** Partial project recovery from previous development. This document catalogues what was recovered, what's missing, what's broken, and what needs reconciliation with the current monorepo.

---

## 1. Recovery Summary

### Source Files Recovered

| Module | File | Lines | Status |
|--------|------|-------|--------|
| **Entry** | `src/index.ts` | 30 | ✅ Complete |
| **Entry** | `src/client/index.ts` | 27 | ✅ Complete |
| **Entry** | `src/server/index.ts` | 73 | ✅ Complete |
| **Entry** | `src/types.ts` | 40 | ⚠️ Stale imports (`@pounce/kit`) |
| **HTTP Core** | `src/lib/http/core.ts` | 192 | ✅ Complete |
| **HTTP Core** | `src/lib/http/index.ts` | 3 | ✅ Barrel |
| **API Client** | `src/lib/http/client.ts` | 676 | ✅ Complete (largest file) |
| **Context** | `src/lib/http/context.ts` | 165 | ✅ Complete |
| **Response** | `src/lib/http/response.ts` | 112 | ✅ Complete |
| **Proxy** | `src/lib/http/proxy.ts` | 250 | ✅ Complete |
| **Router** | `src/lib/router/index.ts` | 585 | ✅ Complete |
| **Route Defs** | `src/lib/router/defs.ts` | 83 | ✅ Complete |
| **SSR Utils** | `src/lib/ssr/utils.ts` | 167 | ✅ Complete |
| **SSR** | `src/lib/ssr/index.ts` | 16 | ✅ Barrel |
| **Types** | `src/lib/types/inference.ts` | 18 | ✅ Complete |
| **Hono Adapter** | `src/adapters/hono.ts` | 180 | ⚠️ WIP comments (lines 93-128) |
| **CLI Entry** | `src/cli/index.ts` | 58 | ✅ Complete |
| **CLI Dev** | `src/cli/dev.ts` | 208 | ⚠️ Hardcoded paths |
| **CLI Build** | `src/cli/build.ts` | 193 | ⚠️ Uses `require()` in ESM, hardcoded paths |
| **CLI Preview** | `src/cli/preview.ts` | 23 | ✅ Complete |
| **Total** | | **~3,100** | |

### Test Files Recovered

| Test File | Lines | Coverage Area |
|-----------|-------|---------------|
| `src/lib/http/core.spec.ts` | 201 | Middleware runner, JSON/error responses, security headers, compression |
| `src/lib/http/client.spec.ts` | 1,427 | SSR dispatch, hydration, all HTTP methods, path resolution, timeouts, interceptors, retries, context isolation |
| `src/lib/http/response.spec.ts` | 96 | Multi-read body, setData, clone, PounceResponse.from |
| `src/lib/http/proxy.spec.ts` | 795 | defineProxy, path substitution, prepare/transform, params, schema validation, raw, mock, caching, retries, timeout |
| `src/lib/http/proxy-client.spec.ts` | 50 | api() + defineProxy integration |
| `src/lib/ssr/utils.spec.ts` | 173 | Script tag injection, XSS escaping, getSSRData, context isolation, nested contexts |
| `src/lib/router/index.spec.ts` | 345 | parseSegment, matchRoute (static/dynamic/catch-all/groups), middleware collection, buildRouteTree with glob |
| `src/lib/router/defs.spec.ts` | 50 | defineRoute, path params, query params with Zod validation |
| `src/lib/types/inference.spec.ts` | 36 | Type-level tests for ExtractPathParams |
| `src/adapters/hono.spec.ts` | 80 | Hono middleware integration with minimal-app routes |
| **Total** | **~3,253** | |

### Consumer Test Apps Recovered

#### `tests/consumers/minimal-app/`
- `package.json`, `vite.config.ts`, `index.html`, `client.tsx`
- `routes/index.ts` — root GET handler
- `routes/index.tsx` — root page component
- `routes/common.tsx` — root layout
- `routes/users/common.ts` — middleware (injects user + timestamp)
- `routes/users/common.tsx` — users layout
- `routes/users/list.tsx` — user list page
- `routes/users/[id]/index.ts` — dynamic user handler
- `routes/users/[id]/index.tsx` — dynamic user page
- `routes/users/[id]/def.ts` — route definition
- `routes/users/[id]/types.d.ts` — shared types

#### `tests/consumers/blog-app/`
- `package.json`, `server.ts`, `tsconfig.json`
- `routes/index.ts`, `routes/common.ts`
- `routes/(auth)/login.ts` — auth route group
- `routes/posts/index.ts`, `routes/posts/common.ts`, `routes/posts/[id]/index.ts`

### Config Files Recovered
- `package.json` — freshly recreated by user
- `vitest.config.ts` — with aliases for pounce-ts, pounce-ui, mutts
- `playwright.config.ts`
- `biome.json`
- `LLM.md`
- `walkthrough.md` — full spec with TODO checklist (1,076 lines)

---

## 2. What's Missing

### Source Files NOT Recovered

| Expected | Purpose | Walkthrough Reference |
|----------|---------|----------------------|
| `src/adapters/vercel.ts` | Vercel serverless adapter | Phase 7.5 |
| `tests/integration/middleware-chain.spec.ts` | Integration test | Phase 10.2 |
| `tests/integration/route-loading.spec.ts` | Integration test | Phase 10.2 |
| `tests/integration/ssr-flow.spec.ts` | Integration test | Phase 10.2 |
| `tests/e2e/*.spec.ts` | Playwright E2E tests | Phase 10.3 |
| `tests/consumers/e-commerce-app/` | E-commerce consumer app | Phase 10.4 |
| `tests/utils/mock-request.ts` | Test utilities | Phase 10.6 |
| `tests/utils/test-server.ts` | Test utilities | Phase 10.6 |
| `tests/utils/test-fixtures.ts` | Test utilities | Phase 10.6 |
| `tests/setup-mutts.ts` | Test setup (referenced in vitest.config) | — |
| `tsconfig.json` (root) | TS config | Phase 1 |
| `tsconfig.build.json` | Build TS config (referenced in scripts) | Phase 1 |
| `tsconfig.fe.json` | Frontend TS config | Phase 1 |
| `tsconfig.be.json` | Backend TS config | Phase 1 |
| `analysis/*.md` | 11 design documents referenced in walkthrough | Phase 0 (pre-impl) |

### Walkthrough TODOs Still Open (from `walkthrough.md`)

| Phase | Item | Notes |
|-------|------|-------|
| 3.5 | Custom SSR data bundlers | Analysis done, implementation pending |
| 5.3 | Streaming responses | Not implemented |
| 6.3 | `.d.ts` loading for shared types | Scanner sees them but doesn't process |
| 6.3 | HMR for dev mode | Watcher clears cache but no full HMR |
| 6.4 | Cached compiled middleware stacks | Not implemented |
| 6.4 | Document middleware order guarantees | Not documented |
| 7.5 | Vercel adapter | Not started |
| 7.6 | Netlify, Cloudflare, Deno, Bun adapters | Not started |
| 8.5 | Consumer lifecycle (`npm run dev/build`) | Partial |
| 9.1-9.3 | Advanced type generation | Partial — `ExtractPathParams` exists, no handler inference |
| 9.4 | OpenAPI → `.d.ts` generation | Not started |
| 10.3 | E2E tests | Most unchecked |
| 10.6 | Test utilities | Not created |
| 11 | Documentation | Not started |
| 12 | Plugin system, WebSockets, SSE, perf, security, observability | Not started |
| 13 | Publishing, CI/CD, community | Not started |

---

## 3. Critical Issues

### 3.1 Package Name Mismatch

The recovered code uses **old standalone package names**. The monorepo now uses scoped names:

| In recovered code | Current monorepo | Used in |
|--------------------|------------------|---------|
| `pounce-ts` | `@pounce/core` (or `pounce-ts` — TBD) | everywhere |
| `pounce-ui` | `@pounce/ui` (or `pounce-ui` — TBD) | hono adapter, vitest config |
| `pounce-board` | `pounce-board` | consumer apps, self-references |
| `@pounce/board` | `pounce-board` | `users/[id]/index.ts` import |
| `@pounce/kit` | `@pounce/kit` | `src/types.ts` |

The consumer apps are inconsistent: `minimal-app/routes/index.ts` imports from `pounce-board/server`, while `minimal-app/routes/users/[id]/index.ts` imports from `@pounce/board`.

**Action:** Decide on final package names and do a global rename.

### 3.2 Duplicate Functionality with `@pounce/kit`

`src/types.ts` imports from `@pounce/kit` and re-exports router functions, implying that **some board functionality was moved to kit** during a refactor. But the actual board source (`src/lib/`) still contains the full implementations:

- **Router** — board has its own `buildRouteTree`, `matchRoute`, `parseSegment` while `src/types.ts` re-exports kit's `serverRouter.*`
- **API Client** — board has full `api()` implementation; kit may also have one
- **Middleware** — board has `runMiddlewares`; kit exports `Middleware` types
- **SSR** — board has full SSR utils; kit has SSR data tracking

**Action:** Audit `@pounce/kit` to determine what overlaps. Either:
1. Board consumes kit's implementations and adds only the glue (Hono adapter, CLI, file scanner)
2. Board keeps its own implementations and `types.ts` becomes dead code

### 3.3 Hono Adapter WIP Comments

`src/adapters/hono.ts` lines 93-128 contain stream-of-consciousness comments about CSS injection:

```
// Wait, I need to add the import at the top first.
// But replace_file_content targets specific lines.
// I will assume the import is added in a separate call...
// Abort this tool call and use multi_replace?
```

These are LLM generation artifacts from a previous coding session. The CSS injection logic works but needs cleanup.

**Action:** Remove WIP comments, keep the `try { dynamic import pounce-ui } catch` pattern for optional CSS injection.

### 3.4 `cli/build.ts` — ESM/CJS Hybrid

Lines 191-192 use `createRequire` to access `module.builtinModules`:

```ts
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
```

Also, the import is at the bottom of the file (violates import ordering rules), and `require('module').builtinModules` is used inside a Rollup config.

**Action:** Replace with `import { builtinModules } from 'node:module'` at the top.

### 3.5 `cli/dev.ts` — Hardcoded Monorepo Paths

The dev server has paths like:

```ts
path.resolve(__dirname, '../../../pounce-ts/src/runtime/jsx-runtime.ts')
path.resolve(__dirname, '../../../mutts/src')
```

These assume a specific monorepo layout (`packages/board/src/cli/` → `packages/pounce-ts/`).

**Action:** These should be resolved from consumer's `node_modules` or via the plugin system, not hardcoded relative paths.

### 3.6 Zod Dependency

`defs.ts` and `proxy.ts` import from `zod`. The walkthrough mentions Arktype (Phase 1.2), and the previous `package.json` listed both. The new user-created `package.json` lists `zod`.

**Action:** Stick with `zod` (it's what the code uses). Remove any Arktype references.

### 3.7 `client.ts` — `data: any` in ApiError

```ts
export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public data: any,  // ← violates no-any rule
        public url: string
    ) { ... }
}
```

**Action:** Type as `unknown`.

### 3.8 `client.ts` — Dynamic Import in `context.ts`

```ts
async function ensureStorage(): Promise<AsyncLocalStorage<RequestScope>> {
    const { AsyncLocalStorage } = await import('node:async_hooks')
    // ...
}
```

User rules forbid dynamic imports. This is used to lazy-load `AsyncLocalStorage` to avoid breaking browsers.

**Action:** Use a static import guarded by the entry point split (`server/index.ts` vs `client/index.ts`). The server entry can eagerly import `node:async_hooks`; the client entry never touches it.

---

## 4. Test Status Assessment

Based on walkthrough checkmarks and recovered spec files:

| Category | Expected | Recovered | Estimated Tests |
|----------|----------|-----------|-----------------|
| Unit (colocated `.spec.ts`) | 10 files | 10 files | ~180 |
| Integration (`tests/integration/`) | 3 files | 0 files | 0 |
| E2E (`tests/e2e/`) | 5 files | 0 files | 0 |
| Consumer apps | 3 apps | 2 apps | N/A |
| Test utilities | 3 files | 0 files | N/A |

The walkthrough marks integration tests as `[x]` (done), meaning they existed but weren't recovered. The unit tests are comprehensive — `client.spec.ts` alone has ~60 test cases covering SSR dispatch, hydration, all HTTP methods, path resolution, timeouts, interceptors, retries, and context isolation.

**No tests have been run yet.** They will likely fail due to import resolution (`pounce-ts` not found, missing `tests/setup-mutts.ts`, etc.).

---

## 5. Architecture Diagram (As-Recovered)

```
pounce-board/
├── src/
│   ├── index.ts                  ← Universal entry (re-exports client APIs)
│   ├── client/index.ts           ← Browser entry
│   ├── server/index.ts           ← Node entry (router, adapter, SSR, context, proxy)
│   ├── types.ts                  ← STALE: re-exports from @pounce/kit
│   │
│   ├── lib/
│   │   ├── http/
│   │   │   ├── core.ts           ← Types + runMiddlewares + response helpers
│   │   │   ├── client.ts         ← api() universal client + interceptors + SSR dispatch
│   │   │   ├── context.ts        ← AsyncLocalStorage per-request scope
│   │   │   ├── response.ts       ← PounceResponse (multi-read body + setData)
│   │   │   └── proxy.ts          ← defineProxy() for external APIs
│   │   │
│   │   ├── router/
│   │   │   ├── index.ts          ← buildRouteTree + matchRoute (fs scan + glob)
│   │   │   └── defs.ts           ← defineRoute() with Zod validation
│   │   │
│   │   ├── ssr/
│   │   │   └── utils.ts          ← SSR injection, hydration, escaping
│   │   │
│   │   └── types/
│   │       └── inference.ts      ← ExtractPathParams, InferHandlerOutput
│   │
│   ├── adapters/
│   │   └── hono.ts               ← createPounceMiddleware, createPounceApp
│   │
│   └── cli/
│       ├── index.ts              ← cac CLI: dev, build, preview
│       ├── dev.ts                ← Vite middleware mode + Hono + SSR
│       ├── build.ts              ← Client + server Vite builds
│       └── preview.ts            ← Spawn production server
│
├── tests/
│   └── consumers/
│       ├── minimal-app/          ← Basic app with routes, middleware, layouts
│       └── blog-app/             ← CRUD + auth groups
│
├── walkthrough.md                ← Full spec (1,076 lines, 13 phases)
├── LLM.md                        ← Cheatsheet
├── package.json                  ← Freshly recreated
└── vitest.config.ts              ← Test config with aliases
```

---

## 6. Reconciliation Plan

### Step 1: Fix Foundations (Before Any Code Changes)
1. Decide final package names (`pounce-ts` vs `@pounce/core`, etc.)
2. Audit `@pounce/kit` overlap — determine what board owns vs. delegates
3. Create missing tsconfig files
4. Create `tests/setup-mutts.ts`

### Step 2: Fix Code Issues
1. Global rename of package imports
2. Remove WIP comments from `hono.ts`
3. Fix `build.ts` ESM import ordering
4. Replace hardcoded paths in CLI with proper resolution
5. Fix `any` types → `unknown`
6. Resolve dynamic import in `context.ts`

### Step 3: Get Tests Running
1. Run unit tests, fix import failures
2. Recreate integration tests (they were marked done in walkthrough)
3. Verify consumer apps build and run

### Step 4: Complete Missing Pieces
1. Create missing tsconfig files
2. Create test utilities
3. Implement E2E tests
4. Clean up and document

---

## 7. Dependency Graph

```
pounce-board
├── hono              (HTTP framework)
├── @hono/node-server (Node adapter for Hono)
├── cac               (CLI framework)
├── zod               (Schema validation)
├── mutts             (Reactivity — link to monorepo)
├── pounce-ts         (UI framework — link to monorepo)
└── pounce-ui         (Component library — optional, for SSR CSS injection)

devDependencies:
├── vite              (Build + dev server)
├── vitest            (Unit + integration tests)
├── @playwright/test  (E2E tests)
├── typescript
├── @biomejs/biome    (Lint/format)
└── jsdom             (Test DOM)
```
