# @sursaut/ui Reconstruction Walkthrough

**Date**: 2026-02-19  
**Architect**: Cascade  
**Context**: Complete rewrite from `packages/adapted-ui` (archived as `adapted-ui/`). No backward compatibility.

---

## 1. Why a Rewrite?

The old `@sursaut/ui` (now in `packages/adapted-ui/`) had a fundamental architectural inversion:

```
App → @sursaut/ui Button → checks adapter registry → falls back to vanilla classes
```

**Problems diagnosed:**

### 1.1 `toneClass` — the smoking gun
```typescript
// adapted-ui/src/components/forms.tsx:128
function toneClass(variant?: string): string | undefined {
    if (!variant || Object.keys(variantProps(variant)).length > 0) return undefined
    return `sursaut-control-${variant}`
}
```
This function exists because the adapter system couldn't cleanly handle variant-to-class mapping for form controls. It's a workaround for a broken model — if the adapter doesn't know the variant, fall back to a hardcoded `sursaut-control-*` class. The variant system and the class fallback system were fighting each other.

### 1.2 Hardcoded fallbacks everywhere
Every component had patterns like:
```typescript
adapter.classes?.base || 'sursaut-button'
adapter.classes?.iconOnly || 'sursaut-button-icon-only'
```
These aren't true fallbacks — they're **vanilla defaults masquerading as generic code**. The entire SASS block in each component file is vanilla-specific styling that ships to every consumer regardless of their CSS framework.

### 1.3 Pico adapter was just class name remapping
`adapted-ui/packages/adapters/pico/src/components.ts` was 254 lines of:
```typescript
Button: { classes: { base: 'sursaut-button', iconOnly: 'sursaut-button-icon-only' } }
```
It couldn't express Pico's actual semantics: Pico styles `<button>` natively — no classes needed at all. The adapter model couldn't represent "use native element, no classes."

### 1.4 `renderStructure` escape hatch
The `renderStructure` callback in `BaseAdaptation` was the adapter's way to completely override component DOM structure. If you needed that, the adapter system was already failing you — you were essentially rewriting the component inside a callback.

### 1.5 `asVariant` proxy coupled to the registry
`Button.danger` worked via a `Proxy` that injected `variant: 'danger'` into props, which then called `getGlobalVariants()['danger']` to get JSX-spreadable attributes. This meant variant resolution was always runtime-registry-dependent, not statically analyzable.

---

## 2. The New Architecture: Adapter as Front

```
App → @sursaut/pico Button → useButton() from @sursaut/ui → zero styling
```

### 2.1 Core principle
`@sursaut/ui` is now **headless**: pure logic, pure types, zero class names, zero SASS. It provides:
- `use*` hooks returning reactive state objects
- Shared prop type interfaces
- The `<Icon>` component + `setIconFactory()` (the only true cross-cutting concern)

### 2.2 Why Icon is the only global
Icons are the one thing that genuinely needs to be registered globally:
- Every component that has an icon prop needs the same renderer
- The renderer is framework-agnostic (it just returns a `JSX.Element`)
- It's a pure factory — no state, no side effects, no coupling

Everything else (variants, class names, DOM structure) belongs to the adapter.

### 2.3 Hook pattern
```typescript
// @sursaut/ui
export function useButton(props: ButtonProps): ButtonState {
    return {
        get onClick() { ... },      // lazy getter — no reactive read at call time
        get isIconOnly() { ... },
        get ariaProps() { ... },
    }
}

// @sursaut/pico
import { useButton } from '@sursaut/ui'

export const Button = (props: ButtonProps) => {
    const state = useButton(props)
    return (
        <button onClick={state.onClick} {...state.ariaProps}>
            {props.children}
        </button>
    )
}
```

All state properties are **getters** — they don't read reactive state at hook call time. The Sursaut babel plugin wraps JSX attribute expressions in `r()`, so `onClick={state.onClick}` becomes reactive automatically.

---

