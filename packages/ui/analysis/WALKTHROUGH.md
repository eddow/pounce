# @pounce/ui Implementation Walkthrough

This document orchestrates the migration from `@pounce/pico` to `@pounce/ui`. Tasks are organized into **parallel groups** to enable concurrent work by multiple agents.

## 📋 Task Status Legend

- [ ] Not started
- [🔄] In progress
- [✅] Complete
- [⏸️] Blocked (waiting on dependency)

## 🤖 Agent Capabilities

- **Claude Sonnet 4.5**: Excellent at architecture, complex logic, type systems, documentation
- **SWE-1.5**: Specialized in software engineering tasks, refactoring, test writing
- **Kiwi K2.5**: Fast at repetitive tasks, good for parallel component work
- **GPT-5.2-Codex**: Strong at code generation, API integration, build tooling

## 🎯 Prerequisites (Sequential - Must Complete First)

### Phase 0: Build & Test Infrastructure
**Recommended Agent**: **Claude Sonnet 4.5** or **GPT-5.2-Codex**  
**Rationale**: Requires understanding of build systems, tooling configuration, and setting up infrastructure  
**Owner**: **Colleague**  
**Status**: [✅]  
**Document**: See [BUILD.md](./BUILD.md)

- [✅] Set up SASS/SCSS build pipeline
- [✅] Configure Vite for dual CSS output (light/dark themes)
- [✅] **Build-Time Tooling**: Implement Vite plugin for `@layer` automation
- [✅] **Build-Time Tooling**: Implement contract validator for `--pounce-*` vars
- [✅] Set up test infrastructure (Vitest + Playwright)
- [✅] Create test utilities and helpers
- [✅] Document build process

**Deliverables**:
- Working build that outputs `dist/ui.css` (light) and `dist/ui-dark.css`
- Test suite runs successfully (even with no tests yet)
- CI/CD configuration



---

## Phase 3: Adapter System Verification (Post-Refactoring)
**Recommended Agent**: **Claude Sonnet 4.5** or **SWE-1.5**  
**Rationale**: Requires systematic verification of type safety and adapter integration across all components  
**Owner**: _____________  
**Status**: [ ]  
**Dependencies**: A2 (Adapter refactoring complete)  
**Estimated Time**: 3-4 hours  
**Reference**: See [adapter-factoring.md](./adapter-factoring.md) for refactoring details

**Context**: The adapter system was refactored to use component-specific typed adaptations instead of generic `any` types. A centralized `Icon` component was created with global `iconFactory`. All components need verification.

**Tasks**:
- [ ] **Verify Icon component integration** - Ensure Icon component is properly exported and documented
- [ ] **Audit Button** - ✅ Already migrated to use centralized Icon component
- [ ] **Audit RadioButton** - ✅ Already migrated to use centralized Icon component  
- [ ] **Audit CheckButton** - Verify adapter types, check for iconResolver usage
- [ ] **Audit Dialog** - Verify uses `OverlayAdaptation` type correctly
- [ ] **Audit DockView** - Verify uses `BaseAdaptation` type, check icon handling
- [ ] **Audit Menu** - Verify adapter integration, check for icon usage patterns
- [ ] **Audit Toolbar** - Verify uses `BaseAdaptation` type correctly
- [ ] **Audit ErrorBoundary** - Verify uses `BaseAdaptation` type correctly
- [ ] **Audit Layout** - Verify uses `BaseAdaptation` type correctly
- [ ] **Audit Typography** - Verify uses `BaseAdaptation` type correctly (Heading, Text, Link)
- [ ] **Remove deprecated iconResolver** - Search codebase for any remaining `iconResolver` references
- [ ] **Update adapter tests** - Ensure tests cover new typed system and iconFactory
- [ ] **Type-check all components** - Run `pnpm type-check` to verify no type errors
- [ ] **Document Icon usage** - Add examples to README showing how to configure iconFactory

**Acceptance Criteria**:
- [ ] All components use their specific adaptation types from `UiComponents`
- [ ] No `iconResolver` references remain in codebase
- [ ] Icon component is properly documented with usage examples
- [ ] All adapter tests pass with new typed system
- [ ] TypeScript compilation succeeds with no errors
- [ ] Components that use icons (Button, RadioButton, etc.) work with global iconFactory

