# Pounce-TS Documentation

## Overview
Pounce is a **Component-Oriented UI Framework** that *looks* like React but works very differently. It uses **fine-grained reactivity** (via `mutts`) and direct DOM manipulation, avoiding the overhead of a Virtual DOM diffing engine.

## Core Architecture

### 1. Rendering Model
*   **No VDOM**: `h()` returns a "Mountable" object with a `render(scope)` method, not a virtual node description.
*   **Direct Updates**: Components render once. Updates happen via reactive effects attached to DOM elements.
*   **Scope**: Components receive a `scope` object (in addition to props) which allows dependency injection down the tree.

> [!IMPORTANT]
> **NO MANUAL CALLBACKS IN JSX EXPRESSIONS**
> Reactivity in Pounce is a **pair**:
> 1.  **Babel Plugin**: Automatically rewrites `{expr}` into `{() => expr}`.
> 2.  **Renderer**: Expects a callback and calls it to establish tracking.
> 
> **If you write `{() => expr}`, the plugin turns it into `{() => () => expr}`.** This breaks reactivity.
> *   **Good**: `<span>{state.value}</span>`
> *   **Bad**: `<span>{() => state.value}</span>`
> 
> #### 2. Attribute Transformations:
> *   **Expressions**: `attr={value}` is transformed to `attr={() => value}` (getter).
> *   **Two-Way Binding**:
>     *   **Member Expressions**: `attr={obj.prop}` -> `{ get: () => obj.prop, set: (v) => obj.prop = v }`.
>     *   **Element Binding**: `this={expr}` -> `{ set: (v) => expr = v }`.
>     *   **Explicit Update**: `update:attr={(v) => ...} attr={...}` creates a get/set pair.
> Direct assignment to attributes is the only way to ensure correct reactive propagation.
*   **Expressions**: `attr={value}` is transformed to `attr={() => value}` (wrapped in a getter).
*   **Two-Way Binding**:
    *   **Member Expressions**: `attr={obj.prop}` -> transformed to `{ get: () => obj.prop, set: (v) => obj.prop = v }`.
    *   **Element Binding**: `this={expr}` -> transformed to `{ set: (v) => expr = v }` (pure setter, no getter).
    *   **Explicit Update**: `update:attr={(v) => ...}` combined with `attr={...}` creates the get/set pair.

### 3. Components & Props
*   **Props are Reactive Proxies**: The `props` object passed to a component is a reactive proxy.
    *   **Reading**: Accessing `props.value` reads the underlying value (calls the getter).
    *   **Writing**: Assigning `props.value = x` calls the underlying setter (updates the source state). props are NOT read-only!
    *   **Implication**: When passing props to custom components, the binding object is passed through. If the custom component uses `compose` and spreads state to an underlying native element (e.g., `<input {...state} />`), the binding is propagated, enabling implicit two-way binding without manual event handlers.
*   **Destructuring Hazard**: `const { value } = props` will read the property immediately. If done outside a tracking context (like an effect), it breaks reactivity for that variable. *Always access props usage-side or keep them in the props object.*

### 4. Directives (`use`)
*   **`use={handler}`**: The `handler` is called during the **render phase** (untracked) with the mounted element/component instance.
*   **`use:name={value}`**: Calls `scope.name(instance, value, scope)`. This allows dependency injection of directives from the scope.

### 5. Best Practices & Anti-Patterns
> [!IMPORTANT]
> **Component Interaction Anti-Pattern**
> DO NOT override internal component logic with event handlers to manually force state changes.
> *   **Bad**: `<RadioButton el={{ onClick: () => mode.val = '' }} />`
> *   **Good**: `<RadioButton group={mode} value="" />` (Let the component handle the update).

> [!IMPORTANT]
> **Conditional Rendering: Use JSX `if` Directives for Reactivity**
> In component functions, plain JavaScript `if` statements are NOT reactive:
> *   **Bad**: `state.loading && <div>Loading...</div>` (evaluated once, never updates)
> *   **Good**: `<div if={state.loading}>Loading...</div>` (reactive, updates when state changes)
> 
> The JSX `if` directive wraps the condition in a getter and re-evaluates it whenever dependencies change.
>
> **Important**: This is cleaner than `{condition && <Button ... />}` - and indeed it is the only way to do it *reactively* in many contexts. Using `&&` evaluates the condition once at render time (unless wrapped in a dedicated effect/component), whereas the `if` prop ensures the component's visibility toggles reactively with the state.

> [!NOTE]
> **Array Mutations & Reactivity**
> *   `array.push()`, `array.splice()`, `array.shift()` etc. properly trigger reactivity.
> *   `array.length = 0` may not trigger all reactivity effects. Prefer `array.splice(0)` to clear arrays.

> [!IMPORTANT]
> **Reactive Lists: Use `<for>` Element**
> *   **Bad**: `{items.map(item => <Item />)}` (re-renders the entire list on update)
> *   **Good**: `<for each={items}>{(item) => <Item />}</for>` (efficiently updates only changed items)
> The `<for>` element is a special JSX intrinsic that handles fine-grained list updates.

> [!IMPORTANT]
> **Input Bindings**
> Avoid `onChange` handlers for inputs. Use two-way binding with mutable state.
> *   **Pattern**: Pass a mutable state slice to the component, and let the component mutate it directly.
> *   **Supported elements**: `<input>` (all types), `<textarea>`, `<select>` — all wire `value=` biDi automatically.
> *   `<input type="checkbox/radio">`: biDi on `checked=` (via `input` event)
> *   `<input type="number/range">`: biDi on `value=` coerces to `Number` (via `input` event)
> *   `<input>` (other): biDi on `value=` (via `input` event)
> *   `<textarea>`: biDi on `value=` (via `input` event)
> *   `<select>`: biDi on `value=` (via `change` event)

