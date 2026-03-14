# Components in Sursaut-TS

Components are the building blocks of Sursaut-TS applications. They are TypeScript functions that receive props and return JSX elements.

## Basic Component Syntax

A component is a function that returns JSX:

```tsx
function Greeting(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>
}
```

### Component Structure

Every component receives two parameters:

1. **`props`**: The component's properties
2. **`env`**: The reactive environment for conditional rendering and mixins (similar to React/Svelte context)

```tsx
function MyComponent(
  props: { title: string; count: number },
  env: Env
) {
  return (
    <div>
      <h2>{props.title}</h2>
      <p>Count: {props.count}</p>
    </div>
  )
}
```

**Important:** The `env` parameter uses prototype inheritance. When component A renders component B, B automatically receives A's env. Any modifications A makes to `env` are visible to B and all its descendants. This means if `<ComponentA><ComponentB /></ComponentA>` is written in `ComponentC`, ComponentB will still receive ComponentA's env modifications.

See the [Advanced Features Guide](./advanced.md#environment-management) for more details on environment management.

Conditional rendering with env
- `if={...}`: boolean condition
- `if:path={value}`: compares `value === env[path]` (supports dash-separated paths like `user-role`)
- `when:path={arg}`: calls `env[path](arg)` and checks the returned value

- `else` and `else if={...}`: use inside fragments to chain branches

## Default Props

Use the `defaults()` utility to provide default values for props:

```tsx
import { defaults } from '../lib/utils'

function Button(props: {
  label?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const state = defaults(props, {
    label: 'Click me',
    disabled: false
  })

  return (
    <button onClick={state.onClick} disabled={state.disabled}>
      {state.label}
    </button>
  )
}
```

## Dynamic Tags

When the wrapper tag needs to change at runtime, use the `<dynamic>` helper component. Pass the tag name (or component) via the `is` prop and forward any additional attributes/children:

```tsx
function Wrapper(props: { as?: JSX.HTMLElementTag }) {
  return (
    <dynamic tag={props.as ?? 'div'} class="wrapper">
      {props.children}
    </dynamic>
  )
}
```

`dynamic` forwards everything to the rendered target, so props such as `class`, `style`, `if`, and `use:` behave exactly as if you had written the tag directly.

## Props Types

### Static Props

Simple values passed directly:

```tsx
<Greeting name="Alice" />
```

### Reactive Props

Props can be reactive functions or two-way bindings. The Babel plugin generates two-way bindings for member expressions and mutable (`let`/`var`) identifiers, and one-way for `const`/imports:

```tsx
// Two-way binding (member expression)
<Counter count={state.counter} />

// Two-way binding (mutable variable)
let count = 0
<Counter count={count} />

// One-way binding (const → no wrapping)
const doubled = memoize(() => state.counter * 2)
<Counter count={doubled} />
```

### Event Handler Props

Pass callback functions for component events:

```tsx
function TodoList(props: {
  todos: Todo[]
  onTodoClick?: (todo: Todo) => void
  onTodoDelete?: (id: number) => void
}) {
  return (
    <div>
      {props.todos.map(todo => (
        <div key={todo.id}>
          <span onClick={() => props.onTodoClick?.(todo)}>
            {todo.text}
          </span>
          <button onClick={() => props.onTodoDelete?.(todo.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Component Lifecycle

Use `effect()` from `mutts` for lifecycle hooks:

```tsx
import { effect } from 'mutts'

function MyComponent() {
  // Component mounted
  console.log('Component mounted')
  
  effect(() => {
    // Setup code
    
    return () => {
      // Cleanup on unmount
      console.log('Component unmounted')
    }
  })

  return <div>My Component</div>
}
```

### Tracking Effects

Use `onEffectTrigger()` to monitor reactive changes:

```tsx
import { onEffectTrigger } from 'mutts'

function MyComponent() {
  onEffectTrigger((obj, evolution) => {
    console.log('State changed:', obj, evolution)
  })

  return <div>My Component</div>
}
```

## Children

Components can accept children elements:

```tsx
function Container(props: { children: JSX.Element | JSX.Element[] }) {
  const children = Array.isArray(props.children) 
    ? props.children 
    : [props.children]

  return (
    <div class="container">
      {children}
    </div>
  )
}

// Usage
<Container>
  <h1>Title</h1>
  <p>Content</p>
</Container>
```

## Composing Components

Build complex UIs by composing simple components:

```tsx
function App() {
  const state = reactive({
    todos: [
      { id: 1, text: 'Learn Sursaut', done: false },
      { id: 2, text: 'Build app', done: false }
    ]
  })

  function addTodo(text: string) {
    state.todos.push({ id: Date.now(), text, done: false })
  }

  return (
    <div>
      <Header title="My Todo App" />
      <TodoInput onAdd={addTodo} />
      <TodoList todos={state.todos} />
    </div>
  )
}

function Header(props: { title: string }) {
  return <h1>{props.title}</h1>
}

function TodoInput(props: { onAdd: (text: string) => void }) {
  const state = reactive({ text: '' })
  
  return (
    <div>
      <input value={state.text} />
      <button onClick={() => {
        props.onAdd(state.text)
        state.text = ''
      }}>
        Add Todo
      </button>
    </div>
  )
}

function TodoList(props: { todos: Todo[] }) {
  return (
    <ul>
      {props.todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}
```

## Best Practices

1. **Keep components small**: Focus on single responsibility
2. **Use TypeScript types**: Define prop types for better IDE support
3. **Provide defaults**: Use `defaults()` for optional props
4. **Handle events properly**: Use optional chaining for callbacks
5. **Clean up effects**: Return cleanup functions from `effect()`

## `use:` mixins (element/component directives)

The `use:` directive lets you attach behaviors ("mixins") implemented on the current `env` to either DOM elements or component results.

- Define a mixin on the env: `env.myMixin(target, value, access)`
- Use it in JSX: `use:myMixin={value}`

Signature

### `use={callback}` (inline directive)

Attach an inline directive without defining a mixin on `env`.

- Signature: `use={(target, access) => void | (() => void)}`
- `target`: `Node | Node[]` — the rendered target. Intrinsic elements receive a single `Node`. Components may yield a `Node` or `Node[]`.
- `access`: the current effect access handle.
- **Effect-bound**: Called within an effect, may be cleaned up and re-run when the directive value changes.

> **Important**: pass the directive function directly to `use={...}`. Do not double-wrap it manually.

Example:

```tsx
function Demo(props: {}, env: Env) {
  return (
    <>
      {/* DOM element target */}
      <div
        use={(target) => {
          if (target instanceof HTMLElement) target.dataset.mounted = 'yes'
        }}
      />

      {/* Component target */}
      <Counter
        use={(target) => {
          const first = Array.isArray(target) ? target[0] : target
          if (first instanceof HTMLElement) first.classList.add('mounted')
        }}
      />
    </>
  )
}
```

Notes:
- This is a convenience alternative to `use:name` when you don't need to reuse the behavior via `env`.
- Like `use:name`, it may return a cleanup function.
- Layered `use={...}` directives accumulate.
- `target`: `Node | Node[]` — the rendered node(s). For components, handle either a single node or an array.
- `value`: any | undefined — the value passed from `use:path={...}`; bare `use:path` yields `undefined`.
- `access`: `EffectAccess` — provides control over the reactive effect.
- **Effect-bound**: Called WITHIN a reactive effect; re-runs when `value` or other dependencies change.
- Return value: optional cleanup function `EffectCloser` (called on dispose/re-run), or nothing.


Example: resize mixin with ResizeObserver

```tsx
function ResizeSandbox(_props: {}, env: Env) {
  const size = reactive({ width: 0, height: 0 })

  env.resize = (target: Node | Node[], value: any, _env: Record<PropertyKey, any>) => {
    const element = Array.isArray(target) ? target[0] : target
    if (!(element instanceof HTMLElement)) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      size.width = Math.round(rect.width)
      size.height = Math.round(rect.height)
      if (typeof value === 'function') value(size.width, size.height)
    })
    ro.observe(element)
    return () => ro.disconnect()
  }

  return (
    <div
      style="resize: both; overflow: auto; border: 1px solid #ccc; padding: 8px; min-width: 120px; min-height: 80px;"
      use:resize={(w: number, h: number) => { size.width = w; size.height = h }}
    >
      {size.width} × {size.height}
    </div>
  )
}
```

Notes
- Works for both intrinsic elements and components.
- Treat component targets as arrays (`Node[]`); pick the first node if needed.
- Mixins can be reactive (they’ll re-run when `value` changes) and should return a cleanup function to unhook observers/listeners.

## `this` meta (refs)

Use the `this` attribute to capture a reference to either:
- **A DOM element** (for intrinsic elements like `div`, `input`, ...), or
- **The rendered output of a component** (treat as `Node | Node[]`).

Behavior
- `this` expects a callback.
- The value provided to your setter will be:
  - `HTMLElement` for regular DOM elements.
  - `Node | Node[]` for components, depending on their rendered output.
- On unlatch / cleanup, the callback is called again with `undefined`.

```tsx
const refs: Record<string, any> = {}

<input
  this={(node) => {
    refs.input = node
  }}
  value={state.sharedCount}
/>
```

Capture a component’s rendered nodes:

```tsx
const refs: Record<string, any> = {}

<CounterComponent
  this={refs.counter}
  count={state.sharedCount}
/>
```

Capture multiple component refs in a wrapper:

```tsx
const refs: Record<string, any> = {}

<WrapperComponent>
  <TodoComponent this={refs.todos} todos={todos} />
</WrapperComponent>
```

Notes
- Handle component refs as `Node | Node[]`. If you need a single node, pick the first when you receive an array.
- If your own ref abstraction differs, adapt it so the callback you pass to `this={...}` can accept `Node | Node[] | undefined`.
