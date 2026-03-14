# Client State

The `client` singleton is a **reactive object** (via `mutts`) that mirrors browser state. All properties are reactive — reading them inside an `effect()` or JSX expression creates a live subscription.

## Interface

```typescript
interface ClientState {
  url: ClientUrl           // Current URL (href, pathname, search, hash, segments, query)
  viewport: ClientViewport // { width, height } — window inner dimensions
  history: ClientHistoryState // { length, navigation }
  focused: boolean         // document.hasFocus()
  visibilityState: 'visible' | 'hidden'
  devicePixelRatio: number
  online: boolean          // navigator.onLine
  language: string         // navigator.language (canonical locale source)
  timezone: string         // Intl.DateTimeFormat().resolvedOptions().timeZone
  direction: 'ltr' | 'rtl' // <html dir> attribute, auto-detected
  prefersDark: boolean
}

interface Client extends ClientState {
  navigate(to: string | URL, options?: NavigateOptions): void
  replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void
  reload(): void
  dispose(): void
}
```

## Usage

```tsx
import { client } from '@sursaut/kit'

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
1. Installs the DOM platform via `setPlatform()`
2. Synchronizes all properties from the real browser state
3. Registers event listeners: `popstate`, `hashchange`, `resize`, `focus`, `blur`, `visibilitychange`, `online`, `offline`, `languagechange`
4. Intercepts `history.pushState` and `history.replaceState` to keep `client.url` in sync and label the navigation kind
5. Observes `<html dir>` via `MutationObserver` for `client.direction`

All listeners are tracked for cleanup via `client.dispose()`.

### Node / SSR

The shared `client` proxy still exists in node/SSR contexts, but request-scoped installation is the responsibility of the consuming server framework. Kit itself exports the ALS request-context helper in `@sursaut/kit/node` via `runWithContext()`.

```typescript
import { createScope, runWithContext } from '@sursaut/kit/node'

const scope = createScope({ timeout: 5000 })
scope.origin = 'http://example.com'

await runWithContext(scope, async () => {
  // request-scoped API config/interceptors live here
})
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
