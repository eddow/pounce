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
- **Attributes for control flow**: `if={...}`, `if:name={...}`, `when:name={...}`, `else`, `else if={...}`, `else when={...}`. Angular uses `@if`/`*ngIf` and `@else` (or older structural directives), and `@for`/`*ngFor` with `trackBy`.
- **Lists**: Use `<for each={array}>` or `project(array, fn)` (optionally with `memoize`). Angular prefers `*ngFor` with `trackBy` for stability.

### Context/Scope vs DI and Injection
- **Reactive scope inheritance**: Components receive a prototype‑inherited reactive `scope`. Components can set `scope.foo = ...` and descendants see it. Angular uses DI/injector hierarchy and `@Input()`/providers; no prototype scope.
- **`<scope>` helper**: Adds values/functions to `scope` for descendants without extra DOM.

### Refs and Directives
- **Refs via `this`**: `this={sink}` receives `HTMLElement` (elements) or `Node | Node[]` (components). Angular uses `@ViewChild`/`ElementRef` and template reference variables.
- **Directives via `use:`**: `use={...}` one‑shot mount callback, `use:name={value}` calls a scoped mixin (may return cleanup). Angular directives/components are class‑based with DI and lifecycle.

### Events
- **Native DOM events**: `onClick`, `onInput`, … directly attach to DOM. Angular uses `(click)`, `(input)` and `@Output()` for component events.

### Application Structure
- **Mounting**: `bindApp(<App />, '#app')`. Angular bootstraps modules/standalone components with a platform bootstrap and DI.

### Quick mapping
- **Derived state**: `memoize` vs Angular `computed` (signals).
- **Lists**: `<for>`/`project` vs `*ngFor`/`@for`.
- **Two‑way input**: auto get/set vs `[(ngModel)]` or event bindings.
- **Context**: reactive `scope` vs DI/injector tree.
- **Rendering**: direct DOM vs compiled instructions + change detection.

See also:
- `docs/reactivity.md` (memoize, effect)
- `docs/binding.md` (two‑way binding and `update:prop`)
- `docs/advanced.md` (Scope, control flow, directives)
- `docs/api-reference.md`


