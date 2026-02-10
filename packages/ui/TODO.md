# @pounce/ui TODO

## Future Components

### Intl Components (Internationalization)

Create components that leverage `DisplayContext.locale` for proper internationalization using the Intl JavaScript API:

#### `<Intl.Date>`
```typescript
// Format dates according to locale
<Intl.Date value={new Date()} format="long" />
// Uses locale.toLocaleDateString() internally
```

#### `<Intl.Number>`
```typescript
// Format numbers according to locale
<Intl.Number value={1234.56} style="currency" currency="USD" />
// Uses Intl.NumberFormat internally
```

#### `<Intl.List>`
```typescript
// Format lists according to locale
<Intl.List items={['apples', 'oranges', 'bananas']} type="conjunction" />
// Uses Intl.ListFormat internally
// Output: "apples, oranges, and bananas" (en-US)
// Output: "apples, oranges et bananas" (fr-FR)
```

#### `<Intl.RelativeTime>`
```typescript
// Format relative time according to locale
<Intl.RelativeTime value={-3} unit="day" />
// Output: "3 days ago" (en-US)
// Output: "il y a 3 jours" (fr-FR)
```

#### `<Intl.Plural>`
```typescript
// Handle pluralization according to locale rules
<Intl.Plural value={count} one="1 item" other="{count} items" />
// Uses Intl.PluralRules internally
```

### Implementation Notes

- All components should use `useDisplayContext()` to get current locale
- Fall back to browser locale if no DisplayContext provided
- Support all Intl API options (style, currency, notation, etc.)
- Provide reactive updates when locale changes
- Consider caching formatters for performance

### Example Usage

```typescript
import { DisplayProvider, Intl } from '@pounce/ui'

const App = () => {
  const [locale, setLocale] = signal('en-US')
  
  return (
    <DisplayProvider locale={locale.value}>
      <select onChange={(e) => setLocale(e.target.value)}>
        <option value="en-US">English (US)</option>
        <option value="fr-FR">Français</option>
        <option value="ar-SA">العربية</option>
      </select>
      
      <Intl.Date value={new Date()} format="long" />
      <Intl.Number value={1234.56} style="currency" currency="USD" />
      <Intl.List items={['apples', 'oranges']} type="conjunction" />
    </DisplayProvider>
  )
}
```

## Icon System Enhancements

### Icon Mirroring for RTL

Icon libraries should support directional icons that flip in RTL contexts:

```typescript
// Icon library adapter with RTL support
const glyfAdapter = {
  iconFactory: (name, size, context) => {
    // Logical icon names (forward/backward instead of left/right)
    const iconName = context.direction === 'rtl' 
      ? mirrorIcon(name)  // arrow-forward → arrow-backward
      : name
    
    return <GlyfIcon name={iconName} size={size} />
  }
}
```

This is an **icon-library concern**, not a core UI concern. Each icon library adapter can implement mirroring as needed.

## DisplayProvider Hierarchy

### Root vs Nested Providers

Every `DisplayProvider` sets `data-theme` (and `dir`, `lang`) **on its own DOM element** — never on `<html>`.
CSS `[data-theme="dark"]` cascades naturally to children, and re-entrance works without conflicts.

```
System defaults (OS theme, browser locale, document dir)
  └─ Root DisplayProvider  ← reads system defaults as its "parent"
       ├─ data-theme="dark" on itself
       ├─ children inherit
       └─ Nested DisplayProvider  ← defaults to "auto" (inherit from parent)
            ├─ data-theme="light" on itself (override)
            └─ children see "light"
```

### `auto` Resolution

All display axes default to `'auto'`:
- **`auto` theme** → resolved from parent provider, or system `prefers-color-scheme` at root
- **`auto` direction** → resolved from parent, or `document.dir` / `'ltr'` at root
- **`auto` locale** → resolved from parent, or `navigator.language` at root

The root provider has no parent — it resolves `auto` from `@pounce/kit`'s `system.*` reactive values.

### DisplayProvider Props

```typescript
type DisplayProviderProps = {
  theme?: string | 'auto'       // default: 'auto'
  direction?: 'ltr' | 'rtl' | 'auto'  // default: 'auto'
  locale?: string | 'auto'     // default: 'auto'
  children: JSX.Children
}
```

### Context Shape

```typescript
type DisplayContext = {
  /** Resolved theme (never 'auto' — always the concrete value) */
  theme: string
  /** Raw theme setting ('auto' | 'light' | 'dark' | custom) */
  themeSetting: string
  /** Resolved direction */
  direction: 'ltr' | 'rtl'
  /** Resolved locale */
  locale: string
  /** Update theme setting for this provider */
  setTheme: (theme: string) => void
}
```

Components always read `theme` (resolved). The toggle reads `themeSetting` to know if it's `auto` and writes via `setTheme`.

## ThemeToggle Component

### Design

