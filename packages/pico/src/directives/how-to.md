# Writing Directives in Pounce

Directives in Pounce are functions that attach behavior to DOM elements. They are invoked via the `use:` syntax in JSX.

## Signature

An directive function has the following signature:

```typescript
export function myAction(
    target: Node | Node[], 
    value: any, 
    scope: Record<PropertyKey, any>
) {
    // Setup logic
    return () => {
        // Cleanup logic
    }
}
```

- **target**: The DOM element(s) the directive is applied to. Usually an `HTMLElement`.
- **value**: The value passed to the directive (e.g. `use:myAction={value}`).
- **scope**: The current reactive scope.

## Key Considerations

### 1. Scope Injection
To use a custom directive like `use:resize`, the directive function **must be present in the scope**.
- **Global**: Pass them to `bindApp` (e.g. `bindApp(<App />, '#app', directives)`).
- **Manual**: Add it to a component's scope or the root scope (e.g. `scope.resize = resize`).

### 2. Bi-Directional Binding (`biDi`)
If your directive updates a reactive value based on DOM events (e.g. element resize) AND updates the DOM based on that reactive value, you risk **infinite loops**.

Use `biDi` from `mutts` to manage this safely:

```typescript
import { biDi } from 'mutts'

// Setup biDi: (DOM updater, Reactive getter, Reactive setter)
const provide = biDi(
    (domValue) => { element.style.prop = domValue }, // Reactive -> DOM
    () => state.value,                               // Getter
    (v) => { state.value = v }                       // Reactive setter
)

// When DOM changes (e.g. event listener):
// Call provide() instead of setting state directly to prevent circular updates
element.addEventListener('change', (e) => {
    provide(e.target.value)
})
```

### 3. Infinite Loops & Equality Checks
Even with `biDi`, layout thrashing can cause loops (e.g. ResizeObserver triggers update -> Reactivity updates style -> ResizeObserver triggers again).

- **Strict Equality**: Always check if the value *actually* changed before updating.
    ```typescript
    if (value.width !== newWidth) { ... }
    ```
- **Box Model Awareness**: Be careful with `ResizeObserver`. `contentRect` excludes borders/padding, but `style.width` might include them (if `box-sizing: border-box`). Comparing `contentRect.width` to a value used for `style.width` can cause a permanent grow/shrink loop. Use `borderBoxSize` when appropriate.

### 4. Cleanup
Always return a cleanup function to remove event listeners, disconnect observers, or clear timers. This function runs when the element is removed or the directive is re-evaluated.

```typescript
const observer = new ResizeObserver(...)
observer.observe(element)
return () => observer.disconnect()
```
### 5. Badge Directive (`use:badge`)
The `badge` directive adds a floating notification indicator to an element.

```tsx
// Simple
<Button use:badge={5}>Inbox</Button>

// Advanced
<div use:badge={{ value: 'New', position: 'top-left', variant: 'danger' }}>
  Content
</div>
```

- **value**: Internal content (string, number, or JSX).
- **position**: `top-right` (default), `top-left`, `bottom-right`, `bottom-left`.
- **variant**: Status variant (`primary`, `success`, `warning`, `danger`, etc.).
- **class**: Extra classes for the badge element.

**Note**: The directive sets `overflow: visible` and `position: relative` on the host element via the `.pp-badged` class.
