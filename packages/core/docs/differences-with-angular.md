## Differences with Angular

This guide highlights how Pounce‑TS (with `mutts` reactivity) differs from Angular (v16+ with signals, and earlier patterns).

### Reactivity and State
- **Direct mutation reactivity**: Pounce uses `reactive(...)` and direct mutations (`state.count++`). Angular signals use `signal()` with getters/setters (`count.set(count()+1)`), or component class fields with change detection.
- **Derived values**: Use `memoize(() => ...)` and call it in JSX. Angular uses `computed(() => ...)` for signals, or pipes for transformations in templates.
- **Effects**: Use `effect(() => { ...; return () => cleanup })`. Angular has `effect()` for signals and lifecycle hooks (`ngOnInit`, `ngOnDestroy`).

### Props vs Inputs/Outputs
- **Props are writeable**: A child can assign to `props.x` to update parent when parent passed a reactive prop. In Angular, `@Input()` is one‑way from parent, and mutations should flow via `@Output()` EventEmitters (or shared signal/state service).
- **Automatic two‑way input binding**: `<input value={state.name} />` auto‑binds get/set. Angular uses `[(ngModel)]` (FormsModule) or `[value]` + `(input)` events.
- **Explicit setters**: `update:prop={fn}` customizes set behavior; in Angular you’d handle in `(input)` or convert via form controls.

### Rendering Model
- **JSX and no VDOM**: Pounce uses JSX compiled to a custom `h()` and updates the real DOM directly. Angular uses templates compiled to instructions and runs change detection (signals or zone.js).
- **No DI / decorators**: Pounce has no dependency injection, decorators, or modules. Angular relies on DI, `@Component`, `@Injectable`, etc.

### Control Flow and Lists
- **Attributes for control flow**: `if={...}`, `if:path={...}`, `when:path={...}`, `else`, `else if={...}`, `else when={...}`. Paths support dash-separated keys (e.g., `if:user-role`). Angular uses `@if`/`*ngIf` and `@else` (or older structural directives), and `@for`/`*ngFor` with `trackBy`.

- **Lists**: Use `<for each={array}>` or `project(array, fn)` (optionally with `memoize`). Angular prefers `*ngFor` with `trackBy` for stability.

### Context/Env vs DI and Injection
- **Reactive env inheritance**: Components receive a prototype‑inherited reactive `env`. Components can set `env.foo = ...` and descendants see it. Angular uses DI/injector hierarchy and `@Input()`/providers; no prototype env.
- **`<env>` helper**: Adds values/functions to `env` for descendants without extra DOM.

### Refs and Meta-attributes
- **Refs via `this`**: `this={sink}` receives `HTMLElement` (elements) or `Node | Node[]` (components). Angular uses `@ViewChild`/`ElementRef` and template reference variables.
- **Meta-attributes via `use:`**: `use={...}` one‑shot mount callback, `use:name={value}` calls a env-based mixin (may return cleanup). Angular directives/components are class‑based with DI and lifecycle.

### Events
- **Native DOM events**: `onClick`, `onInput`, … directly attach to DOM. Angular uses `(click)`, `(input)` and `@Output()` for component events.

### Application Structure
- **Mounting**: `latch('#app', <App />)`. Angular bootstraps modules/standalone components with a platform bootstrap and DI.

### Quick mapping
- **Derived state**: `memoize` vs Angular `computed` (signals).
- **Lists**: `<for>`/`project` vs `*ngFor`/`@for`.
- **Two‑way input**: auto get/set vs `[(ngModel)]` or event bindings.
- **Context**: reactive `env` vs DI/injector tree.
- **Rendering**: direct DOM vs compiled instructions + change detection.

See also:
- `docs/reactivity.md` (memoize, effect)
- `docs/binding.md` (two‑way binding and `update:prop`)
- `docs/advanced.md` (Env, control flow, meta-attributes)
- `docs/api-reference.md`


