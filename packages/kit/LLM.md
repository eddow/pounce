# @pounce/kit LLM Cheat Sheet

Read [pounce core's LLM](../core/LLM.md)

## Overview

Application-level toolkit for Pounce apps. Provides **reactive client state**, **client-side routing**, **API client with SSR hydration**, **CSS injection**, **localStorage persistence**, and **Intl formatting components**. Sits between `@pounce/core` (rendering) and `@pounce/ui` (components).

## Architecture

### Dual Entry Points (DOM / Node)

Kit follows the [dual entry-point policy](../../dual-ep-policy.md):

| Entry | Import | Purpose |
|-------|--------|---------|
| `@pounce/kit` | `./dom` (browser) or `./node` (SSR) | Auto-selected by `package.json` exports |
| `@pounce/kit/dom` | Browser bootstrap | Real DOM listeners, fetch-based API, `stored()` |
| `@pounce/kit/node` | SSR bootstrap | ALS-backed client proxy, server dispatch API |
| `@pounce/kit/intl` | Intl formatters | 6 components + cache + locale resolver |

The shared `index.ts` re-exports only `api` types and `router` logic (no DOM/Node deps).

### Client Singleton

- **`client`** — reactive object (`Client` interface) with URL, viewport, focus, visibility, language, timezone, direction, online status, `prefersDark` (reactive, tracks `prefers-color-scheme` media query)
- **DOM**: `dom/client.ts` binds real browser state via event listeners + `MutationObserver`
- **Node**: `node/client.ts` creates an `AsyncLocalStorage`-backed proxy; each SSR request gets an isolated `createClientInstance()`
- **Shared**: `client/shared.ts` holds the singleton slot; `setClient()` binds the implementation

### Router

Two layers:
1. **`router/logic.ts`** — Pure route parsing/matching/building. Syntax: `/users/[id:uuid]/posts?page=[page:integer?]`. Supports `[param]`, `[param:format]`, `[...catchAll]`, optional query params. Custom formats via `registerFormat(name, validator)`.
2. **`router/components.tsx`** — `<Router>` component (reactive via `lift()` + `PounceElement`) and `<A>` link component (client-side navigation with `aria-current`).

`defineRoute()` in `router/defs.ts` creates typed route definitions with `buildUrl()` and optional `querySchema` (arktype).

### API Client

- **`api/core.ts`** — HTTP types, `ApiError`, middleware runner with `Server-Timing`, security headers, compression
- **`api/base-client.ts`** — `createApiClientFactory(executor)` — abstract over fetch vs server dispatch. Returns `api(url)` with `.get()`, `.post()`, `.put()`, `.del()`, `.patch()`. SSR hydration via `HydratedPromise`. Interceptor registry (global + context-scoped).
- **`api/context.ts`** — `RequestScope` with `AsyncLocalStorage` for thread-safe SSR. `runWithContext()`, `createScope()`, `flushSSRPromises()`.
- **`api/response.ts`** — `PounceResponse` extends `Response` with body caching (multiple reads by interceptors).
- **`api/inference.ts`** — `ExtractPathParams<"/users/[id]">` → `{ id: string }` (type-level).
- **`api/ssr-hydration.ts`** — `getSSRId()`, `injectSSRData()`, `getSSRData()` — server writes, client reads from `<script>` tags.
- **DOM**: `dom/api.ts` — fetch executor with `AbortController` timeout
- **Node**: `node/api.ts` — smart executor: local requests dispatch to route registry, external requests use fetch

### CSS Injection

`dom/css.ts` provides `css`, `sass`, `scss` template tag functions. At build time, the Vite plugin replaces them with processed CSS + `__injectCSS()`. Runtime: deduplicates by DJB2 hash, groups by caller file, supports SSR collection (`getSSRStyles()`).

`componentStyle` and `baseStyle` are `flavored()` variants (from mutts) for `@layer` scoping.

### localStorage (`stored()`)

`dom/storage.ts` — `stored({ key: defaultValue })` returns a reactive object synced to `localStorage`. Supports inter-tab communication via `StorageEvent`. Auto-cleanup via `cleanedBy()`.

### Intl Components

`intl/` — 6 formatting components: `Number`, `Date`, `RelativeTime`, `List`, `Plural`, `DisplayNames`.

- Return **text nodes** (no wrapper elements) — except `Plural` which returns a fragment with JSX children
- Formatter instances cached by `(locale, JSON.stringify(options))` key
- `resolveLocale(explicit?)`: explicit prop > `setLocaleResolver()` override > `client.language` > `'en-US'`
- `setLocaleResolver()` hook for UI's `DisplayProvider` integration

### File-Based Routing (Node)

`node/router.ts` — `buildRouteTree(routesDir)` scans filesystem or `import.meta.glob()` results. Convention:
- `index.ts` → API handlers (`get`, `post`, etc.)
- `index.tsx` → page component (`default` export)
- `common.ts` → middleware (inherited by children)
- `common.tsx` → layout (wraps children)
- `[id].ts` / `[...slug].tsx` → dynamic segments
- `(group)/` → route groups (transparent in URL)

### SSR

`node/ssr.ts` — `withSSR()` composes core's JSDOM isolation + kit's client isolation. `withSSRContext()` creates a `RequestScope` for API data collection. `injectApiResponses()` embeds collected data as `<script>` tags.

## Source Map

```
src/
├── index.ts              # Barrel: re-exports api + router
├── client/
│   ├── types.ts          # ClientState, Client, Direction, NavigateOptions
│   ├── implementation.ts # Reactive default client (mutts reactive())
│   └── shared.ts         # Singleton slot + setClient()
├── router/
│   ├── logic.ts          # Pure parsing/matching/building (497 lines)
│   ├── defs.ts           # defineRoute() + type-safe buildUrl
│   ├── components.tsx    # <Router> + <A> components
│   └── index.ts          # Barrel
├── api/
│   ├── core.ts           # HttpMethod, ApiError, runMiddlewares, security headers
│   ├── base-client.ts    # createApiClientFactory, interceptors, SSR hydration
│   ├── context.ts        # RequestScope, AsyncLocalStorage, runWithContext
│   ├── response.ts       # PounceResponse (cached body reads)
│   ├── inference.ts      # ExtractPathParams<T> type utility
│   ├── ssr-hydration.ts  # SSR data injection/extraction
│   └── index.ts          # Barrel
├── dom/
│   ├── index.ts          # DOM entry: re-exports shared + dom-specific
│   ├── client.ts         # Browser client: event listeners, history interception
│   ├── api.ts            # Fetch-based executor
│   ├── css.ts            # css/sass/scss tags, __injectCSS, SSR collection
│   └── storage.ts        # stored() — reactive localStorage
├── node/
│   ├── index.ts          # Node entry: re-exports shared + node-specific + css stubs
│   ├── client.ts         # ALS-backed client proxy
│   ├── bootstrap.ts      # createClientInstance, createClientProxy, runWithClient
│   ├── api.ts            # Server dispatch executor
│   ├── router.ts         # File-based route tree (buildRouteTree, matchFileRoute)
│   └── ssr.ts            # withSSR, withSSRContext, injectApiResponses
└── intl/
    ├── index.ts          # Barrel: 6 components + locale resolver
    ├── locale.ts         # resolveLocale, setLocaleResolver
    ├── cache.ts          # Cached Intl formatter constructors
    ├── number.tsx        # <Number> — Intl.NumberFormat
    ├── date.tsx          # <Date> — Intl.DateTimeFormat
    ├── relative-time.tsx # <RelativeTime> — Intl.RelativeTimeFormat
    ├── list.tsx          # <List> — Intl.ListFormat
    ├── plural.tsx        # <Plural> — Intl.PluralRules + slot selection
    ├── display-names.tsx # <DisplayNames> — Intl.DisplayNames
    └── intl.spec.ts      # 23 tests
```

## Build & Test

- **Build**: `source ~/.nvm/nvm.sh && nvm use 22 && pnpm run build`
- **Test**: `source ~/.nvm/nvm.sh && nvm use 22 && pnpm run test`
- **Build chain**: plugin → core → kit (plugin exports from `dist/`, must be rebuilt first)
- **Unit tests**: 100 tests across 6 spec files (api/inference, router ×2, intl, css, storage)
- **E2E tests**: 8 Playwright tests (SPA nav, params, back/forward, direct URL, 404, aria-current)
- **E2E run**: `source ~/.nvm/nvm.sh && nvm use 22 && pnpm run test:e2e`
- **DTS**: Zero errors. `vite-plugin-dts` generates declarations.

## Dependencies

- **mutts** — reactivity (`reactive`, `effect`, `cleanedBy`, `flavored`)
- **@pounce/core** — JSX (`h`, `Fragment`, `compose`, `PounceElement`), `implementationDependent`, SSR (`withSSR`)
- **arktype** — route query schema validation

## ⚠️ Gotchas

1. **mutts types**: `dist/index.d.ts` is generated by a `closeBundle` plugin in mutts' `rollup.config.js`. tsconfig paths must point to `../../../mutts/dist/index.d.ts`.
2. **CSS tags are build-time**: `css`, `sass`, `scss` are replaced by the Vite plugin. The runtime fallback just calls `__injectCSS()` with raw text (no preprocessing).
3. **`stored()` needs cleanup**: Returns a `cleanedBy()` object. If used outside a component lifecycle, call the cleanup manually.
4. **Node entry stubs CSS**: `node/index.ts` exports no-op `css`/`sass`/`scss` functions.
5. **`client` is `null!` until bootstrap**: The singleton is set by `dom/client.ts` or `node/client.ts` on import. Don't access `client` at module scope in shared code.
6. **No arrow function JSX children**: `{() => expr}` in JSX survives the babel plugin as a raw function — the reconciler drops it as `emptyChild`. Use `{expr}` instead (babel wraps it as `r(() => expr)`).

## Known Issues

- `router/components.tsx` has unused `h`/`Fragment` imports (auto-injected by babel on `.tsx` files — harmless, tree-shaken in build)
