# Component Reactivity Rules

## The Rebuild Fence

Pounce component constructors run **exactly once**. This is enforced by a **rebuild fence** — if the component body accidentally captures a reactive dependency, Pounce refuses to re-run the body and instead reports the problem.

Re-running the entire constructor would destroy and recreate all of this, losing DOM state, breaking effect lifecycles, and wasting performance. The rebuild fence exists to keep the render-once model explicit.

If the constructor body reads a reactive property as a bare statement (e.g. `state.count` or `props.value * 2` outside of JSX, a directive, or an effect), the render effect captures that dependency. When the property changes, Pounce does **not** rebuild the component body. Instead it surfaces a diagnostic controlled by `pounceOptions.checkRebuild`:

1. **`checkRebuild = 'warn'`** logs a warning with the dependency chain
2. **`checkRebuild = 'error'`** throws a `DynamicRenderingError`
3. **`checkRebuild = false`** stays silent

Typical warning shape:

```
[pounce] Rebuild fence: <ComponentName> has reactive dependencies that changed, but re-running the component body is forbidden (would destroy local state and risk infinite loops).
Triggered by:
...
Move the reactive read into a child element, an effect, or a directive instead.
```

`maxRebuildsPerWindow` and `rebuildWindowMs` are a separate guard against pathological rebuild storms in lower-level rebuild-tracking code; they are not the main knob for the render-fence diagnostic.

### Common traps and fixes

#### ❌ Wrong: Bare reactive read in the constructor

```tsx
function BadComponent(props: { count: number }) {
  // Reads props.count in the constructor body — triggers the rebuild fence on change
  const doubled = props.count * 2
  return <div>{doubled}</div>
}
```

#### ✅ Correct: Let the Babel plugin handle it

```tsx
function GoodComponent(props: { count: number }) {
  // {props.count * 2} is in a JSX attribute — the plugin wraps it in r()
  // It updates independently without re-running the constructor
  return <div>{props.count * 2}</div>
}
```

#### ✅ Correct: Use an effect for imperative logic

```tsx
function GoodComponent(props: { count: number }) {
  const countElement = <div>0</div>
  
  effect(() => {
    countElement.textContent = String(props.count * 2)
  })
  
  return countElement
}
```

#### ❌ Wrong: JS conditional in the constructor

```tsx
function BadComponent(props: { loggedIn: boolean }) {
  // Bare reactive read — triggers the rebuild fence on state changes
  if (props.loggedIn) return <Dashboard />
  return <Login />
}
```

#### ✅ Correct: Use the `if` meta-attribute

```tsx
function GoodComponent(props: { loggedIn: boolean }) {
  return <>
    <Dashboard if={props.loggedIn} />
    <Login if={!props.loggedIn} />
  </>
}
```

## JSX Extensions: Meta-attributes & Meta-components

Pounce extends JSX with two categories of non-standard constructs, both processed at compile time by the Babel plugin and at runtime by the reconciler.

### Meta-attributes

Meta-attributes are available on **any** element or component. They are not rendered to the DOM — the framework intercepts them during reconciliation.

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `if={expr}` | Conditional rendering — element exists only when truthy | `<Panel if={isOpen} />` |
| `else` | Renders when the preceding `if` was falsy | `<Fallback else />` |
| `if:path={value}` | Env-based condition — renders when `env[path] === value` | `<Admin if:user-role={'admin'} />` |
| `when:path={arg}` | Env-based predicate — renders when `env[path](arg)` is truthy | `<Route when:router-match={'/home'} />` |
| `use={fn}` | Inline directive — reactive, cleanup-capable, accumulates across layers | `<div use={(el) => { el instanceof HTMLElement && el.focus() }} />` |
| `use:path={value}` | Scoped mixin — calls `env[path](target, value, access)` (WITHIN effect) | `<div use:resize={callback} />` |

| `update:path={fn}` | Two-way binding callback for env-based mixins | `<input update:value={(v) => state.val = v} />` |
| `this={ref}` | Captures a reference to the rendered DOM node(s) | `<input this={refs.input} />` |
| `pick:path={value}` | Oracle-based selection — renders when `env[path]` picks this value | `<Tab pick:active={'home'} />` |

**Key point**: `if`, `else`, `when` are reactive — the Babel plugin wraps their values in `r()`, so the element appears/disappears automatically when dependencies change. No re-render of the parent component occurs.

```tsx
// Simple boolean
<Dashboard if={user.loggedIn} />
<LoginForm else />
```

### `if:path={value}` — Env-Based Equality

Renders when `env[path] === value` (strict equality). The `path` can use dashes to access nested properties (e.g., `user-role` resolves to `env.user?.role`).

### `when:path={arg}` — Env-Based Predicate

Calls `env[path](arg)` and renders when the result is truthy. The env function is the **predicate** — it receives the argument and decides. Dash-separated paths are supported.


Real-world example — permission guard:

```tsx
function App(_p: {}, env: Env) {
  const auth = reactive({ rights: new Set(['view', 'comment']) })

  // Predicate: receives the required right, returns whether the user has it
  env.hasRights = (right: string) => auth.rights.has(right)

  return (
    <nav>
      <a href="/">Home</a>
      <a href="/edit"   when:hasRights="edit">Edit</a>
      <a href="/delete" when:hasRights="delete">Delete</a>
      <a href="/view"   when:hasRights="view">View</a>
    </nav>
  )
}
```

When `auth.rights` changes, only the affected links appear/disappear — no component rebuild.



### `pick:path={value}` — Oracle-Based Selection

