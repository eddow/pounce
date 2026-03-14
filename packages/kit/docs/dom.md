# DOM Utilities

Browser-specific utilities exported from `@sursaut/kit/dom` (or `@sursaut/kit` in browser context).

## Head Management

Use kit's shared `<Head>` component or `useHead()` helper to mount document head content.

```tsx
import { Head, useHead } from '@sursaut/kit'

function Page() {
  return <>
    <Head>
      <title>Dashboard</title>
      <meta property="og:title" content="Dashboard" />
    </Head>
    <main>...</main>
  </>
}

const stop = useHead(<link rel="canonical" href="https://example.com/dashboard" />)
stop()
```

Notes:

- head content is mounted additively into `document.head`
- multiple `<Head>` instances compose without replacing one another
- reactive bindings inside `<Head>` update in place like normal kit content
- do not use `latch(document.head, ...)` for kit-managed head content; `latch()` owns and replaces the whole target element

## CSS Injection

Kit provides template tag functions for inline CSS that are processed by the Vite plugin at build time.

### `css`, `sass`, `scss`

```typescript
import { css, sass, scss } from '@sursaut/kit'

// Plain CSS
css`.my-class { color: red; }`

// SASS (indented syntax also works)
sass`
.container
  color: blue
  &:hover
    color: red
`

// SCSS
scss`
.container {
  color: blue;
  &:hover { color: red; }
}
`
```

At build time, the Vite plugin replaces these calls with processed CSS + `__injectCSS()`. At runtime, CSS is:
1. Hashed (DJB2) for deduplication
2. Grouped by caller file into `<style data-vite-css-id="...">` tags
3. Appended to `<head>`

### `componentStyle` / `baseStyle`

Flavored variants (via `mutts.flavored()`) for `@layer` scoping:

```typescript
import { componentStyle, baseStyle } from '@sursaut/kit'

// Wrapped in @layer sursaut.components by the Vite plugin
componentStyle.sass`
.sursaut-button
  padding: 0.5rem 1rem
`

// Wrapped in @layer sursaut.base
baseStyle.css`.sursaut-reset { box-sizing: border-box; }`
```

### SSR CSS Collection

```typescript
import { getSSRStyles } from '@sursaut/kit'

// Returns <style data-hydrated-hashes="...">...</style> for injection into <head>
const styleTag = getSSRStyles()
```

On client hydration, pre-existing hashes are detected from the `data-hydrated-hashes` attribute to avoid duplicate injection.

### IDE Support

For syntax highlighting in template literals, install the [es6-string-html](https://open-vsx.org/extension/Tobermory/es6-string-html) extension. It auto-detects `css`, `sass`, and `scss` tags.

## `stored()` — Reactive localStorage

Creates a reactive object synced to `localStorage` with inter-tab communication.

```typescript
import { stored } from '@sursaut/kit/dom'

const prefs = stored({
  theme: 'light',
  fontSize: 14,
  sidebar: true,
})

// Read (reactive — works in effects and JSX)
<span>{prefs.theme}</span>

// Write (auto-persisted to localStorage)
prefs.theme = 'dark'

// Inter-tab: changes in other tabs are reflected automatically via StorageEvent
```

### How It Works

1. On creation, reads existing values from `localStorage` (falls back to `initial` defaults)
2. Each key gets an `effect()` that writes to `localStorage` on change
3. Listens to `window.storage` events for cross-tab sync
4. Returns a `cleanedBy()` object — effects and listener are cleaned up when the owner is disposed

### Custom Serialization

```typescript
import { json } from '@sursaut/kit/dom'

// Override the global JSON parser/serializer
json.parse = (value) => myCustomParse(value)
json.stringify = (value) => myCustomStringify(value)
```

## Node Stubs

In the Node entry point (`@sursaut/kit/node`), `css`, `sass`, and `scss` are exported as no-ops. This allows shared code to import them without errors in SSR context.
