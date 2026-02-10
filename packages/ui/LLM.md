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
| DisplayProvider | `display/display-context.tsx` | Scope-based theme/dir/locale, nestable, `data-theme` on own element |
| ThemeToggle | `display/theme-toggle.tsx` | Split-button UX: quick toggle + dropdown with auto/dark/light |
| useDisplayContext | `display/display-context.tsx` | `useDisplayContext(scope)` → `DisplayContext` (falls back to system defaults) |

### Overlays & Error Handling
| Component | File | Adapter Key |
|-----------|------|-------------|
| Dialog | `overlays/` | `Dialog` (OverlayAdaptation) |
| Toast | `overlays/` | `Toast` (OverlayAdaptation) |
| Drawer | `overlays/` | `Drawer` (OverlayAdaptation) |
| ErrorBoundary | `error-boundary.tsx` | `ErrorBoundary` |
| DockView | `dockview.tsx` | `Dockview` |

## Migration Pattern (from pico)
- `pp-*` → `pounce-*` classes
- `--pico-*` → `--pounce-*` CSS variables
- `componentStyle.sass` for default styles (injected once)
- `getAdapter('Name')` for class overrides
- `getVariantTrait()` + `asVariant()` for variant-aware components
- Form inputs: explicit `type` attribute (avoids TS union narrowing issues with `compose`)

## ⚠️ Critical
- **SSR Safety**: `@pounce/ui` works in SSR. Kit uses dual entry-points (auto-selects `kit/dom` or `kit/node`)
- **No `as any`**: All adapter types are strongly typed. `getAdapter<T>()` returns `UiComponents[T]`.
- **Adapter before render**: `setAdapter()` must be called before any component renders (SSR safety lock)
- **Test adapter**: `tests/test-adapter.ts` provides `installTestAdapter()` with all component class overrides

## Documentation
- `./README.md` — Full component API reference with usage examples and prop tables
- `./analysis/` — Internal architectural docs (variants, adapter factoring, orthogonal concerns, etc.)
- `./analysis/WALKTHROUGH.md` — Master task list and migration status

## Upcoming
- **Form validation & loading** — `loading` prop (Button), `valid` prop (form controls), `aria-busy`/`aria-invalid`. Big TODO, needs design pass.

## Known Issues
- ~~`this=` ref pattern~~ — ✅ Confirmed working by Corrie. Real build blocker was stale `variantClass` import in `badge.ts` — fixed.
- ButtonGroup global keydown handler is over-broad (matches any `[role="group"]`) — compys to narrow

## Status
🚧 Under development — all components migrated (35.5/39 WALKTHROUGH tasks complete), adapter system operational, `@pounce/adapter-pico` functional, not yet production-ready.

## DisplayContext Architecture
- **Kit provides**: `client.prefersDark()`, `client.direction`, `client.language` — raw system values
- **UI provides**: `DisplayProvider` component reads kit values as root defaults, manages `auto` resolution chain
- **Scope key**: `scope.display` — set by `DisplayProvider`, read by `useDisplayContext(scope)`
- **Icon integration**: `Icon` component reads `DisplayContext` from scope, passes to `iconFactory`
- **Kit/intl hook**: `setLocaleResolver()` can be wired to read `scope.display.locale`
- **Nesting**: child providers inherit from parent, override only specified axes
- **DOM**: `<div class="pounce-display-provider" data-theme dir lang>` with `display: contents`
