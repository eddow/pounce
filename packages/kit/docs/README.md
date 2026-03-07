# @pounce/kit Documentation

Application-level toolkit for Pounce apps — reactive client state, routing, API client, CSS injection, localStorage persistence, and Intl formatting.

## Guides

- **[Client State](./client.md)** — Reactive browser state (`client.url`, `client.viewport`, `client.direction`, etc.)
- **[Router](./router.md)** — Route parsing, matching, building, and `<Router>`
- **[API Client](./api.md)** — HTTP client with interceptors, context hooks, middleware, and retry
- **[DOM Utilities](./dom.md)** — CSS injection (`css`/`sass`/`scss` tags), `stored()` localStorage, DOM client bootstrap
- **[SSR & Node](./node.md)** — `AsyncLocalStorage` request context, node storage stub, file-based routing
- **[Intl Components](./intl-components.md)** — `<Intl.Number>`, `<Intl.Date>`, `<Intl.RelativeTime>`, `<Intl.List>`, `<Intl.Plural>`, `<Intl.DisplayNames>`

Head management lives on the shared kit surface via `<Head>` and `useHead()`. DOM mounting is additive in the browser, and board SSR injects collected head HTML into the final document head.

## Entry Points

```typescript
// Browser (auto-selected by package.json exports)
import { client, api, Router, css } from '@pounce/kit'

// Explicit browser
import { client, api, Router, css, stored } from '@pounce/kit/dom'

// Node helpers
import { runWithContext, serverRouter, stored } from '@pounce/kit/node'

// Intl formatting (separate entry)
import * as Intl from '@pounce/kit/intl'
```

## Quick Start

```tsx
import { client, Router, css } from '@pounce/kit'

css`.nav { display: flex; gap: 1rem; }`

const routes = [
  { path: '/', view: () => <h1>Home</h1> },
  { path: '/about', view: () => <h1>About</h1> },
]

function App() {
  return <>
    <nav class="nav">
      <button onClick={() => client.navigate('/')}>Home</button>
      <button onClick={() => client.navigate('/about')}>About</button>
      <span>Language: {client.language}</span>
    </nav>
    <Router routes={routes} notFound={() => <h1>404</h1>} />
  </>
}
```
