# Trait System

A **trait** is a reusable bundle of properties (classes, styles, attributes) that can be applied to any HTML element. Traits stack additively — they don't replace, they accumulate.

## Concept

```tsx
// Single trait
<button traits={{ classes: ['btn', 'btn-primary'], styles: { color: 'white' } }}>

// Multiple traits stack
<button traits={[baseTrait, primaryTrait, largeTrait]}>
```

Traits are **not** "variants of a component". They are decorations applied **onto** an element. Multiple traits compose naturally.

## Core Layer (`@pounce/core`)

### Files

| File | Role |
|------|------|
| `src/lib/traits.ts` | `Trait` interface + `applyTraits()` |
| `src/lib/traits.spec.ts` | Unit + JSX integration tests |
| `src/lib/jsx-factory.ts` | Calls `lift(() => applyTraits(props))` for intrinsic elements |
| `src/lib/styles.ts` | `classNames()` and `styles()` — resolve accumulated arrays at render time |
| `src/types/jsx.d.ts` | Declares `traits` prop on `BaseHTMLAttributes` |

### Trait Interface

```typescript
// src/lib/traits.ts
export interface Trait {
  classes?: string[] | Record<string, boolean>
  styles?: Record<string, string | number>
  attributes?: Record<string, string | boolean | number>
}
```

- **`classes`**: Array of class names, or a conditional object `{ active: true, disabled: false }`
- **`styles`**: Inline style properties as an object
- **`attributes`**: HTML attributes to set directly on the element

### `applyTraits()` Function

```typescript
export function applyTraits(
  props: JSX.BaseHTMLAttributes,
  traits?: Trait | Trait[]
): JSX.BaseHTMLAttributes
```

This function:
1. Falls back to `props.traits` if no explicit traits argument
2. Copies props, deletes the `traits` key
3. For each trait, **stacks** (not merges):
   - `result.class = [...asArray(result.class), ...asArray(trait.classes)]`
   - `result.style = [...asArray(result.style), ...asArray(trait.styles)]`
   - `Object.assign(result, trait.attributes)` — attributes go directly onto props

**Critical design choice**: Classes and styles are accumulated as arrays. No processing happens here. The arrays can contain strings, arrays, and conditional objects mixed together. Resolution happens later:
- `classNames()` resolves `ClassInput` (string | array | Record<string,boolean>) → string
- `styles()` resolves `StyleInput` (string | array | Record | falsy) → flat style object

### `asArray` Helper

```typescript
const asArray = (item: any): any[] => {
  if (!item) return []
  if (Array.isArray(item)) return item
  if (typeof item === 'string') return item.split(' ').filter(Boolean)
  return [item]  // objects (including conditional records) stay as-is
}
```

Conditional class objects like `{ active: true }` are **not** resolved here. They pass through as objects in the array. `classNames()` handles them at render time, including removal when `false`.

### JSX Integration

In `jsx-factory.ts`, for intrinsic elements (not components):

```typescript
const element = document.createElement(tag)
const varied = lift(() => applyTraits(props ?? {}))
```

`lift()` from mutts makes `varied` a reactive object. When `props.traits` changes reactively, `varied` updates, which triggers the downstream effects for `class`, `style`, and other properties.

The property loop iterates `varied` (not raw `props`) and sets up effects:
- `key === 'class'` → `effect(() => element.className = classNames(getter()))`
- `key === 'style'` → `effect(() => applyStyleProperties(element, styles(getter())))`
- Other keys → `setHtmlProperty(element, key, value)`

For **components**, traits are **not** applied by the renderer. Props pass through as-is — the component decides how to use them.

### JSX Type Declaration

```typescript
// src/types/jsx.d.ts
interface BaseHTMLAttributes<T = HTMLElement> {
  // ...
  traits?: Trait | Trait[]   // currently named "variants"
  // ...
}
```

### Resolution Functions (`styles.ts`)

**`classNames(input: ClassInput): string`**
- String → kept as-is
- Array → recurse each item
- `Record<string, boolean>` → include key if `true`, **remove** from accumulated list if `false`
- Returns space-joined string

**`styles(...inputs: StyleInput[]): Record<string, StylePrimitive>`**
- Falsy → skip
- Array → recurse each item
- String → parse CSS text
- Object → merge (later overrides earlier)
- Returns flat style object

## UI Layer (`@pounce/ui`)

### Files

| File | Role |
|------|------|
| `src/shared/traits.ts` | `getTraitClass()`, `asTrait()` proxy, standard trait names |
| `src/adapter/registry.ts` | Trait registry (global + per-adapter) |
| `src/adapter/types.ts` | Adapter type with trait mappings |

### String-Based Traits (UI Components)

UI components use string names that resolve via a registry:

```tsx
<Button trait="primary">       // string → looked up in registry
<Button.primary>               // shorthand via asTrait() proxy
```

Resolution order:
1. Component-specific adapter mapping
2. Global adapter traits
3. Standard vanilla convention (`.pounce-trait-{name}`)
4. Dev warning if unknown

### `asTrait()` Proxy

```typescript
export function asTrait<T extends (props: any) => any>(component: T): T & Record<string, T>
```

Wraps a component so any property access becomes a trait:
- `Button.danger(props)` → `Button({ trait: 'danger', ...props })`

### Standard Trait Names

```typescript
const STANDARD_TRAITS = ['primary', 'secondary', 'contrast', 'danger', 'success', 'warning']
```

## Test Structure

Tests live in `src/lib/traits.spec.ts` (colocated with source).

Two groups:
1. **`applyTraits` unit tests** — test the pure function: class stacking, style stacking, attribute merging, conditional objects, empty/null handling
2. **JSX integration tests** — render elements with `h()`, verify DOM: classList, style properties, attributes, no `traits` attribute leaking

Key pattern from the tests: assert on the **accumulated array** from `applyTraits()`, then use `classNames()` / `styles()` to verify the **resolved** output matches expectations.

```typescript
const result = applyTraits(props, [trait1, trait2])
expect(classNames(result.class)).toEqual('new')        // resolved
expect(styles(result.style)).toEqual({ color: 'blue' }) // resolved
```