### 6. Element Lifecycle & Cleanup
`h()` uses `cleanedBy(element, attend(...))` to tie the reactive bindings to the element's lifecycle. When the element is removed, all inner effects (`attend`, `biDi`, `effect`) are disposed automatically. **No DOM cleanup is needed** — there is no point resetting attributes, styles, or removing event listeners on an element that is being removed. DOM listeners die with the element.

See `mutts/LLM.md` § "Cleanup Semantics" for the general principle.

## 🚫 PROHIBITED: `Array.map()` for Rendering Lists

**DO NOT** use `.map()` to render lists of components in JSX.

### Why?
Using `A.map(item => <Component />)` creates a snapshot. When **any** part of `A` changes (even a single property of one item, or if an item is added), the **entire list** is re-evaluated and re-rendered. This is inefficient and breaks fine-grained reactivity.

### ✅ REQUIRED: Use `project()`

**ALWAYS** use `project(source, (access) => ...)` from `mutts` for rendering lists.

```typescript
import { project } from 'mutts';

// BAD ❌
{items.map(item => <div>{item.name}</div>)}

// GOOD ✅
{project(items, access => {
  // 'access' is a proxy that tracks dependencies per-item
  // 'access.val' is the item itself
  const item = access.val; 
  return <div>{item.name}</div>;
})}
```

### The Benefit
`project` creates a **live subscription** for each item.
- If `items[5]` changes, **only** the 6th DOM node updates.
- The rest of the list is untouched.
- DOM nodes are preserved; standard `.map` often destroys and recreates them.

See `mutts/LLM.md` for a deeper conceptual explanation of the "Assembly Line vs. Dedicated Worker" model.

### 7. Component Constructor: Static, Run-Once

Component constructors run **once** inside `PounceElement.render`'s effect. A **rebuild fence** prevents re-execution: if the constructor accidentally reads reactive state directly, it warns and does NOT re-render. All reactivity comes from:
- JSX attributes wrapped by the babel plugin (`r()`)
- Explicit `effect()`, `attend()`, `lift()`, `project()` inside the body
- JSX directives (`if={}`, `when={}`, `use:name={}`)

Bare reactive reads in the constructor body (e.g. `state.x` as a statement) are caught by the fence. Use `if={}` attributes for conditional rendering, NOT JS `if` statements.

### 8. Error Boundaries

`onEffectThrow(handler)` in a component constructor registers on the component's render effect. Child component errors propagate up the effect parent chain and are caught by the boundary. The boundary fires `handler` but does NOT provide fallback content — the child's `PounceElement.render` still throws `DynamicRenderingError` if no content was produced.

### 9. Vitest Uses Babel Plugin

The vitest base config (`test/vitest.config.base.ts`) includes `pounceCorePlugin` so tests undergo the same babel transform as production code. Tests should NOT manually wrap JSX attributes in `r()` — the plugin handles this. `esbuild` is disabled in test config to avoid double-transformation.

### 10. Dual-Module Hazard — Library Build Externals

`@pounce/core` uses `instanceof ReactiveProp` in critical paths (`propsInto`, `valuedAttributeGetter`, event handlers, reconciler). If a library build (e.g. `@pounce/kit`) aliases `@pounce/core/jsx-runtime` to **source** but externalizes `@pounce/core`, the built dist will bundle a **second copy** of `ReactiveProp` — breaking all `instanceof` checks at runtime (manifests as `[object Object]` in DOM attributes).

**Rule**: Library builds that externalize `@pounce/core` MUST externalize ALL subpaths: use `/^@pounce\/core/` regex, never list individual subpaths. A singleton guard in `src/lib/index.ts` throws if two instances load.

### 11. `latch()` — Latching Content onto Elements

`latch(target, content, scope?)` is the public API for rendering pounce content into any DOM element. It replaces the old `<portal>` intrinsic and kit's `head()` function.

```typescript
import { latch } from '@pounce/core'

// Latch into document.head (replaces kit's head())
const unlatch = latch(document.head, <link rel="canonical" href="/page" />)

// Latch into any element by selector or ref
latch('#sidebar', <Nav />, scope)
latch(myElement, [<span>a</span>, <span>b</span>])

// Cleanup removes all latched content
unlatch()
```

- **Polymorph**: accepts `PounceElement`, `Child[]`, `Node`, `Node[]`, or `undefined`
- **DOMContentLoaded guard**: defers if document is still loading
- **Conflict detection**: warns if two latches target the same element
- **`bindApp()`** is a thin wrapper around `latch()` with perf markers
- **`reconcile()`** is the internal primitive (not exported for consumers) — syncs `Node[]` into a parent

### 12. Known Issue: Premature Effect Cleanup in `jsx-factory`

**Status:** Open / Mitigated (Workaround Active)

When `attend()` creates effects for event listeners (via `listen()`), the effect's cleanup function is sometimes called **immediately** (15-30ms) after creation during the initial render, even though the element remains in the DOM. This causes `addEventListener` listeners to be removed instantly.

**Workaround:** `jsx-factory.ts` uses direct property assignment (`element.onclick = handler`) as a primary binding mechanism for standard events. This persists even if the reactive effect is disposed. `listen()` is still called as a fallback for custom events, but may be unreliable until the root cause (interaction between `cleanedBy` and `reconciler`) is fixed.

**Implication for Contributors:**
- Do not remove the `element[propName] = handler` assignment in `eventEffect`.
- Be aware that `effect()` cleanup logic on DOM elements might run earlier than expected.
