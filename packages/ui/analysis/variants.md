# @pounce/ui Variant Architecture

This document describes the **Two-Phase Variant System** used in `@pounce/ui`:
1. **Core Infrastructure** (pounce/core): Low-level variant objects and application logic
2. **UI Management** (pounce/ui): Variant registry, naming, and framework integration

## Variant System Architecture

The variant system supports two distinct usage patterns:

### Core Elements (e.g., `<div>`, `<span>`)
Core HTML elements use variant objects directly:
```tsx
// Direct variant object
<div variants={{ classes: ['bg-blue', 'text-white'] }}>

// Multiple variants
<div variants={[
  { classes: ['bg-blue'] },
  { styles: { padding: '1rem' } },
  { attributes: { 'aria-label': 'Blue box' } }
]}>
```

### UI Components (e.g., `<RadioButton>`)
UI components from adapters use string-based variants:
```tsx
// String variant looks up in adapter registry
<RadioButton variant="primary">
<RadioButton variant="secondary">
```

## Core Variant System

### Variant Interface
```typescript
interface Variant {
  /** CSS classes to add or conditionally include */
  classes?: string[] | Record<string, boolean>
  /** Inline styles to apply */
  styles?: Record<string, string | number>
  /** HTML attributes to set */
  attributes?: Record<string, string | boolean | number>
}
```

### applyVariants Function
The core function for applying variants to props:
```typescript
function applyVariants<T extends JSX.BaseHTMLAttributes<any>>(
  props: T,
  variants?: Variant | Variant[]
): T
```

Key features:
- **Simple**: Just accumulates classes and styles as arrays
- **Reactive**: When used with `lift()`, variant changes automatically update the DOM
- **Stacking**: Classes and styles stack in order - no premature processing
- **Direct**: Attributes are applied directly to the element

### Implementation Details

#### Class Handling
- Classes accumulate as arrays: `[...existing, ...variantClasses]`
- Conditional objects stay as objects in the array: `['btn', { primary: true }]`
- Final processing (filtering, string conversion) happens at render time

#### Style Handling  
- Styles accumulate as arrays like classes: `[...existing, ...variantStyles]`
- Each style object is preserved separately in the array
- Renderer merges them when applying to DOM

#### Attribute Handling
- Attributes are merged directly into the props object via `Object.assign()`
- Later variants override earlier attributes
- Removed from props before DOM rendering

## Reactive Variants

When used in the renderer, variants are applied reactively:
```typescript
const varied = lift(() => applyVariants(props))
```

This ensures that:
- Variant changes trigger re-renders
- Multiple variants can be combined efficiently
- The DOM stays synchronized with variant state

// Multiple string variants
<RadioButton variants={["primary", "large"]}>
```

## Phase 1: Core Infrastructure (pounce/core)

Core provides the building blocks but doesn't manage variants:

### Variant Type
```typescript
interface Variant {
  classes?: string[] | Record<string, boolean>
  styles?: Record<string, string | number>
  attributes?: Record<string, string | boolean | number>
}
```

### applyVariants Function
```typescript
function applyVariants<T extends JSX.BaseHTMLAttributes<any>>(
  props: T, 
  variants?: Variant | Variant[]
): T
```

Core simply:
- Accepts `variants?: Variant | Variant[]` on any HTML element via JSX types
- Provides `applyVariants` to stack variants into props
- Stacks classes and styles as arrays (no premature processing)
- Applies attributes directly to the element
- Has no knowledge of variant names or registry

## Phase 2: UI Management (pounce/ui)

UI builds on core to provide a named variant system:

### Variant Registry
```typescript
// UI maintains a registry of named variants
const variantRegistry: Record<string, Variant> = {
  primary: {
    classes: ['pounce-variant-primary'],
    styles: { backgroundColor: 'var(--pounce-primary)' }
  },
  danger: {
    classes: ['pounce-variant-danger'],
    attributes: { 'aria-label': 'Danger action' }
  }
}
```

### Adapter Integration
Adapters can provide framework-specific variant definitions:
```typescript
setAdapter({
  variants: {
    primary: {
      classes: ['pico-button-primary'], // Framework-specific classes
      attributes: { role: 'button' }
    }
  }
})
```

### Dynamic "Auto-Flavoring" (`asVariant`)
Instead of hardcoding every variant as a flavor, components are wrapped in the `asVariant` proxy. This treats any property access as a potential variant.

```typescript
// src/shared/variants.ts
export function asVariant<T extends (props: any) => any>(component: T): T & Record<string, T> {
	return new Proxy(component, {
		get(target, prop, receiver) {
			if (typeof prop === 'string' && !(prop in target)) {
				// Returns a new flavored function with { variants: getVariant(prop) } defaulted
				return flavorOptions(receiver as any, { variants: getVariantByName(prop) })
			}
			return Reflect.get(target, prop, receiver)
		}
	}) as any
}
```

#### Why `asVariant`?
- **Infinite Flexibility**: Any variant registered in the registry is automatically available as a dot-property.
- **Asneap Code**: No need to update 20 component files when you add a new global variant.
- **Zero Runtime Overhead**: The proxy only intercepts property access on the component object, not the render loop.

Usage:
- `<Button.primary>` -> Automatically applies `{ variants: getVariantByName('primary') }`
- `<Button.danger>` -> Automatically applies `{ variants: getVariantByName('danger') }`
- `<Button.ghost>` -> Works immediately if `ghost` is in the registry.

### Validation & Errors
In development mode, the UI package can validate variant names:
```typescript
// [pounce/ui] Unknown variant "foo". Ensure it is registered in the variant registry.
```

---

## Migration from Old System

The old system used string-based variants with `getVariantClass()`:
```tsx
// Old way
<Button variant="primary">

// New way
<Button variants={getVariantByName('primary')}>
// Or with asVariant:
<Button.primary>
```

The new system is more powerful as it can apply styles and attributes, not just classes.

---

## 🍦 Vanilla Initialization

While the library works by convention out-of-the-box, you can explicitly initialize the vanilla theme.

## 🎨 CSS Implementation

### 1. The Variable Contract
Variant colors are defined as CSS variables at the `@layer pounce.base` or `@layer pounce.theme`.

```sass
// src/styles/_variables.sass
:root
    --pounce-primary: #007bff
    --pounce-danger: #dc3545
    // ...
```

### 2. Component Utility Classes
Components provide default implementations for the standard variants using these variables.

```sass
// src/styles/components/button.sass
.pounce-button
    &.pounce-variant-primary
        background-color: var(--pounce-primary)
        color: #fff
    
    &.pounce-variant-danger
        background-color: var(--pounce-danger)
        color: #fff
```

### 3. Framework Adaptation
When an adapter is used, it often overrides these classes entirely.

```typescript
// Example: PicoCSS Adapter
setAdapter({
    Button: {
        classes: {
            primary: 'pico-button-primary', // No longer uses .pounce-variant-primary
            danger: 'is-error'             // Maps to a completely different framework concept
        }
    }
})
```

## 🚀 Adding a New Variant

To add a `ghost` variant to your application:

1.  **CSS**: Add the style implementation.
    ```css
    .pounce-variant-ghost {
        background: transparent;
        border: 1px solid var(--pounce-fg);
    }
    ```
2.  **Usage**: Just use it!
    ```tsx
    <Button variant="ghost">I am a ghost</Button>
    ```
3.  **Optional Flavoring**: If you use it often, you can flavor the component in your project:
    ```tsx
    const MyButton = flavored(Button, {
        get ghost() { return flavorOptions(this, { variant: 'ghost' }) }
    })
    ```
