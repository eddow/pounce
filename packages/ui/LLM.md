# @pounce/ui LLM Cheat Sheet

Read [pounce core's LLM](../core/LLM.md) and [kit's LLM](../kit/LLM.md).

## Overview

**Headless** UI primitives for Pounce applications. Zero styling, zero class names, zero opinions on CSS frameworks. Provides:
- Behavioral logic (state, a11y, event handling) via composable `use*` hooks
- Shared prop interfaces that adapters extend
- Icon registration (the one true cross-cutting concern)
- `uiComponent` factory for variant typing + dot-syntax
- `options` object for global configuration

## Architecture: Adapter as Front

**Old model (adapted-ui)**: App → `@pounce/ui` Button → checks adapter registry → falls back to vanilla classes.

**New model**: App → `@pounce/pico` Button → uses `useButton()` from `@pounce/ui` → zero styling.

```
@pounce/ui (headless)
  └── useButton(props) → { onClick, isIconOnly, ariaProps, ... }

@pounce/pico (styled)
  └── Button = uiComponent(['primary','danger'] as const)(function Button(props) {
        const state = useButton(props)
        return <button class={`btn-${props.variant}`} onClick={state.onClick}>...</button>
      })
```

## `options` Object

Single mutable config object — same pattern as `reactiveOptions` in mutts.

```ts
import { options } from '@pounce/ui'

// Set icon renderer once at app startup:
options.iconFactory = (name, size) => <i class={`icon-${name}`} />

// Register known variant names (for dev-mode warnings):
options.variants.add('primary')
options.variants.add('danger')
```

**Fields:**
- `options.iconFactory: IconFactory | undefined` — renders `<Icon name="star" />`. Falls back to `<span data-icon="name">name</span>` if unset.
- `options.variants: Set<string>` — known variant names. `uiComponent` warns in dev when an unknown variant is passed.

## `uiComponent` — Variant Factory

Curried factory. Call once per adapter with the variant list; wrap each component with the result.

```ts
import { uiComponent } from '@pounce/ui'

// Adapter creates its factory once (variants as const → infers V type):
const picoComponent = uiComponent(['primary', 'secondary', 'danger', 'ghost'] as const)

// Each component is wrapped:
export const Button = picoComponent(function Button(props) {
  // props.variant is typed as 'primary' | 'secondary' | 'danger' | 'ghost' | undefined
  return <button class={`btn btn-${props.variant ?? 'default'}`}>{props.children}</button>
})

// Usage — both equivalent:
<Button variant="primary">Save</Button>
<Button.primary>Save</Button.primary>
```

**What `uiComponent` does:**
1. Narrows `props.variant` to the declared union type
2. Adds dot-syntax accessors (`Button.primary`, `Button.danger`, …)
3. In dev: warns if `props.variant` is not in `options.variants`
4. Sets `component.name` for devtools

**What `uiComponent` does NOT do:** variant-to-attrs mapping, class generation, theme handling — all adapter concerns.

## Hook Pattern

Each component domain exports a `use*` hook returning a plain object of lazy getters:

```ts
export function useButton(props: ButtonProps): ButtonState {
  return {
    get onClick() { return props.disabled ? undefined : props.onClick },
    get isIconOnly() { return !!props.icon && !this.hasLabel },
    get ariaProps() { return { 'aria-label': ..., 'aria-disabled': ... } },
  }
}
```

All properties are **getters** — no reactive reads at hook call time. Safe to call in component body.

## Source Map

```
src/
├── index.ts              # Barrel: options, uiComponent, Icon, all hooks
├── options.ts            # options object (iconFactory, variants)
├── component.ts          # uiComponent factory, UiComponent type, WithVariant type
├── button/
│   ├── use-button.ts     # useButton(props) → ButtonState
│   ├── types.ts          # ButtonProps, ButtonState
│   └── index.ts
├── checkbox/
│   ├── use-checkbox.ts   # useCheckbox(props) → ControlState
│   ├── use-radio.ts      # useRadio(props) → RadioState
│   ├── types.ts          # CheckboxProps, RadioProps, SwitchProps, ControlState, RadioState
│   └── index.ts
├── forms/
│   ├── use-combobox.ts   # useCombobox(props) → ComboboxState (datalist id)
│   ├── types.ts          # SelectProps, ComboboxProps, ComboboxOption, …
│   └── index.ts
└── shared/
    ├── types.ts          # DisableableProps, VariantProps, IconProps, CheckedProps, …
    └── id.ts             # generateId(prefix?) utility
```

**Note:** `Icon` component and `IconFactory` type live in `options.ts` / re-exported from root. No `icon/` subfolder.

## Key Differences from adapted-ui

| Concern | adapted-ui | @pounce/ui v2 |
|---------|-----------|---------------|
| Class names | Hardcoded fallbacks | None |
| Adapter registry | `setAdapter/getAdapter` | Removed |
| Variants | Global `variants` dict + `asVariant` proxy | `uiComponent` factory, adapter owns mapping |
| `toneClass` | Hack in forms.tsx | Deleted |
| SASS in components | Yes (vanilla styles) | None |
| Global config | Multiple accessor functions | Single `options` object |

## ⚠️ Gotchas

1. **No JSX in hooks**: `use*` hooks return plain objects, not JSX. Adapters own the JSX.
2. **Reactive getters**: All state properties are getters — never read them at hook call time.
3. **Variant is a string**: `props.variant` is always the string name. The adapter maps it to classes/attrs.
4. **`options.variants` is for dev warnings only**: It does not drive any runtime behavior beyond the console warning.
5. **`uiComponent` is curried**: First call takes the variant list, second call takes the component function.
