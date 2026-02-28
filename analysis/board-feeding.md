# Dog-Feeding Pounce Board (`board-feeding.md`)

## Objective
Rewrite `marc`'s server using `@pounce/board` to prove and refine its capabilities, specifically regarding universal API routing and streaming transports (SSE).

Marc has **three access layers**:
1. **MCP Streamable HTTP** (`/mcp`) — used by Windsurf agents
2. **MCP SSE** (`/sse` + `/message`) — used by Antigravity agents
3. **Dashboard REST API** (`/api/*`) + **Dashboard SSE** (`/api/stream`) — used by the human UI

Only layer 3 is dog-fooded through board. Layers 1 & 2 are stateful MCP transports (session-keyed, protocol-specific) and stay as imperative Hono routes.

## 1. Responsibilities

### `@pounce/kit`
- **`api` Client (Frontend)**: Handles all outgoing requests from the browser — request/response and streaming.
- **`.stream()` on `ApiClientInstance`**: Same as `.get()` but with a persistent callback. Uses `fetch()` + `ReadableStream` (not `EventSource`) so it shares URL construction, interceptor chain, and executor with the rest of the api client. Returns a cleanup function. No-op during SSR.

### `@pounce/board`
- **Server API**: Implements file-based route definitions (`defineRoute`).
- **Stream Routes**: `defineStreamRoute` — a companion to `defineRoute` that produces a `Response` with `Content-Type: text/event-stream` and a `ReadableStream` body. Integrates with the middleware stack (auth, logging, CORS) but bypasses `runMiddlewares`' JSON serialization.
- **SSR Integration**: The `api` client when running on the server dispatches directly without network overhead (unchanged).

### Out of scope for board
- **MCP Endpoints**: `/mcp`, `/sse`, `/message` are stateful session-keyed transports. They stay as imperative Hono routes mounted alongside `createPounceMiddleware()`.

## 2. Implementation Steps

### Phase 1: Kit/Board SSE Abstractions

1. **Kit: `api().stream()`**
   - Add `.stream<T>(onMessage, onError?)` to `ApiClientInstance`
   - Implementation: builds a `Request` the same way `.get()` does, runs interceptors, then reads `response.body` as a `ReadableStream`, parses SSE `data:` frames, calls `onMessage(parsed)` for each
   - Returns `() => void` (aborts via `AbortController`)
   - During SSR: no-op / throws

2. **Board: `defineStreamRoute`**
   - New export from `packages/board/src/lib/http/stream.ts`
   - Signature: `defineStreamRoute((context, send) => cleanup)`
   - `send(data)` writes an SSE frame to the stream
   - Returns a raw `Response` with `text/event-stream` content type
   - `runMiddlewares` detects when a handler returns a `Response` directly (vs structured `{ status, data }`) and skips JSON serialization — small change to `core.ts`

### Phase 2: Marc Backend Migration (Board)

1. **Express → Hono**: Replace Express with a Hono app
2. **Board middleware**: Mount `createPounceMiddleware()` for file-based API routes (no SSR needed — marc is a pure API server, so skip SSR injection)
3. **MCP transports**: Keep as imperative Hono routes (`app.post('/mcp', ...)`, `app.get('/sse', ...)`, `app.post('/message', ...)`) — unchanged logic, just ported from Express to Hono
4. **File-based routes**: Extract stateless REST endpoints into domain-grouped route files (see §3.2)
5. **Stream route**: `/api/stream` uses `defineStreamRoute` — and should be improved from poll+snapshot to push-based deltas (see §3.2 notes)

### Phase 3: Marc Frontend Migration (Kit)

1. Replace all `fetch()` calls in `marc/src/state.ts` with `api('/...').get()` / `.post()`
2. Replace `new EventSource('/api/stream')` with `api('/api/stream').stream<T>(cb)`

### Phase 4: Testing

1. **Board unit tests**: `defineStreamRoute` produces correct SSE responses
2. **Kit unit tests**: `.stream()` parses SSE frames, calls `onMessage`, cleans up on abort
3. **Marc integration tests**: Hono routes return correct data, stream route pushes events, MCP transports survive the Express→Hono migration

---

## 3. Concrete Technical Implementation Plan

### 3.1. `@pounce/kit` & `@pounce/board` SSE Support

**`@pounce/kit` — `.stream()` on `ApiClientInstance`:**

*   **Target File**: `packages/kit/src/api/base-client.ts`
*   **Action**:
    1. Augment `ApiClientInstance` interface:
       ```ts
       stream<T>(onMessage: (data: T) => void, onError?: (err: Error) => void): () => void
       ```
    2. Implement within `createApiClientFactory`:
       - Build `Request` using the same URL construction as `.get()` (template interpolation, origin resolution)
       - Run through the interceptor chain (`runInterceptors`)
       - Instead of `await response.json()`: read `response.body` as `ReadableStream`, parse SSE `data:` lines, `JSON.parse` each, call `onMessage`
       - Wire an `AbortController` — the returned cleanup function calls `controller.abort()`
       - During SSR: throw or no-op (SSE has no meaning server-side)
