# Pounce-TS Documentation

## Overview
Pounce is a **Component-Oriented UI Framework** that *looks* like React but works very differently. It uses **fine-grained reactivity** (via `mutts`) and direct DOM manipulation, avoiding the overhead of a Virtual DOM diffing engine.

## Core Architecture

### 1. Rendering Model
*   **No VDOM**: `h()` returns a "Mountable" object with a `render(scope)` method, not a virtual node description.
*   **Direct Updates**: Components render once. Updates happen via reactive effects attached to DOM elements.
*   **Scope**: Components receive a `scope` object (in addition to props) which allows dependency injection down the tree.

> [!IMPORTANT]
> **NO MANUAL CALLBACKS IN ATTRIBUTES**
> The `babel-plugin-jsx-reactive` automatically wraps expressions in getters.
> *   **Bad**: `icon={() => state.icon}` (becomes `() => () => state.icon`)
> *   **Good**: `icon={state.icon}` (becomes `() => state.icon`)
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

