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
| `tail` | log-style "scroll-to-bottom" |

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

### Still missing

**Dockview**
- Entirely missing: `useDockview` hook (wraps dockview-core, widget/tab renderers, layout serialization)

### Remaining open items
- `useSelect` hook (native `<select>` wrapper with fullWidth, variant) — types present in `forms.ts`, hook body not implemented
- Directive/nav integration tests — jsdom lacks ResizeObserver/IntersectionObserver/scroll geometry; needs e2e or adapter-level tests
- Theme toggle component (adapter concern, not a hook)

---

## Implementation Status

### Tier 1 — Core interaction hooks ✅
1. ✅ `useButton` — tag, iconPosition (logical start/end, legacy left/right mapped), ariaProps
2. ✅ `useCheckbox`, `useRadio`, `useSwitch` — label, description, labelPosition, role, aria-checked
3. ✅ `useCheckButton` — toggle button, internal reactive checked, onCheckedChange, role="checkbox"
4. ✅ `useRadioButton` — button-style radio, group/value, role="radio"
5. ✅ `useAccordion` — open/onToggle, AccordionGroup name (exclusive-open via native `name`)
6. ✅ `useProgress` — indeterminate detection, aria attrs
7. ✅ `useCombobox` — stable listId for datalist linkage

### Tier 2 — Layout & composition ✅
8. ✅ `useCard` — structural no-op, sub-component pattern for adapter
9. ✅ `useStack`, `useInline`, `useGrid`, `useContainer`, `useAppShell` — SpacingToken, align/justify maps, shadowOnScroll
10. ✅ `setupButtonGroupNav`, `setupToolbarNav` — pure DOM keyboard nav utilities

### Tier 3 — Status & typography ✅
11. ✅ `useBadge`, `usePill`, `useChip` — icon, trailing icon, dismissible reactive state
12. ✅ `useHeading`, `useText`, `useLink` — level, align, size, muted, underline

### Tier 4 — Advanced form controls ✅
13. ⚠️ `useSelect` — types only, hook body not implemented
14. ✅ `useMultiselect` — generic T, Set-based, closeOnSelect
15. ✅ `useStars` — single/range, drag, readonly, icon names, reactive internal state

### Tier 5 — Directives ✅
16. ✅ `resize`, `scroll`, `intersect`, `loading`, `pointer`, `floatingBadge`, `tail`
    - `loading` correctly saves/restores pre-existing `disabled` state

### Tier 6 — Overlay system ✅
17. ✅ `applyTransition` — CSS class-based enter/exit with animationend/transitionend + timeout fallback
18. ✅ `createOverlayStack` — reactive stack, backdrop, Escape, onBackdropClick
19. ✅ `trapFocus`, `applyAutoFocus` — focus management utilities
20. ✅ `dialogSpec`, `toastSpec`, `drawerSpec` — OverlaySpec builders
21. ✅ `bindDialog`, `bindToast`, `bindDrawer` — convenience binders for env

### Tier 7 — Heavy components ✅ (partial)
22. ✅ `useInfiniteScroll` — fixed-height O(1) fast path + variable-height ResizeObserver + prefix-sum offset table
23. ✅ `useMenu`, `useMenuItem`, `useMenuBar` — details/summary semantics, dev-mode a11y checks, auto-close on link
24. ❌ `useDockview` — not implemented (dockview-core dependency, low priority)

---

## Implementation Priority (remaining)

### Next — Pico adapter catch-up (Hungry dogs 🐕)
All files marked `// TODO: Hungry dog` are implemented in `@pounce/ui` but have no pico adapter counterpart yet:

