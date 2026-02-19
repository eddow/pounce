# @pounce/ui LLM Cheat Sheet

Read [pounce core's LLM](../core/LLM.md) and [kit's LLM](../kit/LLM.md).

## Overview

**Headless** UI primitives for Pounce applications. Zero styling, zero class names, zero opinions on CSS frameworks. Provides:
- Behavioral logic (state, a11y, event handling) via composable `use*` hooks
- Shared prop interfaces that adapters extend
- Icon registration via `options.iconFactory`
- `uiComponent` factory for variant typing + dot-syntax
- `options` object for global configuration
- RTL/LTR resolution via `relativeSide()` using `DisplayContext` from `@pounce/kit`

## Architecture: Adapter as Front

**Old model (adapted-ui)**: App → `@pounce/ui` Button → checks adapter registry → falls back to vanilla classes.

**New model**: App → `@pounce/pico` Button → uses `useButton()` from `@pounce/ui` → zero styling.

```
@pounce/ui (headless)
  └── useButton(props, env) → { onClick, isIconOnly, iconPosition, ariaProps, ... }

@pounce/pico (styled)
  └── Button = picoComponent(function Button(props, env) {
        const state = useButton(props, env)
        return <button onClick={state.onClick}>...</button>
      })
```

## `env.dc` — DisplayContext

`@pounce/kit` injects a `DisplayContext` into the Pounce `Env` under the key `dc`.
Components and hooks access it as `env.dc`. It carries:
- `direction: 'ltr' | 'rtl'`
- `theme: string`
- `locale: string`
- `timeZone: string`

Hooks that need direction (e.g. `useButton`) receive `env: Env` and read `env.dc`.
The `Icon` component also receives `env` and passes `env.dc` to `iconFactory`.

`uiComponent` forwards `env` to the wrapped component automatically.

## `options` Object

Single mutable config object.

```ts
import { options } from '@pounce/ui'
options.iconFactory = (name, size, dc) => <i class={`icon-${name}`} />
```

**Fields:**
- `options.iconFactory: IconFactory | undefined` — `(name, size, context: DisplayContext) => JSX.Element`. Falls back to `<span data-icon>` if unset.

## `uiComponent` — Variant Factory

Curried factory. Call once per adapter with the variant list; wrap each component with the result.

```ts
const picoComponent = uiComponent(['primary', 'secondary', 'danger', 'ghost'] as const)

export const Button = picoComponent(function Button(props, env) {
  const state = useButton(props, env)
  return <button class={`btn btn-${props.variant ?? 'default'}`}>{props.children}</button>
})

// Usage — both equivalent:
<Button variant="primary">Save</Button>
<Button.primary>Save</Button.primary>
```

**What it does:** narrows `props.variant`, adds dot-syntax accessors, forwards `env`, dev-mode unknown-variant error.

**What it does NOT do:** variant-to-attrs mapping, class generation, theme handling — all adapter concerns.

## Hook Pattern

Each component domain exports a `use*` hook returning a plain object of lazy getters:

```ts
export function useButton(props: ButtonProps, env: Env): ButtonState {
  return {
    get onClick() { return props.disabled ? undefined : props.onClick },
    get iconPosition() { if (props.icon) return relativeSide(env.dc, props.iconPosition) },
    get ariaProps() { return { 'aria-label': ..., 'aria-disabled': ... } },
  }
}
```

All properties are **getters** — no reactive reads at hook call time. Safe to call in component body.

## RTL/LTR — `relativeSide`

`shared/utils.ts` exports `relativeSide(dc, side)`:
- Input: `LogicalSide` = `'start' | 'end' | 'left' | 'right'`
- Output: `PhysicalSide` = `'left' | 'right'`
- `'left'`/`'right'` pass through; `'start'`/`'end'` resolve using `dc.direction`

The adapter receives physical sides and can use them directly in CSS/style.

## Source Map

```
src/
├── index.ts          # Barrel export — single entry point, tree-shakeable
├── options.ts        # options.iconFactory, IconFactory type
├── component.ts      # uiComponent factory, UiComponent/WithVariant types
├── icon.tsx          # <Icon> component (uses env.dc + options.iconFactory)
├── button.ts         # ButtonProps, ButtonState, useButton(props, env)
├── checkbox.ts       # CheckboxProps, RadioProps, SwitchProps, useCheckbox, useRadio, useSwitch
├── checkbutton.ts    # CheckButtonProps, CheckButtonState, useCheckButton
├── radiobutton.ts    # RadioButtonProps, RadioButtonState, useRadioButton
├── accordion.ts      # AccordionProps, AccordionState, AccordionGroupProps, useAccordion
├── progress.ts       # ProgressProps, ProgressState, useProgress
├── forms.ts          # SelectProps, ComboboxProps, ComboboxState, useCombobox
└── shared/
    ├── types.ts      # DisableableProps, VariantProps, IconProps, CheckedProps, ...
    └── utils.ts      # generateId, isDev, relativeSide, LogicalSide, PhysicalSide
```

Each component file is self-contained: types + hook + helpers in one file. No per-component subdirectories.

## ⚠️ Gotchas

1. **No JSX in hooks**: `use*` hooks return plain objects, not JSX. Adapters own the JSX.
2. **Reactive getters**: All state properties are getters — never read them at hook call time.
3. **Variant is a string**: `props.variant` is always the string name. The adapter maps it to classes/attrs.
4. **`uiComponent` is curried**: First call takes the variant list, second call takes the component function.
5. **`env` forwarding**: `uiComponent` passes `env` through. Hooks that need `DisplayContext` take `env: Env` as second arg and read `env.dc`.
6. **`iconPosition` is physical**: `useButton` resolves `'start'`/`'end'` → `'left'`/`'right'` via `relativeSide`. Adapters compare against `'left'`/`'right'`, never `'start'`/`'end'`.
