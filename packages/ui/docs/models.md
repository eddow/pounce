# Models catalogue

This page is a source-aligned overview of the headless models exported from `@pounce/ui`.

For the model-writing recipe, see [`src/models/models.md`](../src/models/models.md).

## Input and action models

### `buttonModel`

Headless button logic with:

- disabled click suppression
- icon support
- icon-only accessibility fallback
- dynamic tag support

See [button.md](./button.md).

### `checkboxModel`, `radioModel`, `switchModel`

Headless input control models for boolean, grouped single-choice, and switch semantics.

See [checkbox.md](./checkbox.md).

### `checkButtonModel`

Button-shaped boolean toggle model.

Use when the adapter renders a `<button>` that behaves like a checkbox.

### `radioButtonModel`

Button-shaped radio model.

Use when the adapter renders a `<button>` that participates in a single-choice group.

## Disclosure and selection models

### `accordionModel`

Headless `<details>`-based accordion model.

Supports:

- standalone open state
- group binding
- exclusive or multi-open group coordination

### `selectModel`

Headless native `<select>` model.

Owns:

- select attributes
- normalized `onInput`
- JSX rendering of `<option>` elements

See [select.md](./select.md).

### `comboboxModel`

Headless datalist-backed combobox helper.

Owns:

- stable datalist id generation
- input `list` attribute
- datalist JSX rendering

See [select.md](./select.md).

### `multiselectModel`

Headless multi-select dropdown model.

Owns:

- per-item checked state
- toggling logic
- `<details>` / `<summary>` coordination
- selection updates via `Set<T>`

## Layout and navigation models

### `stackModel`

Vertical flex stack helper.

### `inlineModel`

Horizontal inline/flex helper.

### `gridModel`

Grid layout helper.

### `containerModel`

Content container helper.

### `appShellModel`

Application shell layout helper.

### `menuModel`, `menuItemModel`, `menuBarModel`

Headless menu system models.

Use for:

- menu surfaces
- interactive menu items
- menu bar keyboard/navigation behavior

### Nav utilities

The `nav.ts` module also exports non-model DOM helpers:

- `setupButtonGroupNav`
- `setupToolbarNav`

These are related to the UI interaction layer but are not model-returning APIs.

### Palette models

The palette system is exported from the `@pounce/ui/palette` subpath rather than the root package entry.

It includes:

- `createPaletteModel`
- `paletteCommandBoxModel`
- `paletteAddItemModel`
- `paletteToolbarModel`
- `paletteStatusbarModel`
- `paletteDisplayCustomizationModel`
- `paletteContainerModel`

See [palette.md](./palette.md).

## Feedback and status models

### `progressModel`

Headless progress indicator model.

### `starsModel`

Interactive star/range rating model.

Supports:

- single value or `[min, max]` range
- drag interaction
- configurable icon names
- optional zero element

### `badgeModel`, `pillModel`, `chipModel`

Status-display helpers.

`chipModel` additionally owns internal dismiss/visibility state.

## Typography and theme models

### `headingModel`

Heading typography helper.

### `textModel`

Text typography helper.

### `linkModel`

Link typography/helper model.

### `themeToggleModel`

Theme-switching model.

## Overlay-related models

### `dialogModel`

Dialog content model.

### `drawerModel`

Drawer content model.

### `toastModel`

Toast content model.

### `withOverlaysModel`

Model/helper for wiring overlay rendering into higher-level adapter components.

## Notes

- All of these APIs are exported from `@pounce/ui`.
- Most models are pure getter objects with no owned state.
- Internal owned state exists only where the model truly owns interaction state, such as dismissible chips or star dragging.
- Adapters own markup and styling; models own behavior and spread groups.
