# @pounce/ui Variant Architecture

This document describes the **Adapter-Driven Variant** architecture used in `@pounce/ui`. This design ensures that the core components remain framework-agnostic while allowing total flexibility for adapters (e.g., PicoCSS, Tailwind, Bootstrap).

## 🎯 Design Goals

1.  **Semantic Contract**: Components care about *intent* (labels like `danger`, `contrast`), not *implementation* (class names).
2.  **Zero hardcoding**: No fixed lists of variants in the core TypeScript logic.
3.  **Convention-Based**: Default fallback to standard `.pounce-variant-*` classes for zero-config usage.
4.  **Framework-Agnostic**: Adapters can map any semantic label to any number of framework-specific classes.

## 🛠️ TypeScript Implementation

### 1. Semantic Labels
In `@pounce/ui`, a "variant" is just a string. While we provide types for common variants to help with Intellisense, the system is open-ended.

```typescript
// src/shared/variants.ts
export type Variant = (string & {}) // Open-ended string
```

### 2. The Resolver
The `getVariantClass` utility bridge the gap between intent and implementation.

```typescript
// src/shared/variants.ts
export function getVariantClass(variant: string | undefined, adapter?: ComponentAdapter): string | undefined {
    if (!variant) return undefined
    
    // 1. Check adapter mapping (Intent -> Framework Class)
    if (adapter?.classes?.[variant]) {
        return adapter.classes[variant]
    }
    
    // 2. Default convention fallback
    return `pounce-variant-${variant}`
}
```

### 3. Dynamic "Auto-Flavoring" (`asVariant`)
Instead of hardcoding every variant as a flavor, components are wrapped in the `asVariant` proxy. This treats any property access as a potential variant.

```typescript
// src/shared/variants.ts
export function asVariant<T extends (props: any) => any>(component: T): T & Record<string, T> {
	return new Proxy(component, {
		get(target, prop, receiver) {
			if (typeof prop === 'string' && !(prop in target)) {
				// Returns a new flavored function with { variant: prop } defaulted
				return flavorOptions(receiver as any, { variant: prop })
			}
			return Reflect.get(target, prop, receiver)
		}
	}) as any
}
```

#### Why `asVariant`?
- **Infinite Flexibility**: Any variant registered in an adapter is automatically available as a dot-property.
- **Asneap Code**: No need to update 20 component files when you add a new global variant.
- **Zero Runtime Overhead**: The proxy only intercepts property access on the component object, not the render loop.

Usage:
- `<Button.primary>` -> Automatically applies `{ variant: 'primary' }`
- `<Button.danger>` -> Automatically applies `{ variant: 'danger' }`
- `<Button.ghost>` -> Works immediately if `ghost` is in CSS or Adapter.

### 4. Validation & Errors
In development mode, `getVariantClass` validates that the variant is either a **Standard Vanilla Variant** or **Registered in the Adapter**.
 If neither, it logs an error.

```typescript
// [pounce/ui] Unknown variant "foo". Ensure it is registered...
```

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