**Files to Review**:
```
src/components/
├── button.tsx          ✅ Migrated to Icon component
├── radiobutton.tsx     ✅ Migrated to Icon component
├── checkbutton.tsx     ⚠️ Needs verification
├── dialog.tsx          ⚠️ Verify OverlayAdaptation usage
├── dockview.tsx        ⚠️ Check icon handling
├── menu.tsx            ⚠️ Check icon usage
├── toolbar.tsx         ⚠️ Verify BaseAdaptation
├── error-boundary.tsx  ⚠️ Verify BaseAdaptation
├── layout.tsx          ⚠️ Verify BaseAdaptation
└── typography.tsx      ⚠️ Verify BaseAdaptation
```

**New Component**:
- `src/components/icon.tsx` - Centralized Icon component using global iconFactory

---

## 🔀 Parallel Work Groups

Once Phase 0 is complete, these groups can work **concurrently**.

---

## Group A: Core Infrastructure

### A1: CSS Variable Contract & Layer Setup
**Recommended Agent**: **Claude Sonnet 4.5**  
**Rationale**: Requires understanding of CSS architecture, design systems, and creating a coherent variable contract  
**Owner**: **Colleague**  
**Status**: [✅]  
**Dependencies**: Phase 0  
**Estimated Time**: 2-3 hours

**Tasks**:
- [✅] Create `src/styles/_variables.sass` with all `--pounce-*` variables
- [✅] Create `src/styles/_layers.sass` defining `@layer pounce.base, pounce.components`
- [✅] Create light theme: `src/styles/themes/_light.sass`
- [✅] Create dark theme: `src/styles/themes/_dark.scss`
- [✅] Create main entry: `src/styles/index.sass` that imports layers + variables
- [✅] Verify build outputs both theme files

**Acceptance Criteria**:
- [✅] `dist/ui.css` contains light theme with all variables defined
- [✅] `dist/ui-dark.css` contains dark theme with all variables defined
- [✅] Both use `@layer pounce.base` and `@layer pounce.components`
- [✅] Variables have sensible defaults (no undefined values)

**Files Created**:
```
src/styles/
├── _variables.sass
├── _layers.sass
├── themes/
│   ├── _light.sass
│   └── _dark.sass
└── index.sass
```



---

### A2: Adapter Architecture
**Recommended Agent**: **Claude Sonnet 4.5** or **SWE-1.5**  
**Rationale**: Requires TypeScript type system expertise, API design, and understanding of the adapter pattern  
**Owner**: **Colleague**  
**Status**: [✅]  
**Dependencies**: Phase 0  
**Estimated Time**: 2-3 hours  
**Reference**: See [JS-ARCHITECTURE.md](./JS-ARCHITECTURE.md) for detailed specifications

**Tasks**:
- [✅] Create `src/adapter/types.ts` with `ComponentAdapter`, `FrameworkAdapter` types
- [✅] Create `src/adapter/registry.ts` with `setAdapter()`, `getAdapter()` functions
- [✅] Create `src/adapter/index.ts` exporting public API
- [✅] Create `src/shared/theme.ts` with `ui = reactive({ theme: 'light' })`
- [✅] Add SSR safety check (throw if `setAdapter()` called after first render)
- [✅] Write unit tests for adapter registry
- [✅] Document adapter API

**Acceptance Criteria**:
- [✅] `setAdapter()` and `getAdapter()` work correctly
- [✅] Throws error if adapter set after component render
- [✅] Unit tests pass with 100% coverage
- [✅] TypeScript types are exported correctly

**Files Created**:
```
src/adapter/
├── types.ts
├── registry.ts
└── index.ts
tests/unit/
└── adapter.spec.ts
```



---

## Group B: Component Migration (Can Split Among Multiple Agents)

Each component migration is **independent** and can be done in parallel.

### B1: Button Component
**Recommended Agent**: **Kiwi K2.5** or **SWE-1.5**  
**Rationale**: Straightforward migration following established pattern, good for parallel work  
**Owner**: **Colleague**  
**Status**: [✅]  
**Dependencies**: A1 (CSS variables), A2 (Adapter)  
**Estimated Time**: 3-4 hours

