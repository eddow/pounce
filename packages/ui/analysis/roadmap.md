# @pounce/ui v2 — Roadmap to Feature Parity with adapted-ui

> **Generated from a full line-by-line read of every source file in `packages/adapted-ui/src/`.
> Every feature listed here exists in adapted-ui. Nothing is speculative.**

---

## Inventory of adapted-ui (source of truth)

### Components (`src/components/`)
| Component | Key features |
|-----------|-------------|
| `Button` | variant, icon+iconPosition (start/end), tag (button/a/div/span), disabled, ariaLabel, perf marks, `renderStructure` adapter hook |
| `ButtonGroup` | orientation (horizontal/vertical), Arrow-key navigation within group, Tab exits to next focusable, toolbar segment cycling |
| `Toolbar` + `Toolbar.Spacer` | orientation, spacer (invisible flex-grow or visible divider), keyboard nav shared with ButtonGroup |
| `CheckButton` | toggle button with `role="checkbox"`, icon+iconPosition, internal reactive checked state, `onCheckedChange` |
| `RadioButton` | button-style radio with `role="radio"`, group/value binding (checked = group===value), icon+iconPosition, `renderStructure` adapter hook |
| `Checkbox` | label (string/element/attrs-object), description, variant tone class, `el` passthrough |
| `Radio` | same as Checkbox + group/value binding |
| `Switch` | same as Checkbox + `labelPosition` (start/end), `role="switch"`, `aria-checked`, visual track span |
| `Select` | native `<select>`, fullWidth, variant tone class |
| `Combobox` | `<input>` + `<datalist>`, options (string or {value,label}), generated id |
| `Multiselect` | `<details>`/`<summary>` dropdown, generic `T`, `Set<T>` value, `renderItem` callback, `closeOnSelect` |
| `Card` + `Card.Header/Body/Footer` | `<article>` root, sub-components via `Object.assign` |
| `Accordion` + `AccordionGroup` | native `<details>`/`<summary>`, `open`/`onToggle`, group for exclusive-open |
| `Progress` | native `<progress>`, indeterminate when value===undefined, aria attrs |
| `Badge` | tag, icon (leading), variant |
| `Pill` | tag, icon (leading), trailingIcon, variant |
| `Chip` | tag, icon, dismissible + dismiss button, `onDismiss`, reactive `local.open` |
| `Stars` | single value or `[min,max]` range, drag to adjust, double-click to collapse range, zeroElement, readonly, custom icon names (before/inside/after) |
| `InfiniteScroll` | virtualized list, fixed-height fast path OR variable-height with ResizeObserver + binary-search offset table, stickyLast, perf marks |
| `Dockview` | wraps `dockview-core`, widgets/tabs/headerLeft/headerRight/headerPrefix, reactive params, layout serialization, DefaultTab with close button |
| `ErrorBoundary` | `ErrorReceiver` inner pattern, `caught()`, fallback(error, {componentStack}), `onError`, `ProductionErrorBoundary` variant |
| `Menu` + `Menu.Item` + `Menu.Bar` | `<details>`/`<summary>` dropdown, a11y structure check in dev, auto-close on internal link click, responsive MenuBar (mobile hamburger / desktop inline) |
| `Stack` / `Inline` / `Grid` | flex/grid layout primitives, SpacingToken scale (none/xs/sm/md/lg/xl), align/justify maps |
| `Container` | fluid/fixed, dynamic tag |
| `AppShell` | sticky header, `shadowOnScroll` via scroll listener |
| `Heading` | levels 1-6, dynamic tag, align (start/center/end), variant color classes |
| `Text` | size (sm/md/lg), muted, variant color classes |
| `Link` | wraps `@pounce/kit`'s `A`, underline toggle, variant color classes |

### Directives (`src/directives/`)
| Directive | Description |
|-----------|-------------|
| `badge` | Floating badge on any element, position (top-right/top-left/bottom-right/bottom-left), variant, JSX content |
| `intersect` | IntersectionObserver wrapper |
| `loading` | Adds loading spinner overlay to element |
| `pointer` | Pointer events (down/move/up) with state |
| `resize` | ResizeObserver wrapper |
| `scroll` | Scroll position tracking (x/y) |
| `trail` | log-style "scroll-to-bottom" |

### Overlays (`src/overlays/`)
| Export | Description |
|--------|-------------|
| `WithOverlays` | Overlay host: stacks modal/drawer/toast layers, backdrop, focus trap (Tab), Escape to close, autoFocus strategies, nested level coordination via `env.overlayLevel` |
| `Dialog` | Modal overlay component |
| `Drawer` | Drawer overlay (left/right) |
| `Toast` | Toast notification overlay |
| `standard-overlays` | Pre-wired `extend` helpers for `env.dialog()`, `env.toast()`, etc. |
| `manager` | `OverlayEntry` type, `PushOverlayFunction` |

### Shared (`src/shared/`)
| File | Description |
|------|-------------|
| `variants.ts` | `variantProps(name)` — looks up adapter global variants dict; `asVariant(component)` — proxy for dot-syntax |
| `transitions.ts` | `getTransitionConfig(componentName?)`, `applyTransition(el, enter/exit, config, onComplete)` — CSS class-based enter/exit with animationend/transitionend + timeout fallback |
| `theme.ts` | Theme token helpers |

