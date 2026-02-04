## Differences with React

This guide highlights how Pounce‑TS (powered by the `mutts` reactivity engine) differs from React. If you’re familiar with React, these notes will help you transfer mental models and avoid common pitfalls.

### Reactivity and State
- **Direct mutation reactivity**: In Pounce‑TS, reactive state is created with `reactive(...)` and you mutate it directly. No `useState`, no setter functions.
  - Example: `state.count++` or `state.user.name = 'Alice'` immediately updates the DOM where used.
- **Derived values**: Use `memoize(() => ...)` for derived state; use the memoized function directly in JSX. In React you’d typically use `useMemo`.
- **Effects**: Use `effect(() => { ...; return () => cleanup })` instead of `useEffect`. Effects run synchronously after mutations and can return cleanups.

### Props and Data Flow
- **Props are writeable**: Children can update props (two‑way by default for simple property accesses). In React, props are read‑only.
  - Example: `props.count = props.count + 1` updates the parent state if the parent passed a reactive prop.
- **Two‑way binding by default**: When you write `<input value={state.name} />` or `<Child count={state.count} />`, the Babel transform auto‑generates `{ get, set }` bindings for simple property accesses. React requires wiring `value` + `onChange` manually.
- **Explicit update hooks**: Use `update:prop={fn}` to customize setters, e.g. `<input value={state.age} update:value={(v) => state.age = Number(v)} />`.

### JSX and Rendering Model
- **No Virtual DOM**: Pounce‑TS updates the real DOM directly with fine‑grained reactivity. There’s no reconciliation against a VDOM tree.
- **Custom JSX pragma**: JSX compiles to a custom `h()` which returns mountable renderers. Expressions like `{state.count}` are treated as reactive getters (no component re‑render loop).
- **Event handlers**: Use `onClick`, `onInput`, etc. Events are native DOM events (no React synthetic event system). Handlers are attached and cleaned up reactively.
- **Class vs className**: Use `class` (not `className`). You can pass strings, arrays, or objects; reactive forms are supported.
- **Style**: You can pass strings or objects; reactive style functions are supported and applied directly to DOM.

### Control Flow and Lists
- **Built‑in condition attributes**: Instead of ternaries in JSX, use:
  - `if={boolean}`
  - `if:name={value}` (strict comparison against `scope.name`)
  - `when:name={arg}` (calls `scope[name](arg)` and checks truthiness)
  - `else`, `else if={...}` and `else when={...}` chaining inside a fragment
- **Lists**: Prefer `<for each={array}>` with a render function. You can also use `project(array, fn)` for reactive mappings; combine with `memoize` for stable item rendering when needed. Keys are not required; stability is handled by the renderer/memoization and, if keys are needed, mutts offers a `register` class (extended array with key)

### Scope vs Context
- **Scope inheritance**: Instead of React Context Providers, Pounce‑TS uses a prototype‑inherited, reactive `scope` object passed to components.
  - Components can directly modify their `scope` (e.g., `scope.myContextualValue = { happy: true }`), and descendants immediately see those changes.
  - Use `<scope ...>` to inject values/functions into the `scope` for descendants without a wrapper node.
  - Conditional attributes (`if:name`, `when:name`) and mixins (`use:name`) read from `scope`.

### Refs and Mount Hooks
- **Refs via `this`**: Use the `this` attribute to receive the rendered target.
  - Elements: `HTMLElement`
  - Components: the rendered target (treat as `Node | Node[]` defensively)
- **Mixins with `use:`**: Attach behaviors at mount time.
  - `use={callback}` for a one‑shot mount hook.
  - `use:name={value}` to call a scoped mixin that may react to `value` and return a cleanup.

### Forms and Two‑Way Binding
- **Automatic binding**: `<input value={state.text} />` auto‑binds get/set, including type‑aware handling for `checkbox`, `number`, `range`, etc.
- **One‑way binding**: Pass reactive functions or `computed(...)` for read‑only values.
- **Custom transforms**: Use `update:prop={...}` when you need validation or transformation.

### Lifecycle and Debugging
- **Lifecycle via effects**: Use `effect()` inside components; return a cleanup to run on unmount reactivity.
- **Debug utilities**: `namedEffect(name, fn)` and `onEffectTrigger(cb)` help trace reactive changes during development.

### App Mounting
- **Mount without ReactDOM**: Use `bindApp(<App />, '#app')` to render into a container. No `createRoot` or portals.

### Summary Table
- **State updates**: mutate reactive objects directly vs. React’s `setState`/`useState`.
- **Props**: writeable, support two‑way updates vs. read‑only in React.
- **Events**: native DOM events vs. synthetic.
- **Control flow**: declarative attributes (`if`, `else`, `when`) vs. inline JS/ternaries.
- **Context**: prototype‑inherited reactive `scope` and `<scope>` vs. Context API.
- **Refs**: `this={refSink}` receiving `HTMLElement | Node | Node[]` vs. `ref` objects.
- **Lists**: `<for>`/`project(+memoize)` vs. `array.map` with keys.
- **Rendering**: direct DOM updates (no VDOM) vs. VDOM diffing.

### Further Reading
- See `docs/reactivity.md` for reactive state, computed values, and effects.
- See `docs/binding.md` for two‑way binding on inputs and component props.
- See `docs/advanced.md` for `Scope`, conditionals, lists, styling, and mixins.
- See `docs/api-reference.md` for full API details.


