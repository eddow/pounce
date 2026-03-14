# Sursaut-TS Documentation

## JSX Configuration Standard ⚠️ **CRITICAL**

**ALL Sursaut projects MUST use the classic JSX transform configuration.**
Do NOT use `jsx: "react-jsx"` or `jsxImportSource` - this causes build failures and inconsistencies.

### Standard TypeScript Configuration

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

### Why Classic Transform?

1. **Consistency** - All packages use the same JSX configuration
2. **Compatibility** - Works with Sursaut's custom JSX transform via Babel plugin
3. **Simplicity** - No need for jsx-runtime exports or imports

### What NOT to Do

❌ DO NOT use `jsx: "react-jsx"`  
❌ DO NOT use `jsxImportSource: "@sursaut/core"`  
❌ DO NOT add jsx-runtime or jsx-dev-runtime exports to package.json

### Babel Plugin Configuration

The Babel plugin handles JSX transformation with:
```javascript
['@babel/plugin-transform-react-jsx', {
  runtime: 'classic',
  pragma: 'h',
  pragmaFrag: 'Fragment',
  throwIfNamespace: false,
}]
```

This ensures JSX is transformed to `h()` calls which Sursaut understands.

## Overview
Sursaut is a **Component-Oriented UI Framework** that *looks* like React but works very differently. It uses **fine-grained reactivity** (via `mutts`) and direct DOM manipulation, avoiding the overhead of a Virtual DOM diffing engine.

## Core Architecture

### 1. Rendering Model
*   **No VDOM**: `h()` returns a "Mountable" object with a `render(scope)` method, not a virtual node description.
*   **Direct Updates**: Components render once. Updates happen via reactive effects attached to DOM elements.
*   **Env**: Components receive an `env` object (in addition to props) which allows dependency injection down the tree.
*   **Reconciliation (`processChildren`)**:
    *   **Two-Stage Pipeline**: 
        1.  `morph` subscribes to array mutations and handles element creation/conditional rendering.
        2.  `lift` flattens nested arrays of nodes.
    *   **Lazy Evaluation**: Wrapped in `ReactiveProp` so the pipeline only activates when children are actually needed.
    *   **Caching**: `weakCached` ensures elements aren't re-created unnecessarily.

> [!IMPORTANT]
> **NO MANUAL CALLBACKS IN JSX EXPRESSIONS**
> Reactivity in Sursaut is a **pair**:
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

> [!TIP]
> **Attribute Merging (Cumulation)**:
> For `class` and `style` attributes, Sursaut **merges** values across layers (e.g., when using spread operators `{...attrs}`) instead of replacing them:
> *   **Classes**: Cumulate into a single space-separated string. Supports strings, arrays, and objects.
> *   **Styles**: Merge into a single style object. Later layers override earlier ones for the same property, but distinct properties accumulate.
> *   **node.isConnected**: Has been made reactive.
> *   **Other attributes**: Standard `Object.assign` behavior (last one wins).


### 3. Components & Props
*   **Props are Reactive Proxies**: The `props` object passed to a component is a reactive proxy.
    *   **Reading**: Accessing `props.value` reads the underlying value (calls the getter).
    *   **Writing**: Assigning `props.value = x` calls the underlying setter (updates the source state). props are NOT read-only!
    *   **Implication**: When passing props to custom components, the binding object is passed through. If the custom component uses `compose` and spreads state to an underlying native element (e.g., `<input {...state} />`), the binding is propagated, enabling implicit two-way binding without manual event handlers.
*   **Destructuring Hazard**: `const { value } = props` will read the property immediately. If done outside a tracking context (like an effect), it breaks reactivity for that variable. *Always access props usage-side or keep them in the props object.*
*   **Body Access Hazard**: Reading `props.foo` directly in the component function body (outside an effect/memo) creates a dependency on that prop for the *entire component render effect*. If `props.foo` changes, the rebuild fence triggers and the component body does **not** re-run.
*   **Bad**: `const x = props.foo; return <div>{x}</div>` (Triggers the rebuild fence when `foo` changes).
*   **Good**: `const computed = { get x() { return props.foo; } }; return <div>{computed.x}</div>` (Only the binding updates).