A single `ThemeToggle` component with a split-button UX:

- **Main button**: toggles between `dark` ↔ `light` (quick toggle)
- **Dropdown arrow** (small, bottom-right): opens submenu with `dark` / `light` / `auto`

### Visual States (4)

| `themeSetting` | Resolved | Icon | Label |
|---|---|---|---|
| `'dark'` | dark | moon | "Dark" |
| `'light'` | light | sun | "Light" |
| `'auto'` | dark | moon + auto badge | "Auto (Dark)" |
| `'auto'` | light | sun + auto badge | "Auto (Light)" |

### Props

```typescript
type ThemeToggleProps = {
  /** Custom icons per theme. Default: sun/moon from adapter iconFactory */
  icons?: Record<string, JSX.Element | string>
  /** Custom labels per theme */
  labels?: Record<string, string>
  /** Label for the 'auto' option. Default: "Auto" */
  autoLabel?: string
  /** Hide the dropdown arrow (force simple toggle, no auto option) */
  simple?: boolean
  /** Additional themes beyond dark/light for the dropdown */
  themes?: string[]
}
```

### Integration

```typescript
const App = () => {
  return (
    <DisplayProvider>           {/* root: reads system defaults */}
      <ThemeToggle />           {/* reads/writes via useDisplayContext() */}
      <Button>Themed</Button>
    </DisplayProvider>
  )
}
```

With persistence (app-level concern):
```typescript
const App = () => {
  const prefs = stored({ theme: 'auto' })

  return (
    <DisplayProvider theme={prefs.theme} onThemeChange={(t) => prefs.theme = t}>
      <ThemeToggle />
      <Button>Themed</Button>
    </DisplayProvider>
  )
}
```

### Implementation Order

1. `DisplayProvider` + `useDisplayContext()` — foundation (depends on `@pounce/kit` system values)
2. `ThemeToggle` — consumer of the context
3. Tests for both

## Pico Native Features — Leverage Analysis

pico-tee identified 9 native Pico features we're not leveraging. Each is categorised as:
- **UI engine** — pounce/ui should expose a prop/component; adapter maps it to Pico's native mechanism
- **Adapter-only** — Pico-specific; adapter handles it, UI engine doesn't need to know
- **New component** — needs a new UI component

### Adapter-only features (pico-tee)

- **`data-tooltip` / `data-placement`** — Pure-CSS tooltips. Users pass via `el={}`. Document in adapter README.
- **`role="group"` native styling** — Pico v2 styles `<fieldset role="group">`. Bridge CSS can map `.pounce-buttongroup`. Low priority.
- **`<nav>` styling** — Rich `<nav>` layout. Document native usage in README.
- **`data-theme` scoping** — ✅ Already planned via DisplayProvider. Verify nested `[data-theme]` works.

### New future components

- **Card** (`<article>`) — header/body/footer slots. Pico styles `<article>` natively.
- **Progress** (`<progress>`) — determinate + indeterminate. Pico styles natively.
- **Accordion** (`<details name="...">`) — exclusive-open groups. Pico styles natively. Different from Multiselect (disclosure vs selection).

### UI engine — Form Validation & Loading States

> **TODO**: This is a significant topic that deserves its own design pass. See dedicated section below.

Covers: `loading` prop (Button + interactive components), `valid` prop (form controls), error messages, `aria-busy`, `aria-invalid`, adapter styling hooks. Triggered by Pico's native support for these ARIA attributes.

## Form Validation & Loading States

> **STATUS: TODO — needs design pass before implementation**

This is a cross-cutting concern that touches Button, all form controls, and potentially any interactive component. Pico styles `aria-busy` (spinner) and `aria-invalid` (red/green borders) natively, but the UI engine should support these universally.

### Scope

1. **`loading` on Button** — `aria-busy="true"` + disabled. Adapter provides spinner styling.
2. **`valid` on form controls** — `aria-invalid="true|false"`. Adapter provides border colours.
3. **Error message display** — where/how to render validation messages (inline, below field, toast?)
4. **Form-level validation** — coordinating field-level `valid` with form submission
5. **Adapter hooks** — what adapters need to provide (spinner CSS, valid/invalid colours, error message styling)

### Open Questions

- Should `loading` also suppress `onClick` or just set `disabled`?
- Should `valid` accept `'error' | 'warning' | 'success'` instead of boolean? (richer than just valid/invalid)
- How does this interact with `variant`? (e.g. a `danger` button that's also `loading`)
- Should there be a `<FormField>` wrapper that handles label + input + error message layout?
- Integration with validation libraries (arktype, zod) — should we provide helpers?

## Display Context — Future Extensions

```typescript
// Future additions to DisplayContext:
fontSize?: 'small' | 'medium' | 'large'
contrast?: 'normal' | 'high'
reducedMotion?: boolean
density?: 'compact' | 'comfortable' | 'spacious'
```
