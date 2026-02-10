# Intl Formatting Components

## Summary

Add reactive JSX components to `@pounce/kit` that wrap the browser's `Intl` APIs, providing locale-aware formatting for numbers, dates, lists, relative time, and more. These components read the locale from the reactive `client.language` (or a scoped override via `DisplayProvider`) and re-render automatically when it changes.

## Motivation

Formatting numbers, dates, and lists is a universal need. The browser's `Intl` namespace already provides excellent locale-aware formatters — but using them in JSX is verbose:

```tsx
// Without Intl components — manual, non-reactive, repetitive
<span>{new Intl.NumberFormat(client.language, { style: 'currency', currency: 'EUR' }).format(price)}</span>
```

We want:

```tsx
// With Intl components — declarative, reactive, concise
<Intl.Number value={price} style="currency" currency="EUR" />
```

## Design Principles

1. **Thin wrappers** — each component maps 1:1 to an `Intl.*Format` API. No invented abstractions.
2. **Reactive** — re-formats when `value` or `locale` changes (via mutts reactivity).
3. **Locale cascade** — uses `client.language` by default, can be overridden per-component via `locale` prop, or per-subtree via `DisplayProvider` (from `@pounce/ui`).
4. **SSR-safe** — `Intl` APIs are available in Node.js. No DOM dependency.
5. **Tree-shakable** — each component is an independent export.

## System-Level Additions to `client`

Before the components, kit needs a `direction` field on the client state:

```typescript
// client/types.ts — additions
export interface ClientState {
  // ... existing fields ...
  language: string    // already exists — serves as locale
  timezone: string    // already exists
  direction: 'ltr' | 'rtl'  // NEW — auto-detected from <html dir>
}
```

Auto-detection in `dom/client.ts`:
```typescript
// Detect direction from <html dir> attribute
client.direction = (document.documentElement.dir as 'rtl' | 'ltr') || 'ltr'

// Observe changes via MutationObserver
const observer = new MutationObserver(() => {
  client.direction = (document.documentElement.dir as 'rtl' | 'ltr') || 'ltr'
})
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] })
```

> **Note**: `client.language` already exists and is the canonical locale source. We do NOT add a separate `system.locale` — that would duplicate state. The display-context architecture doc's `system.locale` maps directly to `client.language`.

## Component API

All components live in `@pounce/kit` (shared entry point — no DOM dependency since `Intl` is universal).

### `<Intl.Number>`

Wraps `Intl.NumberFormat`.

```tsx
interface IntlNumberProps extends Intl.NumberFormatOptions {
  value: number | bigint
  locale?: string  // override client.language
}

// Usage
<Intl.Number value={1234.56} />
// → "1,234.56" (en-US)

<Intl.Number value={price} style="currency" currency="EUR" />
// → "€1,234.56"

<Intl.Number value={0.75} style="percent" />
// → "75%"

<Intl.Number value={1000000} notation="compact" />
// → "1M"
```

### `<Intl.Date>`

Wraps `Intl.DateTimeFormat`.

```tsx
interface IntlDateProps extends Intl.DateTimeFormatOptions {
  value: Date | number | string
  locale?: string
}

// Usage
<Intl.Date value={new Date()} dateStyle="long" />
// → "February 9, 2026"

<Intl.Date value={event.start} dateStyle="short" timeStyle="short" />
// → "2/9/26, 9:24 PM"

<Intl.Date value={timestamp} hour="numeric" minute="numeric" hour12={false} />
// → "21:24"
```

### `<Intl.RelativeTime>`

Wraps `Intl.RelativeTimeFormat`.

```tsx
interface IntlRelativeTimeProps extends Intl.RelativeTimeFormatOptions {
  value: number
  unit: Intl.RelativeTimeFormatUnit  // 'second' | 'minute' | 'hour' | 'day' | ...
  locale?: string
}

// Usage
<Intl.RelativeTime value={-3} unit="day" />
// → "3 days ago"

<Intl.RelativeTime value={2} unit="hour" numeric="auto" />
// → "in 2 hours"
```

### `<Intl.List>`

Wraps `Intl.ListFormat`.

```tsx
interface IntlListProps extends Intl.ListFormatOptions {
  value: string[]
  locale?: string
}

// Usage
<Intl.List value={['Alice', 'Bob', 'Charlie']} type="conjunction" />
// → "Alice, Bob, and Charlie"

<Intl.List value={tags} type="disjunction" />
// → "React, Vue, or Svelte"
```

### `<Intl.Plural>`

Wraps `Intl.PluralRules`. Renders children based on plural category.