## 3. What Was Deleted

| Old concept | Reason deleted |
|-------------|---------------|
| `setAdapter / getAdapter` | Registry model inverted — adapters now own components |
| `FrameworkAdapter` type | Replaced by direct imports |
| `UiComponents` registry type | No longer needed |
| `BaseAdaptation / IconAdaptation` | Replaced by `use*` hook return types |
| `renderStructure` callback | Adapters own JSX — no escape hatch needed |
| `toneClass()` | Was a hack; deleted |
| `asVariant()` proxy | Adapter's choice — can re-implement if desired |
| `variantProps()` | Adapter's concern |
| `vanillaAdapter` | Vanilla is just another adapter now |
| All SASS in components | Moved to adapter packages |
| `vanilla()` init function | No init needed |

---

## 4. Package Structure

```
packages/ui/
├── src/
│   ├── index.ts              # Barrel: re-exports all hooks + Icon
│   ├── shared/
│   │   ├── types.ts          # DisableableProps, VariantProps, IconProps, ...
│   │   └── id.ts             # generateId() utility
│   ├── icon/
│   │   ├── registry.ts       # setIconFactory, getIconFactory, resetIconFactory
│   │   ├── icon.tsx          # <Icon> component
│   │   └── index.ts
│   ├── button/
│   │   ├── types.ts          # ButtonProps, ButtonState
│   │   ├── use-button.ts     # useButton(props) → ButtonState
│   │   └── index.ts
│   ├── checkbox/
│   │   ├── types.ts          # CheckboxProps, RadioProps, SwitchProps, ControlState, RadioState
│   │   ├── use-checkbox.ts   # useCheckbox(props) → ControlState
│   │   ├── use-radio.ts      # useRadio(props) → RadioState
│   │   └── index.ts
│   └── forms/
│       ├── types.ts          # SelectProps, ComboboxProps, ComboboxOption, ...
│       ├── use-combobox.ts   # useCombobox(props) → ComboboxState
│       └── index.ts
├── package.json              # @sursaut/ui v2.0.0
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── biome.json
├── LLM.md
└── analysis/
    └── reconstruction.md    # ← this file
```

---

## 5. Tooling Decisions

All versions aligned with the most recent versions used across the monorepo:

| Tool | Version | Source |
|------|---------|--------|
| `typescript` | `^5.9.3` | core, kit, pico |
| `vite` | `^7.3.1` | kit, pico |
| `vitest` | `^4.0.18` | core, kit, pico |
| `vite-plugin-dts` | `^4.5.3` | core, kit, pico |
| `@biomejs/biome` | `^2.3.13` | kit |
| `@types/node` | `^25.1.0` | kit |
| `jsdom` | `^27.4.0` | kit |
| `pnpm` | `10.30.0` | all packages |

`tsconfig.json` follows the same pattern as `@sursaut/kit`: `moduleResolution: bundler`, `jsx: react` with `jsxFactory: h`, `types: ["node", "@sursaut/core"]`.

---

## 6. What Still Needs to Be Built

The skeleton covers the most-used component domains. Remaining hooks to implement as the adapter(s) are built:

| Domain | Hook(s) needed | Source in adapted-ui |
|--------|---------------|---------------------|
| CheckButton | `useCheckButton` | `components/checkbutton.tsx` |
| RadioButton | `useRadioButton` | `components/radiobutton.tsx` |
| ButtonGroup | `useButtonGroup` | `components/buttongroup.tsx` |
| Stars | `useStars` | `components/stars.tsx` |
| Multiselect | `useMultiselect` | `components/multiselect.tsx` |
| InfiniteScroll | `useInfiniteScroll` | `components/infinite-scroll.tsx` |
| Accordion | `useAccordion` | `components/accordion.tsx` |
| Menu | `useMenu` | `components/menu.tsx` |
| Overlays | `useDialog`, `useToast`, `useDrawer` | `overlays/` |
| Layout | stays as component (no hook) | `components/layout.tsx` |
| Typography | stays as component (no hook) | `components/typography.tsx` |
| DisplayProvider | stays as component (no hook) | `display/` |
| ThemeToggle | stays as component (no hook) | `display/theme-toggle.tsx` |

