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

### Platform Adapter

Kit defines a `PlatformAdapter` interface — the contract between kit and its environment. Three implementations:

| Adapter | Where | How |
|---------|-------|-----|
| **DOM** | `kit/dom/client.ts` | Real browser: event listeners, history API |
| **Test** | `kit/platform/test.ts` | Global reactive client, jsdom head — no ALS, no proxies |
| **SSR** | Provided by board | ALS-backed client, head serialization — board's business, not kit's |

- **`client`** — proxy that delegates to `platform.client`. Returns `undefined` on get when no platform is set (allows `client?.language` fallback). Throws on set.
- **`setPlatform(adapter)`** — called once by the environment entry point.
- **Head injection**: use `latch(document.head, ...)` from `@pounce/core` directly. No kit wrapper needed.

### Router

Two layers:
1. **`router/logic.ts`** — Pure route parsing/matching/building. Syntax: `/users/[id:uuid]/posts?page=[page:integer?]`. Supports `[param]`, `[param:format]`, `[...catchAll]`, optional query params. Custom formats via `registerFormat(name, validator)`.
2. **`router/components.tsx`** — `<Router>` component (reactive via `lift()` + `PounceElement`) and `<A>` link component (client-side navigation with `aria-current`).

`defineRoute()` in `router/defs.ts` creates typed route definitions with `buildUrl()` and optional `querySchema` (arktype).

`linkModel(props: LinkProps)` in `router/link-model.ts` — headless hook for `<a>` elements: intercepts clicks for SPA navigation, computes `ariaCurrent`. `LinkProps` extends `JSX.IntrinsicElements['a']` with:
- `underline?: boolean` — controls text-decoration
- `matchPrefix?: boolean` — `aria-current="page"` activates on any sub-route (uses `startsWith(href + '/')` to avoid false matches like `/router` → `/router-other`)

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

`css.ts` (shared — works in both DOM and SSR) provides `css`, `sass`, `scss` template tag functions. At build time, the Vite plugin replaces them with processed CSS + `__injectCSS()`. Runtime: deduplicates by DJB2 hash, groups by caller file. In DOM: injects `<style>` tags into `document.head`. In SSR (`typeof document === 'undefined'`): collects into an in-memory map, retrieved via `getSSRStyles()`.

`componentStyle` and `baseStyle` are `flavored()` variants (from mutts) for `@layer` scoping.

All three are exported from `@pounce/kit` directly (no subpath needed).

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
├── perf.ts               # Performance marks helpers (route:navigate, route:sync, etc.)
├── platform/
│   ├── types.ts          # PlatformAdapter, Client, ClientState, Direction, NavigateOptions
│   ├── shared.ts         # Singleton slot: setPlatform(), client proxy
│   ├── test.ts           # createTestAdapter() — global reactive client, no ALS
│   └── index.ts          # Barrel
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
├── css.ts                # css/sass/scss tags, __injectCSS, getSSRStyles, componentStyle, baseStyle — shared DOM+SSR
├── dom/
│   ├── index.ts          # DOM entry: imports client.js (side-effect), re-exports platform + dom-specific
│   ├── client.ts         # DOM adapter: reactive client + event listeners
│   ├── api.ts            # Fetch-based executor
│   ├── display.tsx       # DisplayProvider, useDisplayContext, DisplayContext — DOM-only (uses client + componentStyle)
│   └── storage.ts        # stored() — reactive localStorage
├── node/
│   ├── index.ts          # Node entry: re-exports platform + node-specific + css stubs
│   ├── api.ts            # Server dispatch executor
│   ├── router.ts         # File-based route tree (buildRouteTree, matchFileRoute)
│   └── ssr.ts            # withSSRContext, injectApiResponses, re-exports setPlatform + createTestAdapter
└── intl/
    ├── index.ts          # Barrel: 6 components + unified Intl + locale resolver
    ├── locale.ts         # resolveLocale, setLocaleResolver
    ├── cache.ts          # Cached Intl formatter constructors
    ├── main.tsx          # <Intl> — unified dispatcher (Date | number | string | string[])
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
- **Unit tests**: 104 tests across 7 spec files (api/inference, router ×2, intl, css, storage, head)
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
4. **CSS works in SSR**: `css`/`sass`/`scss`/`componentStyle` are in shared `src/css.ts` — no DOM dependency. SSR collects styles; call `getSSRStyles()` to get the `<style>` tag HTML for `<head>`.
5. **`client` proxy is graceful before platform init**: Returns `undefined` on property access when no platform is set (allows `client?.language ?? 'en-US'` fallback). Throws on set — requires an explicit platform. Head injection: use `latch(document.head, ...)` from core.
6. **No arrow function JSX children**: `{() => expr}` in JSX survives the babel plugin as a raw function — the reconciler drops it as `emptyChild`. Use `{expr}` instead (babel wraps it as `r(() => expr)`).

## Known Issues

- `router/components.tsx` has unused `h`/`Fragment` imports (auto-injected by babel on `.tsx` files — harmless, tree-shaken in build)
