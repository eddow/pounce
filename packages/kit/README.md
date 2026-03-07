# @pounce/kit

Application-level toolkit for [Pounce](https://github.com/eddow/pounce) apps — reactive client state, routing, API client, CSS injection, localStorage persistence, and Intl formatting.

## Entry Points

| Import | Purpose |
|--------|---------|
| `@pounce/kit` | Auto-selects DOM (browser) or Node (SSR) |
| `@pounce/kit/dom` | Browser: real DOM listeners, fetch API, `stored()` |
| `@pounce/kit/node` | Node: ALS-backed request context, file-based routing helpers, storage stub |
| `@pounce/kit/intl` | Intl formatting components (separate entry) |

## Quick Start

```tsx
import { client, Router, css } from '@pounce/kit'

const routes = [
  { path: '/', view: () => <h1>Home</h1> },
  { path: '/about', lazy: () => import('./about').then((mod) => mod.default) },
]

function App() {
  return <>
    <nav>
      <button onClick={() => client.navigate('/')}>Home</button>
      <button onClick={() => client.navigate('/about')}>About</button>
    </nav>
    <Router
      routes={routes}
      loading={({ route }) => <p>Loading {route.path}…</p>}
      notFound={() => <h1>404</h1>}
    />
  </>
}
```

## Features

- **Reactive client** — URL, viewport, focus, visibility, language, timezone, direction, online, `prefersDark`
- **Router** — `[param:format]`, `[...catchAll]`, optional query params, custom format registry, lazy route modules with route-level loading/error UI and link-driven module prefetch
- **API client** — interceptors, SSR hydration, middleware, retry, short-lived shared GET prefetch via `prefetch()`
- **CSS injection** — `css`/`sass`/`scss` template tags, SSR collection
- **Head management** — `<Head>` and `useHead()` with additive DOM mounting and SSR collection through board
- **localStorage** — `stored()` with inter-tab sync and reactive cleanup
- **Intl** — `<Number>`, `<Date>`, `<RelativeTime>`, `<List>`, `<Plural>`, `<DisplayNames>` from `@pounce/kit/intl`

## Head Management

```tsx
import { Head } from '@pounce/kit'

function App() {
  return <>
    <Head>
      <title>Pounce App</title>
      <link rel="canonical" href="https://example.com/app" />
    </Head>
    <main>...</main>
  </>
}
```

- `<Head>` mounts additive content into `document.head` in the browser
- `useHead()` exposes the same behavior imperatively and returns a cleanup function
- during board SSR, collected head HTML is injected into the final `<head>` together with hydration payloads
- do not use `latch(document.head, ...)` for kit head management; `latch()` owns and replaces the whole target

## Intl Entry

Intl intentionally stays on `@pounce/kit/intl` rather than the shared kit barrel.

- it is an optional subsystem
- it is cross-environment, not part of the platform bootstrap surface
- consumers that only want Intl formatting should not import the rest of kit's app/runtime entry by accident

## Documentation

See [`docs/`](./docs/README.md) for full guides.

## License

MIT
