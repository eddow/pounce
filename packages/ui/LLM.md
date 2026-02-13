# @pounce/ui LLM Cheat Sheet
Read [pounce core' LLM](../core/LLM.md)
## Overview
Framework-agnostic UI component library for Pounce applications. Evolved from `@pounce/pico` to support any CSS framework.

## Architecture
- **Core Package**: `@pounce/ui` — Components with minimal styling and CSS variable contract (`--pounce-*`)
- **Adapters**: Framework-specific integrations in `packages/adapters/` (`@pounce/adapter-pico`, etc.)
- **Composable**: `setAdapter(...adapters)` accepts variadic `Partial<FrameworkAdapter>`, merges left-to-right (deep merge for variants/components, last-wins for iconFactory/transitions)

## Key Concepts
1. **Variants are Trait objects** — `Record<string, Trait>` in the adapter, looked up via `getVariantTrait(name)`. No default variants in UI.
2. **`asVariant(Component)`** — Proxy wrapper enabling `<Button.danger>` dot-syntax flavoring
3. **Centralized Icon** — Global `iconFactory` in adapter, used via `<Icon name="..." />` component
4. **Typed adaptations** — `UiComponents` maps each component to its specific adaptation type (`IconAdaptation`, `OverlayAdaptation`, etc.)
5. **Transition helpers** — `getTransitionConfig()` and `applyTransition()` in `src/shared/transitions.ts`
6. **ErrorBoundary** — Uses inner ErrorReceiver pattern with `onEffectThrow` (not try-catch)

## Component Inventory

### Buttons & Controls
| Component | File | Variant | Adapter Key |
|-----------|------|---------|-------------|
| Button | `button.tsx` | `asVariant` | `Button` (IconAdaptation) |
| CheckButton | `checkbutton.tsx` | `asVariant` | `CheckButton` (IconAdaptation) |
| RadioButton | `radiobutton.tsx` | `asVariant` | `RadioButton` (IconAdaptation) |
| ButtonGroup | `buttongroup.tsx` | — | `ButtonGroup` |

### Form Controls
| Component | File | Adapter Key |
|-----------|------|-------------|
| Select | `forms.tsx` | `Select` |
| Combobox | `forms.tsx` | `Combobox` |
| Checkbox | `forms.tsx` | `Checkbox` |
| Radio | `forms.tsx` | `Radio` |
| Switch | `forms.tsx` | `Switch` |
| Multiselect | `multiselect.tsx` | `Multiselect` |

### Status Indicators
| Component | File | Variant | Adapter Key |
|-----------|------|---------|-------------|
| Badge | `status.tsx` | `asVariant` | `Badge` |
| Pill | `status.tsx` | `asVariant` | `Pill` |
| Chip | `status.tsx` | `asVariant` | `Chip` |

### Structure
| Component | File | Variant | Adapter Key |
|-----------|------|---------|-------------|
| Accordion | `accordion.tsx` | — | `Accordion` |
| Card | `card.tsx` | — | `Card` |
| Progress | `progress.tsx` | — | `Progress` |

### Data & Content
| Component | File | Adapter Key |
|-----------|------|-------------|
| Stars | `stars.tsx` | `Stars` |
| InfiniteScroll | `infinite-scroll.tsx` | `InfiniteScroll` |
| Icon | `icon.tsx` | — (uses global iconFactory) |

### Layout & Typography
| Component | File | Adapter Key |
|-----------|------|-------------|
| Stack, Inline, Grid | `layout.tsx` | `Layout` |
| Heading, Text, Link | `typography.tsx` | `Heading`, `Text`, `Link` |
| Toolbar | `toolbar.tsx` | `Toolbar` |
| Menu | `menu.tsx` | `Menu` |

### Display & Theming
| Component | File | Notes |
|-----------|------|-------|
| DisplayProvider | `@pounce/kit/display` | Scope-based theme/dir/locale, nestable, `data-theme` on own element |
| ThemeToggle | `display/theme-toggle.tsx` | Split-button UX: quick toggle + dropdown with auto/dark/light |
| useDisplayContext | `@pounce/kit/display` | `useDisplayContext(scope)` → `DisplayContext` (falls back to system defaults) |

### Overlays & Error Handling
| Component | File | Adapter Key |
|-----------|------|-------------|
| Dialog | `overlays/` | `Dialog` (OverlayAdaptation) |
| Toast | `overlays/` | `Toast` (OverlayAdaptation) |
| Drawer | `overlays/` | `Drawer` (OverlayAdaptation) |
| ErrorBoundary | `error-boundary.tsx` | `ErrorBoundary` |
| DockView | `dockview.tsx` | `Dockview` |

## ⚠️ Critical
- **SSR Safety**: `@pounce/ui` works in SSR. Kit uses dual entry-points (auto-selects `kit/dom` or `kit/node`)
- **No `as any`**: All adapter types are strongly typed. `getAdapter<T>()` returns `UiComponents[T]`.
- **Adapter before render**: `setAdapter()` must be called before any component renders (SSR safety lock)
- **Test adapter**: `tests/test-adapter.ts` provides `installTestAdapter()` with all component class overrides

## InfiniteScroll Variable-Height Architecture
- **Fixed mode** (`itemHeight: number`): fast path — `floor(scrollTop/h)` for start, `ceil(viewportH/h)` for count. Items get `contain: strict`.
- **Variable mode** (`itemHeight: (item, i) => number`): prefix-sum offset array (`Float64Array`) + binary search for visible range. `estimatedItemHeight` (default 40) used for unmeasured items.
- **Offset table**: `heightCache[i]` stores per-item height, `offsets[i]` stores cumulative offset. `rebuildOffsets(from, count)` is O(n-i) partial recalc.
- **ResizeObserver**: each variable-mode item gets observed via `data-vindex` attribute. Measurements batched via `requestAnimationFrame`.
- **Scroll anchoring**: when items above viewport change height, `scrollTop` is adjusted by the delta to prevent content jumps.
- **Rendering**: `{() => computeVisibleIndices().map(renderItem)}` pattern. `project()` is **incompatible** with pounce's render pipeline for components with effects (creates nested batch/effect conflicts). Items don't render in jsdom unit tests — this is a pre-existing limitation of the `{() => ...}` pattern (babel double-wraps it).
- **Memory**: `Float64Array` with doubling growth via `ensureCapacity()` — efficient for 100k+ items.

## Directives
| Directive | File | Value Type | Notes |
|-----------|------|------------|-------|
| `use:loading` | `directives/loading.ts` | `boolean` | Sets `aria-busy="true"`, adapter class, `disabled` on form elements. Pico gets free spinner via `[aria-busy]`. |
| `use:badge` | `directives/badge.ts` | `BadgeInput` | Floating badge overlay on any element |
| `use:scroll` | `directives/scroll.ts` | `ScrollOptions` | Two-way scroll position binding |
| `use:resize` | `directives/resize.ts` | `object\|fn` | Two-way size binding via ResizeObserver |
| `use:intersect` | `directives/intersect.ts` | `IntersectOptions` | IntersectionObserver wrapper |
| `use:pointer` | `directives/pointer.ts` | `PointerState` | Pointer position tracking |
| `use:trail` | `directives/trail.ts` | `TrailOptions` | Keeps scrollable container pinned to bottom, disengages on user scroll-up |

## Known Issues
(none)

## DisplayContext Architecture
- **Kit provides**: `client.prefersDark()`, `client.direction`, `client.language` — raw system values
- **Kit provides**: `DisplayProvider` component reads kit values as root defaults, manages `auto` resolution chain
- **Scope key**: `scope.display` — set by `DisplayProvider`, read by `useDisplayContext(scope)`
- **Icon integration**: `Icon` component reads `DisplayContext` from scope, passes to `iconFactory`
- **Kit/intl hook**: `setLocaleResolver()` can be wired to read `scope.display.locale`
- **Nesting**: child providers inherit from parent, override only specified axes
- **DOM**: `<div class="pounce-display-provider" data-theme dir lang>` with `display: contents`