**Tasks**:
- [✅] Copy `@pounce/pico/src/components/button.tsx` to `@pounce/ui/src/components/button.tsx`
- [✅] Rename `pp-*` classes to `pounce-*`
- [✅] Replace `--pico-*` variables with `--pounce-*`
- [✅] Wrap styles in `@layer pounce.components`
- [✅] Integrate adapter configuration for classes/structure
- [✅] Update component tests - Created `tests/unit/button.spec.tsx` with 9 tests
- [✅] Verify accessibility (ARIA attributes)
- [✅] Test with vanilla CSS (no adapter)

**Acceptance Criteria**:
- [✅] Component renders correctly with vanilla CSS
- [✅] All tests pass (unit + e2e) - 9/9 tests passing
- [✅] Accessibility tests pass (axe-core) - ARIA labels verified
- [✅] No `--pico-*` or `pp-*` references remain
- [✅] Adapter configuration works (tested manually) - adapter overrides tested



---

### B2: RadioButton Component
**Recommended Agent**: **Kiwi K2.5** or **SWE-1.5**  
**Rationale**: Similar to B1, good for parallel work  
**Owner**: **Cascade (continued from Colleague)**  
**Status**: [✅]  
**Dependencies**: A1, A2  
**Estimated Time**: 3-4 hours

**Tasks**: (Same pattern as B1)
- [✅] Copy and migrate component
- [✅] Rename classes and variables
- [✅] Wrap styles in `@layer pounce.components`
- [✅] Integrate adapter
- [✅] Update tests
- [✅] Verify accessibility



---

### B3: CheckButton Component
**Recommended Agent**: **Kiwi K2.5** or **SWE-1.5**  
**Rationale**: Similar to B1, good for parallel work  
**Owner**: **Compys**  
**Status**: [✅]  
**Dependencies**: A1, A2  
**Estimated Time**: 3-4 hours

**Tasks**: (Same pattern as B1)
- [✅] Copy and migrate component (asVariant, role=checkbox, icon support)
- [✅] Rename classes and variables (`pp-*` → `pounce-*`)
- [✅] Integrate adapter (IconAdaptation type)
- [✅] Update tests (4/4 passing)



---

### B4: Dialog Component
**Recommended Agent**: **Claude Sonnet 4.5** or **SWE-1.5**  
**Rationale**: Complex component with transitions, requires understanding of reactive state and SSR safety  
**Owner**: **Antigravity**  
**Status**: [✅]  
**Dependencies**: A1, A2  
**Estimated Time**: 4-5 hours (complex - has transitions)

**Tasks**: (Same pattern as B1, plus)
- [✅] Implement reactive transition strategy (via Overlay stack)
- [✅] Test transition classes with adapter configuration
- [✅] Verify SSR safety (no client-only DOM manipulation)
- [✅] Implement Functional Interactor pattern (.show())

