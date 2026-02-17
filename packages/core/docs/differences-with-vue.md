## Differences with Vue

This guide highlights how Pounce‑TS (with `mutts` reactivity) differs from Vue 3.

### Reactivity and State
- **Direct mutation reactivity**: Pounce uses `reactive(...)` and direct mutations (`state.count++`). No `ref().value` indirection.
- **Derived values**: Use `memoize(() => ...)` and call it in JSX. Vue uses `computed(() => ...)` and reads `.value`.
- **Effects**: Use `effect(() => { ...; return () => cleanup })`. In Vue, use `watchEffect`/`watch` and lifecycle hooks.

### Props and Two‑Way Binding
- **Props are writeable**: Children can assign to `props.x` to update parent when the parent passed a reactive prop. Vue props are readonly (mutating them causes warnings); two‑way is via `v-model` or `update:modelValue` events.
- **Automatic two‑way binding for inputs**: `<input value={state.name} />` auto‑binds get/set (including type handling). In Vue use `v-model`/modifiers.
- **Explicit setters**: `update:prop={fn}` customizes set behavior.

### Templates vs JSX
- **JSX only**: Pounce uses JSX with a custom `h()`; Vue primarily uses templates (or JSX with a plugin). No VDOM in Pounce.
- **No VDOM**: Pounce updates the DOM directly with fine‑grained reactivity. Vue uses VDOM diffing (even with compiler optimizations).

### Control Flow and Lists
- **Attributes for control flow**: `if={...}`, `if:name={...}`, `when:name={...}`, `else`, `else if={...}`, `else when={...}` inside fragments. Vue uses `v-if`, `v-else-if`, `v-else`.
- **Lists**: Use `<for each={array}>` or `project(array, fn)` (optionally with `memoize`). Vue uses `v-for` with `:key`; Pounce does not require keys in typical cases.

### Context/Scope vs provide/inject
- **Reactive scope inheritance**: Components receive a prototype‑inherited reactive `scope`. Components can set `scope.foo = ...` and descendants see it. Vue uses `provide/inject` (explicit), not prototype inheritance.
- **`<scope>` helper**: Adds values/functions to `scope` for descendants without extra DOM.

### Refs and Directives
- **Refs via `this`**: `this={sink}` receives `HTMLElement` (elements) or `Node | Node[]` (components). Vue uses `ref`/`template ref` objects.
- **Directives via `use:`**: `use={...}` one‑shot mount callback, `use:name={value}` calls a scoped mixin (may return cleanup). Vue has `v-*` directives with lifecycle hooks.

### Events
- **Native DOM events**: `onClick`, `onInput`, … directly attach to DOM; no synthetic system. Vue uses event modifiers and emits for component events.

### Application Structure
- **Mounting**: `latch('#app', <App />)` vs `createApp(App).mount('#app')`.
- **No DI/runtime**: Pounce has no DI container; Vue has plugin system and app instance.

### Quick mapping
- **Derived state**: `memoize` vs `computed`.
- **Lists**: `<for>`/`project` vs `v-for`.
- **Two‑way input**: auto get/set vs `v-model`.
- **Context**: reactive `scope` vs provide/inject.
- **Rendering**: direct DOM vs VDOM.

See also:
- `docs/reactivity.md` (memoize, effect)
- `docs/binding.md` (two‑way binding and `update:prop`)
- `docs/advanced.md` (Scope, control flow, directives)
- `docs/api-reference.md`


