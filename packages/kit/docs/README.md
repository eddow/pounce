# @pounce/kit Documentation

Application-level toolkit for Pounce apps — reactive client state, routing, API client, CSS injection, localStorage persistence, and Intl formatting.

## Guides

- **[Client State](./client.md)** — Reactive browser state (`client.url`, `client.viewport`, `client.direction`, etc.)
- **[Router](./router.md)** — Route parsing, matching, building, `<Router>` and `<A>` components
- **[API Client](./api.md)** — HTTP client with interceptors, SSR hydration, middleware
- **[DOM Utilities](./dom.md)** — CSS injection (`css`/`sass`/`scss` tags), `stored()` localStorage, DOM client bootstrap
- **[SSR & Node](./node.md)** — Server-side rendering, `AsyncLocalStorage` isolation, file-based routing
- **[Intl Components](./intl-components.md)** — `<Intl.Number>`, `<Intl.Date>`, `<Intl.RelativeTime>`, `<Intl.List>`, `<Intl.Plural>`, `<Intl.DisplayNames>`

## Entry Points

```typescript
// Browser (auto-selected by package.json exports)
import { client, api, Router, A, css, stored } from '@pounce/kit'

// Explicit browser
import { client, api, Router, A, css, stored } from '@pounce/kit'

// SSR / Node
import { client, api, withSSR, serverRouter } from '@pounce/kit/node'

// Intl formatting (separate entry — tree-shakable)
import * as Intl from '@pounce/kit/intl'
```

## Quick Start

```tsx
import { client, Router, A, css } from '@pounce/kit'

css`.nav { display: flex; gap: 1rem; }`

const routes = [
  { path: '/', view: () => <h1>Home</h1> },
  { path: '/about', view: () => <h1>About</h1> },
]

function App() {
  return <>
    <nav class="nav">
      <A href="/">Home</A>
      <A href="/about">About</A>
      <span>Language: {client.language}</span>
    </nav>
    <Router routes={routes} notFound={() => <h1>404</h1>} />
  </>
}
```
