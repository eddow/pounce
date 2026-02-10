# @pounce/kit

Application-level toolkit for [Pounce](https://github.com/eddow/pounce) apps — reactive client state, routing, API client, CSS injection, localStorage persistence, and Intl formatting.

## Entry Points

| Import | Purpose |
|--------|---------|
| `@pounce/kit` | Auto-selects DOM (browser) or Node (SSR) |
| `@pounce/kit/dom` | Browser: real DOM listeners, fetch API, `stored()` |
| `@pounce/kit/node` | SSR: ALS-backed client proxy, server dispatch |
| `@pounce/kit/intl` | Intl formatting components (tree-shakable) |

## Quick Start

```tsx
import { client, Router, A, css } from '@pounce/kit'

const routes = [
  { path: '/', view: () => <h1>Home</h1> },
  { path: '/about', view: () => <h1>About</h1> },
]

function App() {
  return <>
    <nav>
      <A href="/">Home</A>
      <A href="/about">About</A>
    </nav>
    <Router routes={routes} notFound={() => <h1>404</h1>} />
  </>
}
```

## Features

- **Reactive client** — URL, viewport, focus, visibility, language, timezone, direction, online, `prefersDark`
- **Router** — `[param:format]`, `[...catchAll]`, optional query params, custom format registry
- **API client** — interceptors, SSR hydration, middleware, retry
- **CSS injection** — `css`/`sass`/`scss` template tags, SSR collection
- **localStorage** — `stored()` with inter-tab sync and reactive cleanup
- **Intl** — `<Number>`, `<Date>`, `<RelativeTime>`, `<List>`, `<Plural>`, `<DisplayNames>`

## Documentation

See [`docs/`](./docs/README.md) for full guides.

## License

MIT