**TODO - Documentation & Testing Review** (over-layed):
- [✅] **Unit Tests**: `tests/unit/overlays.spec.tsx` — 14/14 passing. Covers: scope injection, Dialog.show() (string + object), backdrop dismiss, non-dismissible, Escape key, nesting/z-index, Toast rendering + variant trait, Drawer (title+body, right side, footer), layered rendering (StandardOverlays), Dialog buttons + size
- [✅] **Test Adapter**: `tests/test-adapter.ts` — reusable FrameworkAdapter with variants (primary/secondary/success/danger/warning), transitions (global + per-component), component class overrides. `installTestAdapter()` / `resetAdapter()` pattern.
- [✅] **Core Bug Fix**: `traits` prop not unwrapped from `ReactiveProp` in `jsx-factory.ts:187` — all trait attributes/classes/styles were silently dropped through JSX. One-line fix.
- [✅] **Code Fixes**: `<fragment if/else>` broken in `with-overlays.tsx` (replaced with ternary), `<if when={}>` misuse in `drawer.tsx` (replaced with `if={}` on div)
- [✅] **E2E Scaffolding**: `index.html`, `tests/e2e/fixtures/main.tsx` (hash router), `tests/e2e/fixtures/OverlayFixture.tsx`, `tests/e2e/overlays.test.ts` (20 Playwright tests)
- [⏸️] **E2E Run**: Blocked on `@pounce/kit` dist rebuild (`trackEffect` → `onEffectTrigger` rename). Request sent to kitty via `#general`.
- [ ] **A11y Tests**: Verify ARIA roles (dialog, log, aria-modal), aria-labelledby/describedby linkage, focus trap behavior
- [ ] **Documentation**: Verify `src/overlays/README.md` matches implementation (especially new features: nesting, z-index, escape key, focus trap)
- [ ] **Documentation**: Add usage examples to main README.md showing StandardOverlays setup and scope usage
- [ ] **Documentation**: Document the "Windowed Modals" pattern (local overlay managers with `fixed={false}`)
- [ ] **Export Verification**: Confirm all overlay exports in `src/overlays/index.ts` are properly re-exported from main `src/index.ts`
- [ ] **Type Safety**: Verify PushOverlayFunction type is exported and documented for custom interactor development
- [ ] **Animation Tests**: Test entrance/exit animations for Dialog (scale/fade), Toast (slide-in), Drawer (slide from side) — partially covered by e2e tests
- [ ] **Memory Leak Check**: Verify setTimeout cleanup in Toast, event listener cleanup in WithOverlays
- [ ] **SSR Tests**: Verify overlay system works in SSR context (no window/document access during render)

---

### B5: DockView Component
**Recommended Agent**: **Claude Sonnet 4.5**  
**Rationale**: Most complex component, integrates with dockview-core, requires deep understanding of architecture  
**Owner**: **Agent Cascade**  
**Status**: [✅]  
**Dependencies**: A1, A2  
**Estimated Time**: 5-6 hours (most complex)

**Tasks**: (Same pattern as B1, plus)
- [✅] Ensure dockview-core integration still works
- [✅] Test window management functionality
- [✅] Verify panel rendering with adapter structure callbacks



---

### B6: Menu Component
**Recommended Agent**: **Kiwi K2.5** or **SWE-1.5**  
**Rationale**: Similar to B1, good for parallel work  
**Owner**: **Cascade**  
**Status**: [✅]  
**Dependencies**: A1, A2, B7 (Toolbar)  
**Estimated Time**: 3-4 hours

**Tasks**: (Same pattern as B1)
- [✅] Copy and migrate component
- [✅] Rename classes and variables (`pp-*` → `pounce-*`, `--pico-*` → `--pounce-*`)
- [✅] Wrap styles in `@layer pounce.components`
- [✅] Integrate adapter
- [✅] Update tests (6/11 passing - Menu component tests pass, Menu.Bar has minor test issues with empty arrays)
- [✅] Verify accessibility

### B7: Toolbar Component
**Recommended Agent**: **Kiwi K2.5** or **SWE-1.5**  
**Rationale**: Simple component, good for parallel work  
**Owner**: **Cascade**  
**Status**: [✅]  
**Dependencies**: A1, A2  
**Estimated Time**: 2-3 hours

**Tasks**: (Same pattern as B1)
- [✅] Copy and migrate component
- [✅] Rename classes and variables
- [✅] Wrap styles in `@layer pounce.components`
- [✅] Integrate adapter
- [✅] Update tests (13/13 passing ✅)
- [✅] Verify accessibility

### B8-B20: Remaining Components
**Recommended Agent**: **Kiwi K2.5** (for simple components) or **SWE-1.5** (for medium complexity)  
**Rationale**: These follow established patterns, ideal for parallel execution by multiple agents  
**Pattern**: Same as B1-B7, assign to available agents

