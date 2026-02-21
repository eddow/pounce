# Model Pattern — Recipes & Conventions

Models are the headless layer of `@pounce/ui`. They encapsulate all behavioral logic, a11y, and derived state, returning a plain object of **lazy getters** that adapters spread onto JSX elements.

## Anatomy of a Model

```ts
// button.tsx — canonical example
export function buttonModel(props: ButtonProps): ButtonModel {
  const model: ButtonModel = {
    get hasLabel() { ... },
    get isIconOnly() { return !!props.icon && !model.hasLabel },
    get button(): JSX.IntrinsicElements['button'] { ... },
    get icon() { ... },
  }
  return model
}
```

Key rules:
- **All properties are getters** — no reactive reads happen at call time. Safe to call in component body.
- **Self-reference via named `model`** — use `model.hasLabel` inside getters, not `this` (arrow-function object literal loses `this` context).
- **File is `.tsx`** — models that render JSX (e.g. icon elements) live in `.tsx` files.

## Spread Group Typing

Each spread group is typed as `JSX.IntrinsicElements['tagname']` — not `JSX.BaseHTMLAttributes<T>`.

**Why:** `BaseHTMLAttributes` omits element-specific attrs like `disabled` on `<button>`. `IntrinsicElements['button']` is the full intersection and includes them.

```ts
readonly button: JSX.IntrinsicElements['button']   // ✓ includes disabled, type, form, ...
readonly span:   JSX.IntrinsicElements['span']     // ✓ includes style, class, ...
// NOT: JSX.BaseHTMLAttributes<HTMLButtonElement>  // ✗ missing disabled
```

## Icon Group Pattern

When a model needs to render an icon, it exposes an `icon` group (or `undefined` when no icon is set):

```ts
readonly icon:
  | {
      readonly position: 'start' | 'end'
      readonly span: JSX.IntrinsicElements['span']   // spread onto the <span> wrapper
      readonly element?: JSX.Element                 // resolved icon — string → <Icon>, JSX → pass-through
    }
  | undefined
```

The model owns:
- **Position resolution** — `'left'`/`'right'` legacy inputs are normalized to `'start'`/`'end'` inside the model.
- **CSS `order`** — `order: isEnd ? 1 : -1` positions the icon without physical left/right knowledge.
- **Logical margin** — `marginInlineEnd` (icon at start) or `marginInlineStart` (icon at end), only when a label is present.
- **Element rendering** — `typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon`

The adapter only needs:
```tsx
{model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
{model.hasLabel && gather(props.children)}
```

## `gather` — Children Wrapping

CSS `order` only works on **flex items**. When `props.children` is an array (e.g. `['Save', <kbd>S</kbd>]`), each element becomes its own flex item and `order` on the icon span may not produce the correct result.

`gather(children)` wraps arrays in a single `<span>`, passes single nodes/primitives through unchanged:

```ts
// shared/utils.tsx
export function gather(children: JSX.Children): JSX.Element {
  return Array.isArray(children) ? <span>{children}</span> : (children as JSX.Element)
}
```

**Rule:** always use `gather(props.children)` in adapters that render an icon alongside children.

## Double-Binding — Write Back to Props, Not Local State

Props passed into a model are already reactive objects. **Never duplicate them into a local `reactive()` state.** Read from `props.checked`, write back to `props.checked` — the framework propagates the change upward automatically.

```ts
// ✓ CORRECT — double-binding via props
export function checkButtonModel(props: CheckButtonProps): CheckButtonModel {
  const model: CheckButtonModel = {
    get checked() { return props.checked ?? false },
    get button() {
      return {
        get onClick() {
          return (e: MouseEvent) => {
            props.checked = !(props.checked ?? false)   // write back to props
            props.onCheckedChange?.(props.checked)
          }
        },
      }
    },
  }
  return model
}

// ✗ WRONG — duplicating state locally
export function checkButtonModel(props: CheckButtonProps): CheckButtonModel {
  const state = reactive({ checked: props.checked ?? false })  // ← snapshot, not live
  // state.checked and props.checked are now two separate values.
  // Writing state.checked never updates props.checked upstream.
}
```

**Why local state is wrong here:**
- `props.checked ?? false` at construction time takes a one-time snapshot.
- Subsequent external changes to `props.checked` (e.g. parent resets it) are ignored.
- `state.checked = !state.checked` mutates the local copy only — the parent never sees it unless `onCheckedChange` is also called, creating a split-brain between the two values.

**Rule:** local `reactive()` state is only justified when the model owns state that has **no corresponding prop** — e.g. `chipModel`'s `visible` (dismiss is fire-and-forget, no `visible` prop exists) or `starsModel`'s `draggingEnd` (internal drag tracking, never exposed as a prop).

For `checkbutton`, `radiobutton`, `checkbox`, `radio`, `switch` — the binding field (`checked`, `group`) always has a prop. Write back to it.

## RTL/LTR — Logical CSS Only

Do **not** use `relativeSide(dc, side)` in new models or adapters. Use logical CSS properties instead:

| Physical (avoid) | Logical (use) |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `left` / `right` in `order` logic | `order: -1` (start) / `order: 1` (end) |
| `justify-content: flex-start` | `justify-items: start` |

`relativeSide` remains in `shared/utils.ts` for legacy adapters only.

## Model File Conventions

| Concern | Location |
|---|---|
| Types + model function | Same `.ts` / `.tsx` file (e.g. `button.tsx`) |
| JSX in model output | Rename file to `.tsx` |
| Shared prop interfaces | `shared/types.ts` |
| Shared utilities | `shared/utils.tsx` (JSX) or `shared/utils.ts` (no JSX) |
| Export | `index.ts` barrel — named exports only |

## Adapter Conventions

Adapters are thin. The model owns all logic; the adapter owns all markup and styling.

```tsx
// Minimal adapter pattern
export const Button = picoComponent(function Button(props: ButtonProps) {
  const model = buttonModel(props)
  return (
    <button class={`btn btn-${props.variant ?? 'secondary'}`} {...model.button} {...props.el}>
      {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
      {model.hasLabel && gather(props.children)}
    </button>
  )
})
```

- `{...model.button}` first, then `{...props.el}` — `props.el` wins on conflicts (user override).
- `model.hasLabel` guards `gather()` — avoids rendering an empty `<span>` when icon-only.
- No `Icon` import in the adapter — the model resolves it.
- No `env` parameter — models no longer require it for direction.

## What Goes in the Model vs the Adapter

| Concern | Model | Adapter |
|---|---|---|
| `onClick` suppression when disabled | ✓ | |
| `aria-label` fallback for icon-only | ✓ | |
| `aria-disabled` | ✓ | |
| Icon position (logical) | ✓ | |
| Icon element rendering | ✓ | |
| Icon wrapper `style` (`order`, `marginInline*`) | ✓ | |
| CSS class names | | ✓ |
| HTML tag choice (structural) | ✓ (`model.tag`) | ✓ (uses `model.tag`) |
| `props.el` passthrough | | ✓ (always last spread) |
| `gather` call | | ✓ |