### Display (`src/display/`)
| File | Description |
|------|-------------|
| `theme-toggle.tsx` | Dark/light mode toggle component |

### Adapter system (`src/adapter/`)
The old adapter system (registry, `setAdapter`, `getAdapter`, `renderStructure` hook, `vanilla.ts`) is **replaced** in v2 by the "adapter as front" architecture. Adapters are now standalone packages that import hooks. No registry needed.

---

## What is NOT yet in @pounce/ui v2 hooks

### Missing hook logic

**Button / RadioButton**
- `tag` prop (dynamic element: button/a/div/span) — hook should expose `tag` default
- `perf` marks integration point — adapter concern, but hook could expose timing hooks
- `iconPosition` RTL/LTR awareness: `start`/`end` must map to `left`/`right` via `@pounce/kit`'s `biDi` or equivalent. **Currently the hook just passes `iconPosition` through — the adapter must resolve start/end to physical side using the document direction.**

**CheckButton**
- Entirely missing: toggle button with internal reactive checked state, `onCheckedChange`
- `role="checkbox"` semantics

**RadioButton (button-style)**
- Entirely missing: button-style radio (not `<input type=radio>`), `role="radio"`, group/value binding

**Switch**
- Missing: `labelPosition` (start/end) in hook state
- Missing: `role="switch"` + `aria-checked` in hook state
- Missing: visual track element hint

**Checkbox / Radio**
- Missing: `description` prop in hook state
- Missing: tone/variant class hint (hook should expose variant for adapter to map)

**Select**
- Entirely missing: `useSelect` hook (native `<select>` wrapper with fullWidth, variant)

**Combobox**
- Missing: `options` datalist rendering logic (currently hook is minimal)
- Missing: generated id for datalist linkage

**Multiselect**
- Entirely missing: `useMultiselect` hook (generic, Set-based, renderItem callback, closeOnSelect)

**Stars**
- Entirely missing: `useStars` hook (single/range value, drag logic, readonly, icon name resolution)

**InfiniteScroll**
- Entirely missing: `useInfiniteScroll` hook (virtualization, offset table, ResizeObserver, stickyLast)

**Dockview**
- Entirely missing: `useDockview` hook (wraps dockview-core, widget/tab renderers, layout serialization)

**ErrorBoundary**
- Entirely missing: `useErrorBoundary` hook (ErrorReceiver pattern, `caught()`, fallback)

**Menu**
- Entirely missing: `useMenu` hook (dropdown, a11y check, auto-close on link, MenuBar responsive)

**Accordion**
- Entirely missing: `useAccordion` hook (open/onToggle, group for exclusive-open)

**Card**
- Entirely missing: `useCard` hook (sub-components: Header/Body/Footer)

**Progress**
- Entirely missing: `useProgress` hook (indeterminate detection, aria attrs)

**Badge / Pill / Chip**
- Entirely missing: `useBadge`, `usePill`, `useChip` hooks
- Chip: dismissible state, `onDismiss`

**Typography (Heading / Text / Link)**
- Entirely missing: `useHeading`, `useText`, `useLink` hooks
- Heading: level 1-6, dynamic tag, align, variant color
- Text: size, muted, variant color
- Link: underline toggle, variant color

**Layout (Stack / Inline / Grid / Container / AppShell)**
- Entirely missing: layout hooks
- SpacingToken scale (none/xs/sm/md/lg/xl → CSS calc expressions)
- align/justify semantic maps
- AppShell: shadowOnScroll scroll listener

**ButtonGroup / Toolbar**
- Entirely missing: `useButtonGroup`, `useToolbar` hooks
- Complex keyboard navigation (Arrow keys within group, Tab exits, toolbar segment cycling)

### Missing directives (all)
- `badge` — floating badge with position, variant, JSX content
- `intersect` — IntersectionObserver
- `loading` — spinner overlay
- `pointer` — pointer events with state
- `resize` — ResizeObserver
- `scroll` — scroll position tracking
- `trail` — mouse trail

### Missing overlay system (all)
- `WithOverlays` host (stack, backdrop, focus trap, Escape, autoFocus, nested levels)
- `Dialog`, `Drawer`, `Toast` overlay components
- Transition system (`getTransitionConfig`, `applyTransition`)
- Standard overlay helpers (`env.dialog()`, `env.toast()`)

### Missing shared utilities
- RTL/LTR `start`/`end` → `left`/`right` resolution (via `@pounce/kit` `biDi` or equivalent)
- Transition config + apply (CSS class-based enter/exit)
- Theme toggle component

---

## Implementation Priority

### Tier 1 — Core interaction hooks (dogfood with pico adapter)
1. **Fix existing hooks** to expose missing state:
   - Button: expose `tag`, RTL note in types
   - Switch: expose `labelPosition`, `role`, `aria-checked`
   - Checkbox/Radio: expose `description`