*   **Target File**: `packages/kit/docs/api.md`
*   **Action**: Document `.stream()`.

**`@pounce/board` — `defineStreamRoute`:**

*   **Target File**: `packages/board/src/lib/http/stream.ts` (New)
*   **Action**: Create and export `defineStreamRoute`:
    ```ts
    type StreamCleanup = () => void
    type StreamHandler = (
      context: RequestContext,
      send: <T>(data: T) => void
    ) => StreamCleanup

    export function defineStreamRoute(handler: StreamHandler): RouteHandler
    ```
    Under the hood: creates a `ReadableStream`, returns a `Response` with `Content-Type: text/event-stream` and appropriate cache/connection headers. `send()` enqueues `data: ${JSON.stringify(data)}\n\n` frames. Cleanup is called when the stream is cancelled (client disconnect).

*   **Target File**: `packages/board/src/lib/http/core.ts`
*   **Action**: Modify `runMiddlewares` — when the handler result is already a `Response` instance (detected via `instanceof Response`), return it directly instead of serializing `{ status, data }` to JSON. This is the minimal change that lets stream routes integrate with the middleware stack.

*   **Target File**: `packages/board/src/index.ts`
*   **Action**: Export `defineStreamRoute`.

### 3.2. Migrating `marc` Backend (Express → Hono + Board)

**Core Server Setup:**
*   **Target File**: `marc/server/index.ts`
*   **Action**:
    1. Remove `express`, `cors`, current routing
    2. Instantiate a `Hono` app
    3. Mount `createPounceMiddleware({ routesDir: './server/routes' })`
    4. Configure `serveStatic` for the UI dist folder
    5. Mount MCP transports as imperative Hono routes (not `defineRoute`):
       - `app.post('/mcp', ...)` / `app.get('/mcp', ...)` / `app.delete('/mcp', ...)` — StreamableHTTPServerTransport
       - `app.get('/sse', ...)` — SSEServerTransport
       - `app.post('/message', ...)` — SSE message relay
       These are stateful (session-keyed transport maps) and cannot be file-based routes.

**Domain-Grouped Route Files:**

Group by domain rather than one-file-per-endpoint:

*   `marc/server/routes/api/messages/index.ts` — `get()`: all messages; plus `messages/[target].ts` — `get()`: messages for target
*   `marc/server/routes/api/agents/index.ts` — `get()`: list all agents; exports for sync, join, part, dismiss, users operations
*   `marc/server/routes/api/content/index.ts` — post, errata, topic, briefing (GET & POST)
*   `marc/server/routes/api/shell-channels/index.ts` — CRUD + start/stop/input
*   `marc/server/routes/api/stream.ts` — `defineStreamRoute` for dashboard SSE

**SSE Improvement (push-based deltas):**

The current `/api/stream` polls `allMessages()` every 2s and diffs JSON snapshots. Since we're rewriting the server, improve to push-based:
- `store.ts` emits events when `post()`, `errata()`, `join()`, etc. are called
- Stream route pushes only the delta (new message, edit, deletion)
- Frontend applies deltas to the reactive `messages` array instead of replacing the entire list

### 3.3. Migrating `marc` Frontend (Fetch → Kit API)

**State Synchronization & Actions:**
*   **Target File**: `marc/src/state.ts`
*   **Action**:
    1. Import `api` from `@pounce/kit`
    2. Replace all `fetch('/api/...')` calls with `api('/api/...').get()` / `.post()`. Remove manual `res.ok` checks and JSON parsing.
    3. In `subscribeAll()`, replace `new EventSource('/api/stream')` with `api('/api/stream').stream<Delta>(delta => applyDelta(delta))`. The returned cleanup function replaces `source.close()`.

### 3.4. Testing Strategy

*   **Board SSE unit tests** (`packages/board/src/lib/http/stream.spec.ts`):
    - `defineStreamRoute` produces `Response` with correct headers
    - `send()` writes valid SSE frames
    - Cleanup is called on stream cancel
    - Middleware stack runs before the stream opens

*   **Kit `.stream()` unit tests** (`packages/kit/src/api/base-client.spec.ts`):
    - Parses SSE `data:` frames correctly
    - Calls `onMessage` for each frame
    - Cleanup aborts the connection
    - Interceptors run before streaming starts
    - Throws/no-ops during SSR

*   **Marc integration tests** (`marc/server/routes/*.spec.ts`):
    - Hono routes return correct JSON for each endpoint
    - Stream route pushes delta events
    - MCP transports (Streamable HTTP + SSE) work under Hono
