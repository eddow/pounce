# Client State

The `client` singleton is a **reactive object** (via `mutts`) that mirrors browser state. All properties are reactive — reading them inside an `effect()` or JSX expression creates a live subscription.

## Interface

```typescript
interface ClientState {
  url: ClientUrl           // Current URL (href, pathname, search, hash, segments, query)
  viewport: ClientViewport // { width, height } — window inner dimensions
  history: ClientHistoryState // { length }
  focused: boolean         // document.hasFocus()
  visibilityState: 'visible' | 'hidden'
  devicePixelRatio: number
  online: boolean          // navigator.onLine
  language: string         // navigator.language (canonical locale source)
  timezone: string         // Intl.DateTimeFormat().resolvedOptions().timeZone
  direction: 'ltr' | 'rtl' // <html dir> attribute, auto-detected
}

interface Client extends ClientState {
  navigate(to: string | URL, options?: NavigateOptions): void
  replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void
  reload(): void
  dispose(): void
  prefersDark(): boolean
}
```

## Usage

```tsx
import { client } from '@pounce/kit'

// Reactive — updates automatically when URL changes
<span>{client.url.pathname}</span>

// Programmatic navigation
client.navigate('/dashboard')
client.replace('/login')

// Reactive viewport
<div if={client.viewport.width < 768}>Mobile layout</div>

// Direction (auto-detected from <html dir>)
<div style={`direction: ${client.direction}`}>...</div>
```

## How It Works

### Browser (`dom/client.ts`)

On import, the DOM entry point:
1. Binds the reactive `client` singleton via `setClient()`
2. Synchronizes all properties from the real browser state
3. Registers event listeners: `popstate`, `hashchange`, `resize`, `focus`, `blur`, `visibilitychange`, `online`, `offline`, `languagechange`
4. Intercepts `history.pushState` and `history.replaceState` to keep `client.url` in sync
5. Observes `<html dir>` via `MutationObserver` for `client.direction`

All listeners are tracked for cleanup via `client.dispose()`.

### SSR (`node/client.ts`)

The Node entry point creates an `AsyncLocalStorage`-backed proxy. Each SSR request gets an isolated `createClientInstance()` with sensible defaults (1920×1080 viewport, `'en-US'` language, `'ltr'` direction). Navigation methods throw in SSR context.

```typescript
import { runWithClient } from '@pounce/kit/node'

runWithClient((client) => {
  // client is isolated to this execution context
  console.log(client.url.pathname)
}, { url: 'http://example.com/page' })
```

## `ClientUrl`

```typescript
interface ClientUrl {
  readonly href: string
  readonly origin: string
  readonly pathname: string
  readonly search: string
  readonly hash: string
  readonly segments: readonly string[]  // pathname split by '/'
  readonly query: Record<string, string> // parsed search params
}
```

The `segments` and `query` fields are pre-parsed for convenience — no need to manually split or use `URLSearchParams`.