### 4. Directives (`use`)
*   **`use={handler}`**: Inline directive. Called **within an effect** with `(target, access)`. It may return a cleanup function, re-runs when its value changes, and accumulates across layers.
*   **`use:path={value}`**: Calls `env[path](instance, value, access)`. This is called **WITHIN an effect**, so it re-runs when `value` (or other dependencies) changes, can return a cleanup function, and is skipped when the resolved env entry is missing or falsy.
*   **`this={callback}`**: Callback-based ref directive. Receives the rendered target on mount and `undefined` on cleanup/unlatch. Multiple `this` directives accumulate.

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

Cleanup walkers must include the root node even when it is not an `Element` (for example comment/text anchors). Some side-effect components anchor cleanup on non-element nodes; if the walker only traverses elements, their cleanup never fires on unlatch.

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

Component constructors run **once** inside `SursautElement.render`'s effect. A **rebuild fence** prevents re-execution: if the constructor accidentally reads reactive state directly, it reports through `sursautOptions.checkRebuild` and does NOT re-run the body. All reactivity comes from:
- JSX attributes wrapped by the babel plugin (`r()`)
- Explicit `effect()`, `attend()`, `lift()`, `project()` inside the body
- JSX directives (`if={}`, `when={}`, `if:path={}`, `when:path={}`, `use:path={}`, `pick:path={}`)

Bare reactive reads in the constructor body (e.g. `state.x` as a statement) are caught by the fence. Use `if={}` attributes for conditional rendering, NOT JS `if` statements.

### 8. Error Boundaries — `catch=` meta-attribute

`catch={(error: unknown, reset?: () => void) => JSX.Element}` on **any element** turns it into an error boundary. No component wrapper needed.

- Catches errors thrown by children during render **and** in reactive effects after mount
- The boundary element is stable; only its children are reactively swapped to the fallback
- `env.catch` propagation: errors bubble to the nearest ancestor boundary if no local `catch` is set
- Setting `catch` clears `env.catch` for descendants — no double-catching
- `reset` (second arg) restores original content if there was a successful render before the error

```tsx
<div catch={(error) => <span class="error">{(error as Error).message}</span>}>
  <UnreliableComponent />
</div>
```

`onEffectThrow` still exists in mutts but is **not** the idiomatic error boundary mechanism — use `catch=` instead.

### 8b. `pick:path={value}` — Oracle-Based Selection

Multi-sibling selection driven by an env oracle function. All siblings with `pick:path` declare a candidate value; the reconciler collects all values into a `Set`, calls `env[path]` (where `path` can use `-` as a separator for nested objects like `user-role`), and renders only elements whose value is in the oracle's result.

- **Requires** `env[path]` to be a function — throws `DynamicRenderingError` if missing
- Oracle can return a single value, array, or `Set` of winning values (multi-select supported)
- **Path Support**: `if:some-thing`, `when:some-thing`, `use:some-thing`, and `pick:some-thing` resolve to `env.some?.thing`.


```tsx
env.tab = (options: Set<string>) => state.active  // oracle picks one
<HomePanel    pick:tab={'home'} />
<SettingsPanel pick:tab={'settings'} />
```

### 9. Vitest Uses Babel Plugin

The vitest base config (`test/vitest.config.base.ts`) includes `sursautCorePlugin` so tests undergo the same babel transform as production code. Tests should NOT manually wrap JSX attributes in `r()` — the plugin handles this. `esbuild` is disabled in test config to avoid double-transformation.

### 10. Dual-Module Hazard — Library Build Externals

`@sursaut/core` uses `instanceof ReactiveProp` in critical paths (`propsInto`, `valuedAttributeGetter`, event handlers, reconciler). If a library build bundles a **second copy** of `ReactiveProp` — all `instanceof` checks break at runtime (manifests as `[object Object]` in DOM attributes).

**Rule**: Library builds that externalize `@sursaut/core` MUST externalize ALL subpaths: use `/^@sursaut\/core/` regex. A singleton guard in `src/lib/index.ts` throws if two instances load.

