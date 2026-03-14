# Kit API Context & SSR Coupling — Analysis

## What Is

### Kit's SSR Surface

Kit's API layer has SSR awareness baked into **three files**:

#### 1. [context.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/api/context.ts) — Request Scope

`RequestScope` hardcodes an `ssr` sub-object:

```ts
export interface RequestScope {
  ssr: {
    id: symbol
    responses: Map<string, unknown>
    counter: number
    promises: Promise<unknown>[]
  }
  config: Partial<ClientConfig>  // includes `ssr: boolean`
  interceptors: InterceptorEntry[]
  origin?: string
  routeRegistry?: any
}
```

- `createScope()` always allocates the `ssr` bag — even on the browser, even when SSR is never used.
- `trackSSRPromise()` and `flushSSRPromises()` assume the `ssr` field exists.
- `setGetContext()` is the only extensibility hook (lets `node/context.ts` inject ALS).

#### 2. [ssr-hydration.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/api/ssr-hydration.ts) — Data Injection/Retrieval

- `getSSRId()`, `injectSSRData()`, `getSSRData()`, `clearSSRData()`, `escapeJson()`
- Reads/writes `ctx.ssr.responses` — tightly couples to the `RequestScope.ssr` shape.
- `getSSRData()` reads `<script type="application/json">` from the DOM — pure client-side hydration concern baked into the shared layer.

#### 3. [base-client.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/api/base-client.ts) — API Client

SSR checks appear in **6 places**:

| Location | What it does |
|---|---|
| `enableSSR()`/`disableSSR()` | Toggle `config.ssr` globally or per-context |
| `doRequest()` L258 | Reads `activeCtx.config.ssr` to decide hydration read |
| `doRequest()` L266-273 | Client-side: short-circuits GET if SSR data exists |
| `doRequest()` L306-311 | Server-side: writes fetched data to `ssr.responses` |
| `requestWithRetry()` L331-332 | Tracks promise in `ssr.promises` |
| `stream()` L428-433 | Returns no-op if SSR (streams don't work server-side) |

Also re-exports: `getSSRId`, `getSSRData`, `injectSSRData`, `clearSSRData`.

#### 4. Node entry points

- [node/context.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/node/context.ts) — ALS storage, `runWithContext`
- [node/ssr.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/node/ssr.ts) — `withSSRContext`, `getCollectedSSRResponses`, `injectApiResponses`
- [node/api.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/node/api.ts) — Server executor with `dispatchToHandler` and route registry

### Board's Duplication

Board has **near-verbatim copies** of kit's SSR code:

| Kit file | Board copy | Diffs |
|---|---|---|
| `api/context.ts` | `lib/http/context.ts` (168L) | +`ensureStorage()`, +`declare global`, same `RequestScope` shape |
| `api/ssr-hydration.ts` | `lib/ssr/utils.ts` (223L) | +injector registry, +`injectSSRContent()`, same hydration logic |
| `node/ssr.ts` | `lib/ssr/utils.ts` | Same `withSSRContext`, `getCollectedSSRResponses` |

Board imports from **itself** (`../http/context.js`), not from `@sursaut/kit`. The two context systems coexist using the same global symbols, but there's no shared contract — just copy-paste convergence.

### What's Clean

- [dom/api.ts](file:///home/fmdm/dev/ownk/sursaut/packages/kit/src/dom/api.ts) — Pure `fetch` executor, 44 lines. Exactly what kit should be: create a client factory with a transport.

---

## What Should Be

### Principle

**Kit provides the API client, context infrastructure, and extension points. It knows nothing about SSR.** Board (or any server framework) plugs in SSR behavior via kit's hooks.

### Proposed Architecture

```
kit/api/context.ts         — Generic RequestScope (no `ssr` field)
                             Pluggable `getContext` (existing hook)
                             Pluggable `onRequest` / `onResponse` hooks

kit/api/base-client.ts     — API client with interceptors, retries, timeout
                             NO SSR checks. Uses hooks for pre/post request.

kit/dom/api.ts             — fetch executor (unchanged)
kit/node/api.ts            — dispatch executor (no SSR awareness)
kit/node/context.ts        — ALS storage (unchanged, but for generic scope)

board/lib/http/context.ts  — Extends RequestScope with `ssr` field
                             Registers SSR hooks into kit's extension points
board/lib/ssr/...          — Hydration, injection, injector registry
```

### Concrete Changes

#### 1. Make `RequestScope` generic / extensible

```ts
// kit/api/context.ts
export interface RequestScope {
  config: Partial<ClientConfig>
  interceptors: InterceptorEntry[]
  origin?: string
  [key: symbol]: unknown   // open for extension
}
```

Remove `ssr`, `routeRegistry`, and any SSR-specific fields. Board extends:

```ts
// board/lib/http/context.ts
import { type RequestScope as BaseScope } from '@sursaut/kit'

const SSR_KEY = Symbol.for('__SURSAUT_SSR__')

export interface SSRState { ... }

export function getSSR(scope: BaseScope): SSRState | null {
  return scope[SSR_KEY] as SSRState ?? null
}
```

#### 2. Replace SSR checkpoints with hooks

Instead of `if (isSSR) { ... }` scattered in `base-client.ts`, use a **response hook** pattern:

```ts
// kit/api/context.ts
export type RequestHook = (req: Request, url: URL) => Response | undefined
export type ResponseHook = (url: URL, data: unknown) => void

export let onBeforeRequest: RequestHook | null = null
export let onAfterResponse: ResponseHook | null = null

export function setRequestHook(hook: RequestHook) { onBeforeRequest = hook }
export function setResponseHook(hook: ResponseHook) { onAfterResponse = hook }
```

Board sets these hooks at startup:

```ts
// board/server/init.ts
setRequestHook((req, url) => {
  // Check hydration cache, return cached response if found
})
setResponseHook((url, data) => {
  // Store in SSR responses map
})
```

Base-client calls hooks generically:

```ts
// In doRequest():
const cached = onBeforeRequest?.(request, currentUrl)
if (cached) return cached

// After successful response:
onAfterResponse?.(currentUrl, data)
```

#### 3. Move SSR files out of kit

| Current location | → Destination |
|---|---|
| `kit/api/ssr-hydration.ts` | **Delete** (board already has its copy) |
| `kit/node/ssr.ts` | **Delete** (board handles this) |
| `kit/api/context.ts` `trackSSRPromise`/`flushSSRPromises` | **Delete** |

#### 4. `ClientConfig` drops `ssr`

```ts
export interface ClientConfig {
  timeout: number
  retries: number
  retryDelay: number
  // no `ssr` — that's board's concern
}
```

#### 5. Route registry moves to board

`setRouteRegistry` / `getRouteRegistry` in `base-client.ts` and `context.ts` are only used for SSR dispatch. They belong in board's server layer, not kit.

---

## Migration Path

1. **Add hooks** to kit's `context.ts` — `setRequestHook`, `setResponseHook` (non-breaking)
2. **Board uses hooks** instead of duplicated inline SSR checks (non-breaking)
3. **Remove `ssr` from `RequestScope`** and all SSR functions from kit (breaking for board, but board already has its own copies)
4. **Remove `ssr-hydration.ts`** and **`node/ssr.ts`** from kit
5. **Remove `routeRegistry`** from `RequestScope` — board manages this in its own scope extension
6. **Drop `enableSSR`/`disableSSR`** from kit's base-client