| Hook/Utility | File | Pico component needed |
|---|---|---|
| `useAccordion` | `accordion.ts` | `Accordion`, `AccordionGroup` |
| `useCard` | `card.ts` | `Card`, `Card.Header`, `Card.Body`, `Card.Footer` |
| `useCheckButton` | `checkbutton.ts` | `CheckButton` |
| `resize`, `scroll`, … | `directives.ts` | directive bindings |
| `useCombobox` | `forms.ts` | `Combobox`, `Select` |
| `useInfiniteScroll` | `infinite-scroll.ts` | `InfiniteScroll` |
| `useStack`, … | `layout.ts` | `Stack`, `Inline`, `Grid`, `Container`, `AppShell` |
| `useMenu` | `menu.ts` | `Menu`, `Menu.Item`, `Menu.Bar` |
| `useMultiselect` | `multiselect.ts` | `Multiselect` |
| `setupButtonGroupNav` | `nav.ts` | `ButtonGroup`, `Toolbar` |
| `createOverlayStack` | `overlays.ts` | `WithOverlays`, `Dialog`, `Drawer`, `Toast` |
| `useProgress` | `progress.ts` | `Progress` |
| `useRadioButton` | `radiobutton.ts` | `RadioButton` |
| `useStars` | `stars.ts` | `Stars` |
| `useBadge`, `usePill`, `useChip` | `status.ts` | `Badge`, `Pill`, `Chip` |
| `useHeading`, `useText`, `useLink` | `typography.ts` | `Heading`, `Text`, `Link` |

### Low priority / deferred
- `useDockview` — dockview-core integration
- Integration/e2e tests for directives and nav utilities

---

## Key Design Notes for v2 Hooks

### Hook vs Headless Component

**Rule:** use a `useXxx` hook for leaf controls; use a headless component for compound/coordinated controls.

A `useXxx` hook is sufficient when:
- The component is a single DOM element (or a label+input pair)
- No parent-child state coordination is needed
- No DOM access is required at the hook level (event wiring is done by the adapter)

A headless component is needed when:
- Multiple children share state managed by a parent (e.g. `RadioGroup` coordinating arrow-key nav across `Radio` children)
- Focus management requires DOM traversal across children (e.g. `ButtonGroup`, `Toolbar`, `Menu`)
- A portal or overlay lifecycle is involved (e.g. `Dialog`, `Drawer`, `Toast`)

| Control | Pattern | Reason |
|---------|---------|--------|
| Button, Checkbox, Radio, Switch, Progress, Badge, Chip, Stars | `useXxx` hook | Single element, no coordination |
| RadioGroup | Headless component | Arrow-key nav across children, shared selection state |
| ButtonGroup / Toolbar | Shared nav utility (`setupButtonGroupNav`) called via `use=` | DOM traversal, not reactive state |
| Select, Combobox, Multiselect | `useXxx` hook | Single element with internal state |
| Accordion / AccordionGroup | `useAccordion` hook + `AccordionGroup` headless component | Group exclusive-open needs parent coordination |
| Menu / MenuBar | Headless component | Compound (trigger + items), keyboard nav, a11y structure |
| Dialog, Drawer, Toast | Headless component | Focus trap, portal, overlay lifecycle |
| InfiniteScroll | `useInfiniteScroll` hook | All logic is self-contained in one scroll container |
| Dockview | `useDockview` hook | Wraps external lib, single container |

**There is no `HeadlessButton`, `HeadlessCheckbox`, etc.** — the `useXxx` hooks already are the headless layer. A headless component wrapper on top of a hook adds nothing for leaf controls.

---

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

- [x] Button — tag, iconPosition now logical (start/end), legacy left/right mapped in hook
- [x] Checkbox
- [x] Radio
- [x] Switch
- [ ] CheckButton
- [ ] RadioButton
- [ ] Accordion / AccordionGroup
- [ ] Progress
- [ ] Card / Card.Header / Card.Body / Card.Footer
- [ ] Stack / Inline / Grid / Container / AppShell
- [ ] ButtonGroup / Toolbar
- [ ] Badge / Pill / Chip
- [ ] Heading / Text / Link
- [ ] Select / Combobox / Multiselect / Stars
- [ ] Directives
- [ ] Overlay system (WithOverlays, Dialog, Drawer, Toast)
- [ ] InfiniteScroll / Menu
- [ ] ErrorBoundary / Dockview (deferred)