`pick:path` is a multi-sibling selection mechanism driven by an env oracle function. Unlike `if:path` (strict equality), `pick:` lets `env[path]` decide which of several candidates render. Path support via dash separator is included.

**Protocol:**
1. All siblings with `pick:path` declare their candidate value
2. The reconciler collects all candidate values into a `Set` and calls `env[path]` as an oracle
3. The oracle returns the value(s) to render (single value, array, or `Set`)
4. Only elements whose `pick:path` value is in the oracle's result render

**Requires** `env[path]` to be a function — throws `DynamicRenderingError` if missing.


Real-world example — responsive image variants (render the smallest image larger than the current container width):

```tsx
function ResponsiveImage(_p: {}, env: Env) {
  const size = reactive({ height: 0, width: 0 })

  // Oracle: receives all declared maxSize values, picks the smallest one
  // that is still >= the actual container width
  env.maxSize = (options: Set<number>) => {
    return options.toSorted((a, b) => a - b).find((s) => s >= size.width)
  }

  return (
    <div use:resize={size}>
      <img src="/img-400.webp"  pick:maxSize={400}  alt="small" />
      <img src="/img-800.webp"  pick:maxSize={800}  alt="medium" />
      <img src="/img-1600.webp" pick:maxSize={Infinity} alt="large" />
    </div>
  )
}
```

When the container resizes, the oracle re-runs and exactly one `<img>` is shown — no component rebuild, no JS conditionals.

### Meta-components

Meta-components are custom JSX tags that don't produce DOM elements. They are framework primitives for structural patterns.

| Element | Purpose | Example |
|---------|---------|---------|
| `<for each={array}>{(item) => <Item />}</for>` | Reactive list rendering | See below |
| `<fragment>...</fragment>` | Groups children without a DOM wrapper | `<fragment if={cond}>...</fragment>` |
| `<env key={value}>...</env>` | Creates a child env with injected properties | `<env role="admin">...</env>` |
| `<dynamic tag={tagOrComponent}>...</dynamic>` | Renders a variable tag or component | `<dynamic tag={props.as ?? 'div'} />` |
| `<try catch={fn}>...</try>` | Error boundary catching render/effect errors | `<try catch={...}>...</try>` |

**`<for>`** is the idiomatic way to render reactive lists. It uses `morph` from mutts under the hood, so items are added/removed/reordered efficiently without re-rendering the entire list:

```tsx
<ul>
  <for each={state.todos}>
    {(todo: Todo) => <li>{todo.text}</li>}
  </for>
</ul>
```

**`<fragment>`** is useful for grouping elements under a single `if`/`else` condition:

```tsx
<fragment if={state.loading}>
  <Spinner />
  <p>Loading...</p>
</fragment>
<fragment else>
  <Content />
</fragment>
```

**`<try>`** creates an error boundary. If a child throws during render or in a reactive effect, the component's content is reactively swapped to the fallback returned by its `catch` prop:

```tsx
// Basic error boundary
<try catch={(error, reset) => (
  <div class="error-panel">
    <p>Problem: {String(error)}</p>
    {reset && <button onClick={reset}>Try Again</button>}
  </div>
)}>
  <UnreliableComponent />
</try>
```

### Why the distinction matters

- **Meta-attributes** modify *any* existing element's behavior — they are orthogonal to what the element is.
- **Meta-components** *are* the element — they define structural rendering patterns that have no DOM counterpart.

A `<div if={cond}>` is still a `<div>` that conditionally exists. A `<for>` is not a DOM element at all — it's a reactive list morph.

## Best Practices

### 1. Separate Rendering from Logic

```typescript
export function Component(props: Props, env: Env) {
  // ✅ Rendering: happens once
  const element = (
    <div class="container">
      <span class="title">Loading...</span>
      <span class="value">0</span>
    </div>
  )
  
  // ✅ Logic: handles reactivity
  effect(() => {
    const titleElement = element.querySelector('.title')
    const valueElement = element.querySelector('.value')
    
    titleElement.textContent = props.title
    valueElement.textContent = String(props.value)
  })
  
  return element
}
```

### 2. Use untracked() for Non-Reactive Computations

```typescript
import { untracked } from 'mutts'

export function Component(props: Props) {
  // ✅ Non-reactive computation
  const staticValue = untracked(() => {
    return expensiveCalculation(props.staticData)
  })
  
  return <div>{staticValue}</div>
}
```

### 3. Reactive Props Should Be Bound Directly

```typescript
export function InputComponent(props: { value: string }) {
  // ✅ Direct binding creates two-way reactivity
  return <input value={props.value} />
}
```

## Testing Components

When testing components, ensure they render without triggering reactive errors:

```typescript
it('should render without reactivity issues', () => {
  const mount = h(MyComponent, { prop: 'value' })
  const root = mount.render(rootEnv)
  
  // Component should render once without errors
  expect(root).toBeTruthy()
})
```

## Migration from React

If you're coming from React:

| React Pattern | Pounce Pattern |
|--------------|-----------------|
| `useState` + re-render | Direct state mutation + effect |
| `useEffect` for side effects | `effect(() => ...)` |
| Conditional rendering with `&&` | JSX `if` directive |
| `array.map()` for lists | `morph()` from mutts |

## Remember

- **Components should render once**
- **Effects, reactive JSX, and directives handle updates**
- **DOM updates are fine-grained**
- **The rebuild fence is a real boundary, not a soft re-render path**

The right fix for a rebuild-fence error is to move the reactive read into JSX, a directive, or an effect — not to expect the component body to run again.