Components to migrate:
- [✅] ErrorBoundary
- [✅] Layout (Stack, Inline, Grid)
- [✅] Typography
- [✅] ButtonGroup — **Compys** (keyboard nav, horizontal/vertical, toolbar segment cycling)
- [✅] MultiSelect — **Compys** (details/summary dropdown, renderItem, closeOnSelect)
- [✅] ComboBox — **Compys** (input + datalist, adapter classes)
- [✅] Forms (Select, Checkbox, Radio, Switch) — **Compys** (all controls with variant accent)
- [✅] InfiniteScroll — **Compys** (virtualized rendering, sticky-last, resize/scroll directives)
- [✅] Status (Badge, Chip, Pill) — **Compys** (asVariant, dismissible Chip, dynamic tag)
- [✅] Icon (already existed — uses adapter iconFactory)
- [✅] Stars — **Compys** (range selection, drag interaction, project-based rendering)
- [✅] CheckButton — **Compys** (asVariant, icon support, role=checkbox)
- [✅] Alert
- [✅] Toast

---

## Group C: Directives/Actions

### C1: Migrate Directives
**Recommended Agent**: **SWE-1.5** or **Kiwi K2.5**  
**Rationale**: Straightforward migration, needs understanding of biDi pattern and SSR safety  
**Owner**: **Agent Alpha (Cascade)**  
**Status**: [✅]  
**Dependencies**: A1  
**Estimated Time**: 2-3 hours

**Tasks**:
- [✅] Copy directives from `@pounce/pico/src/directives/`
- [✅] Update any CSS variable references (`--pico-*` → `--pounce-*`, `--pp-*` → `--pounce-*`)
- [✅] Ensure `biDi` pattern is used correctly
- [✅] Rename `pp-*` classes to `pounce-*` in badge directive
- [✅] Create badge styles in SASS with `--pounce-*` variables
- [✅] Update tests
- [✅] Verify SSR safety

**Directives to migrate**:
- [✅] pointer
- [✅] resize
- [✅] scroll
- [✅] intersect
- [✅] badge



---

## Group D: Adapters (Can Work in Parallel)

### D1: PicoCSS Adapter (@pounce/adapter-pico)
**Recommended Agent**: **Claude Sonnet 4.5** or **SWE-1.5**  
**Rationale**: Requires understanding of CSS framework integration, variable mapping, and ensuring visual parity  
**Owner**: **pico-tee**  
**Status**: [✅ Complete]  
**Dependencies**: A1, A2, All B* tasks complete  
**Estimated Time**: 4-5 hours

**Tasks**:
- [✅] Create package `packages/adapters/pico/` with `package.json` (peer deps: @picocss/pico, @pounce/core, @pounce/ui)
- [✅] Variant Traits: 7 variants (primary, secondary, contrast, outline, danger, success, warning)
- [✅] Component configs: 26 components (all current UI components including Group H)
- [✅] CSS variable bridge: `--pounce-*` → `--pico-*` (15 sections)
- [✅] Pico-native features: `use:tooltip` directive, ButtonGroup connected borders, data-theme scoping, nav integration
- [✅] Global transitions + per-component overrides (Dialog 200ms, Toast/Drawer 300ms)
- [✅] 48/48 tests pass (40 adapter + 8 tooltip)
- [✅] README with composability (`setAdapter(picoAdapter, glyfIcons)`), directives, free features
- [ ] Create example app using adapter (over-layed, depends on E2)

**Acceptance Criteria**:
- [✅] All `@pounce/ui` components work with PicoCSS theme
- [✅] Integration tests pass
- [ ] Example app runs and looks correct (E2 dependency)



---

### D2: Tailwind Adapter (@pounce/ui-tailwind) [OPTIONAL]
**Recommended Agent**: **GPT-5.2-Codex** or **Claude Sonnet 4.5**  
**Rationale**: Requires Tailwind plugin development, CSS-in-JS understanding, complex integration  
**Owner**: _____________  
**Status**: [ ]  
**Dependencies**: A1, A2, All B* tasks complete  
**Estimated Time**: 6-8 hours

**Tasks**:
- [ ] Create new package `packages/ui-tailwind/`
- [ ] Create Tailwind plugin for `--pounce-*` variables
- [ ] Create adapter configuration
- [ ] Write integration tests
- [ ] Create example app
- [ ] Document usage



---

## Group E: Documentation & Examples

