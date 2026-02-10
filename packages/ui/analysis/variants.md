# @pounce/ui Variant Architecture

**Last Updated**: 2026-02-09

Variants are **named Trait objects** defined by the adapter. The UI package provides no default variants — all variants must come from the adapter's central dictionary.

## Core Concept

A variant is a semantic name (e.g., `danger`, `primary`) that maps to a `Trait` object from `@pounce/core`. Traits bundle classes, styles, and attributes together.

```typescript
// Trait type (from @pounce/core)
type Trait = {
  classes?: string | string[]
  styles?: Record<string, string>
  attributes?: Record<string, string>
}
```

## How It Works

### 1. Adapter defines variants

```typescript
import { setAdapter } from '@pounce/ui'

setAdapter({
  variants: {
    primary: { classes: ['btn-primary'] },
    danger: { classes: ['btn-danger'], attributes: { 'data-variant': 'danger' } },
    success: { classes: ['btn-success'], attributes: { 'data-variant': 'success', 'aria-live': 'polite' } },
  }
})
```

### 2. Components look up variants via `getVariantTrait()`

```typescript
// src/shared/variants.ts
export function getVariantTrait(variant: string | undefined): Trait | undefined
```

- Returns the `Trait` from `adapter.variants[name]`
- Returns `undefined` if not found
- Warns in development if variant is missing from adapter

### 3. Components apply traits directly to elements

```typescript
// Inside Button component
get variantTrait() {
  return getVariantTrait(s.variant)
},
get allTraits() {
  return [this.baseTrait, this.variantTrait].filter((t): t is Trait => !!t)
}

// In JSX
<dynamic tag={state.tag} traits={state.allTraits}>
```

The `traits` prop on any element applies the Trait's classes, styles, and attributes to the DOM element. This is handled by `@pounce/core`.

## Dot-Syntax Flavoring (`asVariant`)

Components are wrapped with `asVariant()` to enable dot-syntax access:

```typescript
// src/shared/variants.ts
export function asVariant<T extends (props: any) => any>(component: T): T & Record<string, T> {
  return new Proxy(component, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && !(prop in target)) {
        return new Proxy(target, {
          apply(target, thisArg, args: any[]) {
            const [props, ...rest] = args
            const mergedProps = props && typeof props === 'object'
              ? { variant: prop, ...props }
              : { variant: prop }
            return target.apply(thisArg, [mergedProps, ...rest] as any)
          }
        })
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as any
}
```

Usage:
- `<Button.danger>` → `Button({ variant: 'danger' })`
- `<Button.primary>` → `Button({ variant: 'primary' })`
- `<Button variant="custom">` → explicit prop, same lookup

This is fully dynamic — any string works. No pre-declaration needed.

## Overlay Helper Flavoring

Overlay helpers (`dialog`, `toast`, `drawer`) can also support dot-syntax via the same proxy concept or `flavored`/`flavorOptions` from `mutts`:

```typescript
dialog.danger.confirm({ title: 'Delete?', message: 'Permanent.' })
toast.warning({ message: 'Connection lost' })
```

See `mutts/docs/flavored.md` for the `flavored` utility.

## Key Principles

1. **No default variants in UI** — The UI package does not define `STANDARD_VARIANT_TRAITS` or any fallback variant list. If the adapter doesn't define a variant, it doesn't exist.
2. **Traits, not classes** — Variants are `Trait` objects (classes + styles + attributes), not plain CSS class strings.
3. **Adapter-only** — `getVariantTrait()` only looks up `getGlobalVariants()` from the adapter registry.
4. **Dev warnings** — In development, a `console.warn` fires if a variant is not found.

## Adding a New Variant

Register it in the adapter:

```typescript
setAdapter({
  variants: {
    ghost: {
      classes: ['pounce-ghost'],
      attributes: { 'data-variant': 'ghost' }
    }
  }
})
```

Then use it immediately:
```tsx
<Button.ghost>I am a ghost</Button.ghost>
<Button variant="ghost">Same thing</Button>
```

CSS for the variant is the adapter's responsibility (or the user's custom CSS).