**JSX Runtime**: Sursaut uses the **classic** JSX transform (`pragma: h`, `pragmaFrag: Fragment`). There is no `jsx-runtime` module — babel emits direct `h()` calls. The `h` and `Fragment` functions are set as globals in `src/lib/index.ts`.

**CRITICAL**: Never switch to `jsx: "react-jsx"` or add jsx-runtime exports. This breaks the build system and creates inconsistencies across packages. All Sursaut projects must use the classic transform as documented in the JSX Configuration Standard section at the top of this file.

### 11. `latch()` — Latching Content onto Elements

`latch(target, content, scope?)` is the public API for rendering sursaut content into any DOM element. It replaces the old `<portal>` intrinsic and kit's `head()` function.

```typescript
import { latch } from '@sursaut/core'

// Latch into document.head (replaces kit's head())
const unlatch = latch(document.head, <link rel="canonical" href="/page" />)

// Latch into any element by selector or ref
latch('#sidebar', <Nav />, scope)
latch(myElement, [<span>a</span>, <span>b</span>])

// Cleanup removes all latched content
unlatch()
```

- **Polymorph**: accepts `SursautElement`, `Child[]`, `Node`, `Node[]`, or `undefined`
- **DOMContentLoaded guard**: defers if document is still loading
- **Conflict detection**: warns if two latches target the same element
- **`latch()`** is the core primitive for mounting reactive content onto DOM elements
- **`bindApp()`** was a thin wrapper around `latch()` with perf markers (now removed)
- **`reconcile()`** is the internal primitive (not exported for consumers) — syncs `Node[]` into a parent

### 12. Barrel Plugin — `sursautBarrelPlugin`

`sursautBarrelPlugin(options?)` in `@sursaut/core/plugin` creates a **virtual module** that re-exports from the right Sursaut packages based on a skeleton.

```ts
import { sursautBarrelPlugin } from '@sursaut/core/plugin'

sursautBarrelPlugin({
  name: '@sursaut',        // virtual module name (default: '@sursaut')
  skeleton: 'front-end', // 'kit' | 'front-end' | 'back-end' | 'full-stack' (default)
  adapter: '@sursaut/adapter-pico', // required when skeleton includes UI
  dts: 'src/@sursaut.d.ts', // path to write ambient declare module file (default: '<name>.d.ts' in cwd)
                            // set to false to disable
})
```

**Skeletons:**
| Skeleton | Packages re-exported |
|---|---|
| `kit` | `@sursaut/core`, `@sursaut/kit` |
| `front-end` | `@sursaut/core`, `@sursaut/kit/dom`, `@sursaut/ui`, adapter |
| `back-end` | `@sursaut/core`, `@sursaut/kit`, `@sursaut/board` |
| `full-stack` | `@sursaut/core`, `@sursaut/kit/dom`, `@sursaut/ui`, adapter, `@sursaut/board` |

The virtual module ID is the `name` string itself (no `\0` prefix). Consumers import from it directly:
```ts
import { reactive, Button, A } from '@sursaut'
```

At `buildStart`, the plugin writes an ambient `declare module` `.d.ts` file to disk for IDE type support (same pattern as `pure-glyf`). The generated file contains `declare module '@sursaut' { export * from ... }` matching the skeleton. Add the path to `tsconfig.json` `paths` and `include`.

Used by `@sursaut/docs` and `mARC` (and any app that wants a single import namespace).

### 13. `bind(...)` — Explicit Bidirectional Binding API

`bind(dst, src, defaultValue?)` is the supported two-way binding API.

```ts
const a = reactive({ x: 1 })
const b = reactive({ x: 0 })

bind(r(() => b.x, _v => b.x = _v), r(() => a.x, _v => a.x = _v))
bind(r(() => b.x, _v => b.x = _v), r(() => a.x, _v => a.x = _v), 7)
```

**Runtime (`bind` in `composite-attributes.ts`):**
- `bind(dst, src, defaultValue?)` — `dst` is first arg, `src` is second
- Applies `defaultValue` **imperatively** before effects run (if `src.get() == null`)
- Two effects, each tracking only one side, with a shared `writing` sentinel for loop suppression
- Returns a cleanup function `() => void` that stops both effects

The old `bind:` label syntax is obsolete and should not be documented or reintroduced.