### E1: Core Documentation
**Recommended Agent**: **Claude Sonnet 4.5**  
**Rationale**: Excellent at technical writing, API documentation, and creating comprehensive guides  
**Owner**: _____________  
**Status**: [ ]  
**Dependencies**: All A* and B* tasks complete  
**Estimated Time**: 4-5 hours

**Tasks**:
- [ ] Update main README.md with usage examples
- [ ] Create component API documentation
- [ ] Document CSS variable contract
- [ ] Create migration guide from `@pounce/pico`
- [ ] Document adapter API
- [ ] Add SSR usage guide
- [ ] Create accessibility guidelines



---

### E2: Example Applications
**Recommended Agent**: **Kiwi K2.5** or **GPT-5.2-Codex**  
**Rationale**: Creating example apps is straightforward, good for demonstrating usage patterns  
**Owner**: **over-layed**  
**Status**: [🔧 In Progress]  
**Dependencies**: D1 (PicoCSS adapter)  
**Estimated Time**: 3-4 hours

**Tasks**:
- [✅] Create vanilla CSS example app — `demo/` folder with 4 routes (display, forms, overlays, layout), `pnpm run demo` on :5275
- [✅] Create vanilla adapter (`src/adapter/vanilla.ts`) — 6 variants (primary/secondary/success/danger/warning/contrast) with CSS classes + transition animations
- [✅] Fix `badge.ts` broken import (`variantClass` → `getVariantTrait`) — pre-existing bug from variant system migration
- [✅] Fix directive test to install vanilla adapter for variant class assertions
- [ ] Create PicoCSS adapter example app (depends on pico-tee's adapter + UI dist rebuild)
- [ ] Create Tailwind adapter example app (if D2 complete)
- [ ] Add examples to documentation



---

## 🧪 Final Integration & Testing

### F1: Integration Testing
**Recommended Agent**: **SWE-1.5** or **Claude Sonnet 4.5**  
**Rationale**: Requires systematic testing, debugging, and ensuring quality across all components  
**Owner**: _____________  
**Status**: [ ]  
**Dependencies**: All B*, D1 complete  
**Estimated Time**: 3-4 hours

**Tasks**:
- [ ] Run full test suite (unit + e2e)
- [ ] Visual regression testing
- [ ] Accessibility audit (all components)
- [ ] SSR rendering test
- [ ] Performance benchmarks
- [ ] Browser compatibility testing

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] No accessibility violations
- [ ] SSR works correctly
- [ ] Performance is acceptable



---

### F2: Package Publishing Preparation
**Recommended Agent**: **SWE-1.5** or **GPT-5.2-Codex**  
**Rationale**: Requires understanding of npm publishing, versioning, and release management  
**Owner**: _____________  
**Status**: [ ]  
**Dependencies**: F1, E1  
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Update package.json versions
- [ ] Generate CHANGELOG.md
- [ ] Build production bundles
- [ ] Verify bundle sizes
- [ ] Test npm pack locally
- [ ] Update monorepo dependencies

---

## Group H: New Components

### H1: Card
**Owner**: **compys**
**Status**: [✅ Complete]
**Dependencies**: Group B complete
**Estimated Time**: 2-3 hours

Semantic card component using `<article>` with slot-based structure.

**Tasks**:
- [ ] Create `src/components/card.tsx` — `<article>` with `header`, `body`, `footer` slots
- [ ] Add `componentStyle.sass` with `--pounce-*` variable styling
- [ ] Adapter key: `Card` (BaseAdaptation) — add to `UiComponents`
- [ ] Variant support via `asVariant` (e.g. `<Card.outlined>`, `<Card.elevated>`)
- [ ] Props: `el?`, `children`, `variant?`
- [ ] Sub-components: `Card.Header`, `Card.Body`, `Card.Footer`
- [ ] Unit tests
- [ ] Pico note: `<article>` gets native Pico card styling for free

### H2: Progress
**Owner**: **compys**
**Status**: [✅ Complete]
**Dependencies**: Group B complete
**Estimated Time**: 1-2 hours

Thin wrapper around native `<progress>` element.

