# @sursaut/adapter-pico LLM Cheat Sheet

## Imports
- Import only from `@sursaut/core`, `@sursaut/ui`, and `@sursaut/kit` public barrels.
- Never deep-import another package internals from this adapter.

## Adapter model
- `@sursaut/ui` stays headless; pico components are thin wrappers around UI models.
- Prefer model output for behavior and ARIA, and keep pico code focused on DOM shape and classes.

## Variants and button styling
- Variants are centralized in `src/factory.ts` via `picoComponent` and `PICO_VARIANTS`.
- For button-like components, use `PicoButtonLikeProps<T>` instead of redefining `variant`/`outline` locally.
- `outline` is a separate boolean prop, not a variant.
- Use `picoButtonClass(variant, outline)` to compose button classes consistently.

## Reactivity
- Do not cache `props.variant`, `props.outline`, `props.href`, etc. in plain local variables in the component body.
- If an attribute comes from a model getter, spread user props first and write model-owned props after.
- Example: link-like components must set `onClick`, `aria-current`, and `style` after `{...props}`, otherwise raw props overwrite reactive model values.

## Navigation helpers
- `ButtonGroup` keyboard navigation is wired with `setupButtonGroupNav()`.
- `Toolbar` keyboard navigation is wired with `setupToolbarNav()`.
- `Toolbar.Spacer` must keep `data-toolbar-spacer=""`; it is a navigation segment boundary, not just styling.

## PicoCSS specifics
- Pico uses CSS variables, not Sass variables.
- Keep styling aligned with Pico primitives instead of inventing adapter-specific styling systems.
- Button styling is class-based; use the shared helpers instead of ad-hoc class strings.

## When adding or changing a component
- Start from the matching `@sursaut/ui` model.
- Keep types narrow on the adapter side when Pico supports fewer variants than the headless layer.
- Prefer shared adapter helpers/types in `factory.ts` before adding one-off logic to a component.