**Rule**: Components that are purely structural/layout (no behavioral state) stay as components in the adapter. Components that have non-trivial behavioral logic (state machines, a11y, event handling) get a `use*` hook in `@sursaut/ui`.

---

## 7. Migration Guide for Adapters

### Before (adapted-ui)
```typescript
// adapter registers config
import { setAdapter } from '@sursaut/ui'
setAdapter({
    components: {
        Button: { classes: { base: 'my-btn' } }
    }
})

// app uses generic component
import { Button } from '@sursaut/ui'
<Button.primary>Click</Button.primary>
```

### After (new model)
```typescript
// adapter exports its own components
// @my-adapter/button.tsx
import { useButton, type ButtonProps } from '@sursaut/ui'

export const Button = (props: ButtonProps) => {
    const state = useButton(props)
    return <button class="my-btn" onClick={state.onClick} {...state.ariaProps}>{props.children}</button>
}

// app imports from adapter directly
import { Button } from '@my-adapter'
<Button onClick={...}>Click</Button>
```

### Icon registration (simplified API via options)
```typescript
// Before (adapted-ui)
setAdapter({ iconFactory: (name, size, ctx) => <i class={`icon-${name}`} /> })

// After
import { options } from '@sursaut/ui'
options.iconFactory = (name, size, dc) => <i class={`icon-${name}`} />
```
The `DisplayContext` parameter is removed — icons don't need theme/direction context at the `@sursaut/ui` level. If an adapter needs it, it wraps `setIconFactory` with its own context.

---

## 8. Test Strategy

- **`@sursaut/ui` tests**: Unit-test hooks in isolation. No DOM needed for most — hooks return plain objects.
- **Adapter tests**: Test the rendered JSX structure. Use `jsdom` + sursaut test utilities.
- **No test adapter to publish**: A minimal test setup in `vitest.config.ts` suffices (inherits from monorepo base config).

```typescript
// Example: testing useButton in isolation
import { useButton } from '@sursaut/ui'

test('disabled button has no onClick', () => {
    const state = useButton({ disabled: true, onClick: vi.fn() })
    expect(state.onClick).toBeUndefined()
})

test('icon-only when icon present and no children', () => {
    const state = useButton({ icon: 'star' })
    expect(state.isIconOnly).toBe(true)
})
```

---

## Current Status (2026-02-19)

### ✅ Complete
- **Package Structure**: All config files, TypeScript, Vite, Biome setup
- **Headless Hooks**: Button, Checkbox, Radio, Switch, Combobox with lazy getters
- **Global Options**: Single `options` object with `iconFactory` and `variants: Set<string>`
- **Variant Factory**: `uiComponent(['primary','danger'] as const)(function Button(props){...})`
  - Curried API, infers variant union type
  - Dot-syntax accessors (`Button.primary`)
  - Dev-mode unknown variant warnings
- **Documentation**: LLM.md updated to reflect actual implementation
- **Barrel Plugin**: The docs app (`packages/docs`) already has this right in `vite.config.ts` — it configures the `@sursaut` barrel plugin with the `adapter` and imports components from `@sursaut`.

### 🚧 In Progress
- **Reference Adapter**: `@sursaut/adapter-pico` skeleton created
  - Package structure, factory, setup utilities
  - Button, Checkbox, Radio, Switch implemented
  - CSS customizations for PicoCSS

### 📋 Next Steps
See **[roadmap.md](./roadmap.md)** for detailed plan to reach feature parity with adapted-ui.

Key priorities:
1. Core components: Card, Accordion, Modal, Tabs, Alert
2. Overlay patterns (Portal, FocusTrap)
3. Advanced components: Table, Tree, Dockview
4. Performance testing and optimization
