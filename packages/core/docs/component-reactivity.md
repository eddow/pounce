# Component Reactivity Rules

## The Rebuild Fence: Warning-Only Protection

Pounce component constructors run **exactly once**. This is enforced by a **rebuild fence** — a protective mechanism that warns when the component body attempts to re-execute due to reactive state changes. If the constructor accidentally reads reactive state directly, the fence catches it and emits a warning but allows execution to continue (configurable via `pounceOptions.maxRebuildsPerWindow`).

This is a **design feature**, not a limitation. Here's why:

### Why components must not re-render

Traditional frameworks like React re-render entire component subtrees when state changes. This is inherently expensive: every re-render recreates JSX, re-evaluates conditionals, re-allocates closures, and triggers reconciliation. Pounce avoids this entirely through **fine-grained reactivity**:

1. **Render once**: The constructor runs once, creates DOM structure and sets up reactive bindings
2. **Reactive attributes**: The Babel plugin wraps JSX attribute values in `r(() => expr)`, so individual attributes update independently when their dependencies change
3. **Virtual attributes & elements**: `if={}`, `when={}` (virtual attributes on any element) and `<for>` (a virtual element) handle conditional rendering and lists reactively — no need for JS `if` statements or `.map()` in the constructor body
4. **Effects for logic**: Any imperative reactive logic uses `effect(() => ...)` inside the constructor

Re-running the entire constructor would destroy and recreate all of this, losing DOM state, breaking effect lifecycles, and wasting performance. The rebuild fence warns about such attempts to help maintain the render-once pattern.

### What triggers the fence

If the constructor body reads a reactive property as a bare statement (e.g. `state.count` or `props.value * 2` outside of a JSX attribute or an effect), the constructor creates a dependency on that property. When the property changes, the render effect tries to re-execute. The fence tracks these attempts and:

1. **Warns** on each rebuild attempt with:
   ```
   Component rebuild detected.
   It means the component definition refers a reactive value that has been modified,
   though the component has not been rebuilt as it is considered forbidden to avoid
   infinite events loops.
   ```

2. **Rate-limits** warnings using `pounceOptions.maxRebuildsPerWindow` and `pounceOptions.rebuildWindowMs`

3. **Errors** only when exceeding the configured threshold (default: 1000 rebuilds per 100ms window)

The fence can be disabled by setting `pounceOptions.maxRebuildsPerWindow = 0`.

### Common traps and fixes

#### ❌ Wrong: Bare reactive read in the constructor

```tsx
function BadComponent(props: { count: number }) {
  // Reads props.count in the constructor body — triggers fence warnings on change
  // Component will re-render (inefficiently) but warnings help identify the issue
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
  // Bare reactive read — triggers fence warnings on state changes
  // Component will re-render inefficiently instead of using reactive conditional
  if (props.loggedIn) return <Dashboard />
  return <Login />
}
```

#### ✅ Correct: Use the `if` directive

```tsx
function GoodComponent(props: { loggedIn: boolean }) {
  return <>
    <Dashboard if={props.loggedIn} />
    <Login if={!props.loggedIn} />
  </>
}
```

## JSX Extensions: Virtual Attributes & Virtual Elements

Pounce extends JSX with two categories of non-standard constructs, both processed at compile time by the Babel plugin and at runtime by the reconciler.

### Virtual Attributes (Directives)

Virtual attributes are available on **any** element or component. They are not rendered to the DOM — the framework intercepts them during reconciliation.

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `if={expr}` | Conditional rendering — element exists only when truthy | `<Panel if={isOpen} />` |
| `else` | Renders when the preceding `if` was falsy | `<Fallback else />` |
| `if:name={value}` | Scope-based condition — renders when `scope[name] === value` | `<Admin if:role={'admin'} />` |
| `when:name={arg}` | Scope-based predicate — renders when `scope[name](arg)` is truthy | `<Route when:match={'/home'} />` |
| `use={fn}` | Mount hook — called once with the rendered target | `<div use={(el) => el.focus()} />` |
| `use:name={value}` | Scoped mixin — calls `scope[name](target, value, scope)` | `<div use:resize={callback} />` |
| `update:name={fn}` | Two-way binding callback for scoped mixins | `<input update:value={(v) => state.val = v} />` |
| `this={ref}` | Captures a reference to the rendered DOM node(s) | `<input this={refs.input} />` |

**Key point**: `if`, `else`, `when` are reactive — the Babel plugin wraps their values in `r()`, so the element appears/disappears automatically when dependencies change. No re-render of the parent component occurs.

```tsx
// Conditional rendering — reactive, no rebuild
<Dashboard if={user.loggedIn} />
<LoginForm else />

// Scope-based conditions
<AdminPanel if:role={'admin'} />
<UserPanel else />
```

### Virtual Elements

Virtual elements are custom JSX tags that don't produce DOM elements. They are framework primitives for structural patterns.

| Element | Purpose | Example |
|---------|---------|---------|
| `<for each={array}>{(item) => <Item />}</for>` | Reactive list rendering | See below |
| `<fragment>...</fragment>` | Groups children without a DOM wrapper | `<fragment if={cond}>...</fragment>` |
| `<scope key={value}>...</scope>` | Creates a child scope with injected properties | `<scope role="admin">...</scope>` |
| `<dynamic tag={tagOrComponent}>...</dynamic>` | Renders a variable tag or component | `<dynamic tag={props.as ?? 'div'} />` |

**`<for>`** is the idiomatic way to render reactive lists. It uses `project.array` from mutts under the hood, so items are added/removed/reordered efficiently without re-rendering the entire list:

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

### Why the distinction matters

- **Virtual attributes** modify *any* existing element's behavior — they are orthogonal to what the element is.
- **Virtual elements** *are* the element — they define structural rendering patterns that have no DOM counterpart.

A `<div if={cond}>` is still a `<div>` that conditionally exists. A `<for>` is not a DOM element at all — it's a reactive list projection.

## Best Practices

### 1. Separate Rendering from Logic

```typescript
export function Component(props: Props, scope: Scope) {
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
  const root = mount.render(rootScope)
  
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
| `array.map()` for lists | `project()` from mutts |

## Remember

- **Components should render once** (warnings help identify violations)
- **Effects handle reactivity**  
- **DOM updates are fine-grained**
- **Rebuilds are allowed but warned** (configure via `pounceOptions`)

This approach ensures optimal performance while providing flexibility for edge cases. The rebuild fence serves as a development aid rather than a hard restriction.