2. **`useCheckButton`** — toggle button, internal checked, `onCheckedChange`, `role="checkbox"`
3. **`useRadioButton`** — button-style radio, group/value, `role="radio"`
4. **`useAccordion`** — open/onToggle, AccordionGroup name
5. **`useProgress`** — indeterminate, aria

### Tier 2 — Layout & composition
6. **`useCard`** — sub-component pattern (Header/Body/Footer)
7. **Layout hooks**: `useStack`, `useInline`, `useGrid`, `useContainer`, `useAppShell`
8. **`useButtonGroup`** / **`useToolbar`** — keyboard nav logic (Arrow keys, Tab, segment cycling)

### Tier 3 — Status & typography
9. **`useBadge`**, **`usePill`**, **`useChip`** — icon, trailing icon, dismissible
10. **`useHeading`**, **`useText`**, **`useLink`** — level, align, size, muted, underline

### Tier 4 — Advanced form controls
11. **`useSelect`** — fullWidth, variant
12. **`useMultiselect`** — generic T, Set value, renderItem, closeOnSelect
13. **`useStars`** — single/range, drag, readonly, icon names

### Tier 5 — Directives
14. **`resize`**, **`scroll`**, **`intersect`** — used internally by InfiniteScroll and overlays
15. **`loading`**, **`pointer`**, **`trail`**, **`badge`** directive

### Tier 6 — Overlay system
16. **Transition system** — `getTransitionConfig`, `applyTransition`
17. **`useOverlayManager`** — stack, backdrop, focus trap, Escape, autoFocus, nested levels
18. **`useDialog`**, **`useDrawer`**, **`useToast`**
19. **Standard overlay helpers**

### Tier 7 — Heavy components
20. **`useInfiniteScroll`** — virtualization, offset table, ResizeObserver, stickyLast
21. **`useErrorBoundary`** — ErrorReceiver pattern, `caught()`, fallback
22. **`useDockview`** — dockview-core integration, widget/tab renderers, layout serialization
23. **`useMenu`** + **`useMenuBar`** — dropdown, a11y check, responsive

---

## Key Design Notes for v2 Hooks

### RTL/LTR (iconPosition)
`iconPosition: 'start' | 'end'` must be resolved to physical `left`/`right` by the adapter using the document/element direction. The hook exposes `iconPosition` as-is; the adapter calls `@pounce/kit`'s `biDi` (or reads `document.dir`) to map start→left in LTR, start→right in RTL.

### Switch labelPosition
Same RTL concern: `labelPosition: 'start' | 'end'`. The CSS class `pounce-switch-label-start` uses `flex-direction: row-reverse` in adapted-ui — the adapter owns this mapping.

### Chip dismissible state
The `useChip` hook should own the `local.open` reactive state and expose `dismiss()` + `isVisible`. The adapter renders the dismiss button and calls `dismiss()`.

### Stars drag logic
The `useStars` hook owns all drag/click/dblclick logic and exposes per-star `status` ('before'/'inside'/'after'/'zero') as a function of index. The adapter renders the star elements and wires the event handlers from the hook.

### InfiniteScroll
The `useInfiniteScroll` hook owns the offset table, binary search, ResizeObserver, and stickyLast logic. It exposes `visibleIndices`, `totalHeight`, `itemTop(i)`, `itemMinHeight(i)`, and `onScroll`/`onResize` callbacks. The adapter renders the scroll container and item wrappers.

### ButtonGroup / Toolbar keyboard nav
The keyboard navigation logic (Arrow keys within group, Tab exits to next focusable outside group, toolbar segment cycling) is complex DOM-traversal code. It should live in a shared utility in `@pounce/ui` (not in the hook return value), exported as `setupButtonGroupNav(container)` and `setupToolbarNav(container)` — called by the adapter's `use=` mount callback.

### Overlay system
`WithOverlays` uses `env` (Pounce's component environment) to expose `env.overlay`, `env.dialog`, etc. to descendant components. The v2 equivalent needs a context mechanism — either Pounce's `env` passthrough or a reactive context store. This is the most architecturally complex piece.

### ErrorBoundary
Requires `caught()` from mutts and `reconcile`/`Env` from `@pounce/core`. The hook pattern here is unusual — it's more of a component pattern than a hook. The `ErrorReceiver` inner component approach should be preserved as-is in v2.

---

## Parallel pico adapter development

As each hook tier is completed, the pico adapter should implement the corresponding components. Current pico adapter status:

- [x] Button (partial — missing tag, RTL note)
- [x] Checkbox (partial — missing description)
- [x] Radio (partial — missing description)
- [x] Switch (partial — missing labelPosition, role, aria-checked)
- [ ] CheckButton
- [ ] RadioButton
- [ ] Accordion / AccordionGroup
- [ ] Progress
- [ ] Card / Card.Header / Card.Body / Card.Footer
- [ ] Stack / Inline / Grid / Container / AppShell
- [ ] ButtonGroup / Toolbar
- [ ] Badge / Pill / Chip
- [ ] Heading / Text / Link
- [ ] Select / Multiselect / Stars
- [ ] Directives
- [ ] Overlay system
- [ ] InfiniteScroll / ErrorBoundary / Dockview / Menu