```tsx
interface IntlPluralProps extends Intl.PluralRulesOptions {
  value: number
  locale?: string
  zero?: JSX.Element
  one?: JSX.Element
  two?: JSX.Element
  few?: JSX.Element
  many?: JSX.Element
  other: JSX.Element  // required fallback
}

// Usage
<Intl.Plural value={count}
  one={<span>{count} item</span>}
  other={<span>{count} items</span>}
/>
```

### `<Intl.DisplayNames>`

Wraps `Intl.DisplayNames`.

```tsx
interface IntlDisplayNamesProps extends Intl.DisplayNamesOptions {
  value: string       // the code to look up
  type: 'language' | 'region' | 'script' | 'currency' | 'calendar' | 'dateTimeField'
  locale?: string
}

// Usage
<Intl.DisplayNames value="fr" type="language" />
// → "French" (en-US) or "français" (fr)

<Intl.DisplayNames value="JP" type="region" />
// → "Japan"

<Intl.DisplayNames value="EUR" type="currency" />
// → "Euro"
```

## Implementation Shape

Each component follows the same pattern:

```typescript
// src/intl/number.tsx
import { cachedNumberFormat } from './cache'
import { resolveLocale } from './locale'

export function Number(props: IntlNumberProps) {
  const { value, locale, ...options } = props
  const fmt = cachedNumberFormat(resolveLocale(locale), options)
  return fmt.format(value)
}
```

Components return **text nodes** (no wrapper elements). If a consumer needs a wrapper, they wrap it themselves: `<span class="price"><Intl.Number ... /></span>`. The `Plural` component is the exception — it returns a `<>fragment</>` since it renders JSX children.

The babel plugin wraps `{fmt.format(value)}` in a getter, so when `value` or `client.language` changes, the text re-renders automatically.

### Formatter Caching

`Intl.*Format` constructors are expensive. We cache formatters by a stable key derived from `(locale, options)`:

```typescript
const cache = new Map<string, Intl.NumberFormat>()

function getNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(options)
  let fmt = cache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options)
    cache.set(key, fmt)
  }
  return fmt
}
```

### Export Structure

```typescript
// src/intl/index.ts
export { Number } from './number'
export { Date } from './date'
export { RelativeTime } from './relative-time'
export { List } from './list'
export { Plural } from './plural'
export { DisplayNames } from './display-names'
```

Consumer usage via namespace import:
```tsx
import * as Intl from '@pounce/kit/intl'
// or
import { Number, Date } from '@pounce/kit/intl'

<Intl.Number value={42} />
```

**Decision**: Separate entry point `@pounce/kit/intl`. Most apps won't need all 6 formatters, and this keeps the main kit bundle lean.

## DisplayProvider Integration

**Decision**: Option B — `setLocaleResolver()` hook.

Kit provides a resolver slot that UI's `DisplayProvider` can plug into:

```typescript
// @pounce/kit/intl/locale.ts
let localeOverride: (() => string | undefined) | null = null

export function setLocaleResolver(resolver: () => string | undefined) {
  localeOverride = resolver
}

export function resolveLocale(explicit?: string): string {
  return explicit ?? localeOverride?.() ?? client.language ?? 'en-US'
}
```

UI's `DisplayProvider` calls `setLocaleResolver(() => displayContext.locale)`. Kit stays independent of UI's scope system.

## Locale Cascade

Locale resolution follows a strict priority:
1. **Explicit `locale` prop** on the component
2. **`setLocaleResolver()` override** (set by UI's DisplayProvider)
3. **`client.language`** (reactive, auto-detected from browser)
4. **`'en-US'`** fallback

## Relationship to omni18n

`omni18n` handles **string translation** (message catalogs, pluralization rules, interpolation). The Intl components handle **value formatting** (numbers, dates, lists). They are complementary:

- `omni18n`: "You have {count} new messages" → translated string with interpolation
- `Intl.Number`: `1234.56` → `"1,234.56"` or `"1.234,56"` depending on locale
- Together: `<T key="cart.total">Total: <Intl.Number value={total} style="currency" currency={currency} /></T>`

## Testing Strategy

Each component gets a spec file testing:
1. Default locale formatting
2. Explicit locale override
3. Reactive value changes (value updates → output updates)
4. Edge cases (NaN, Infinity, empty arrays, invalid dates)

Since `Intl` is available in Node.js, tests run in the default vitest environment without jsdom.

## Resolved Questions

1. **Entry point**: `@pounce/kit/intl` (separate) ✅
2. **Wrapper element**: Text nodes, no wrappers ✅ (Plural uses fragment for JSX children)
3. **DisplayProvider integration**: Option B (`setLocaleResolver`) ✅
4. **`<Intl.Plural>`**: Slot-based (`one={}`, `other={}`) ✅ — declarative, statically analysable
5. **Auto relative time**: No — `Date` and `RelativeTime` stay separate ✅