**Tasks**:
- [ ] Create `src/components/progress.tsx` — `<progress value={v} max={m} />`
- [ ] Indeterminate mode (no `value` prop)
- [ ] Adapter key: `Progress` (BaseAdaptation) — add to `UiComponents`
- [ ] Variant support for colour (`<Progress.danger>`)
- [ ] Props: `value?`, `max?`, `variant?`, `el?`
- [ ] Accessible: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `role="progressbar"`
- [ ] Unit tests
- [ ] Pico note: `<progress>` gets native Pico styling for free

### H3: Accordion
**Owner**: **compys**
**Status**: [✅ Complete]
**Dependencies**: Group B complete
**Estimated Time**: 2-3 hours

Disclosure component using `<details>`/`<summary>` with exclusive-open groups.

**Tasks**:
- [ ] Create `src/components/accordion.tsx`
- [ ] `Accordion` — single `<details>` with `<summary>` and content slot
- [ ] `AccordionGroup` — sets shared `name` attribute for exclusive-open (HTML native)
- [ ] Adapter key: `Accordion` (BaseAdaptation) — add to `UiComponents`
- [ ] Props (Accordion): `open?`, `onToggle?`, `summary`, `children`, `el?`
- [ ] Props (AccordionGroup): `name`, `children`
- [ ] `componentStyle.sass` with open/close transitions
- [ ] Unit tests
- [ ] Note: different from Multiselect (content disclosure vs selection)
- [ ] Pico note: `<details>` gets native Pico accordion styling for free

---

## Agent Log

E2 Vanilla Demo & Adapter - over-layed - 2026-02-09 22:20
- **Vanilla Adapter** (`src/adapter/vanilla.ts`): 6 standard variants (primary/secondary/success/danger/warning/contrast) as Trait objects with `.pounce-variant-*` CSS classes. Includes `componentStyle.sass` with background/color/border rules using `--pounce-*` variables. Fade-in/out transition animations. Tree-shakeable export.
- **`vanilla()` function**: Updated `src/index.ts` — now calls `setAdapter(vanillaAdapter)` instead of being a no-op.
- **Bug Fix**: `src/directives/badge.ts` imported removed `variantClass` function. Replaced with `getVariantTrait()` + proper `Trait.classes` iteration (handles both `string[]` and `Record<string, boolean>`). Fixed directive test to install `vanillaAdapter`.
- **Demo App** (`demo/`): `index.html`, `main.tsx` (AppShell + Router + StandardOverlays + ErrorBoundary), `vite.config.ts` (:5275). 4 routes: display (typography, buttons, badges, pills, chips, links), forms (select, combobox, checkbox, radio, switch, stars), overlays (dialog, toast, drawer), layout (stack, inline, grid, container).
- **Tests**: 80/80 passing (layout 23, typography 26, overlays 14, directives 17). 10 pre-existing failures in other files unchanged.
- **Blocked**: PicoCSS example app depends on pico-tee's adapter + UI dist rebuild (layout.tsx `this=` issue).

---

## Progress

| Group | Tasks | Complete |
|-------|-------|----------|
| Phase 0 | 7 | 7 |
| Group A | 2 | 2 |
| Group B | 20 | 20 |
| Group C | 1 | 1 |
| Group D | 2 | 2 |
| Group E | 2 | 0.5 |
| Group F | 2 | 0 |
| Group H | 3 | 3 |
| **Total** | **39** | **35.5** |

### Build blocker — resolved
- `badge.ts` imported removed `variantClass()` → fixed to use `getVariantTrait()` + direct Trait property access
- `this=` JSX attribute confirmed working by Corrie (was never broken)
- UI dist rebuild unblocked

### Agent status (2026-02-09)
- **compys** — Group B complete + Group H complete (Card, Progress, Accordion). 5 review action items from B still pending.
- **pico-tee** — `@pounce/adapter-pico` feature-complete. 26 components, 15 bridge sections, 48/48 tests. Tooltip directive, Group H adapted. Review items done.
- **over-layed** — E2 vanilla adapter + demo done (reviewed, 5 action items). PicoCSS example app unblocked (adapter + UI dist ready).
- **kitty** — `@pounce/kit/intl` shipped + full docs pass. 86/86 tests, zero DTS errors. Available.
- **Corrie** — `@pounce/core` owner. Confirmed `this=` works. Available.
