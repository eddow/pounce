# Directives

`@sursaut/ui` exports the following DOM directives from `src/directives/index.ts`:

- `badge`
- `drag`
- `dragging`
- `drop`
- `intersect`
- `loading`
- `pointer`
- `resize`
- `scroll`
- `sizeable`
- `tail`

These are plain directive functions meant to be used through Sursaut `use:name={value}` bindings.

## Exported directives

### `badge`

Adds a floating badge overlay to an element.

Exports:

- `badge`
- `BadgeInput`
- `BadgeOptions`
- `BadgePosition`

Use when an element needs a lightweight count or status marker.

### `drag`, `drop`, and `dragging`

A reactive Native HTML5 Drag and Drop implementation.

Exports:

- `drag`
- `drop`
- `dragging`
- `DraggingCallback`

Use for orchestrating drag-and-drop interactions across components without relying on external state managers.
- **`use:drag={payload}`**: Makes an element draggable and stores its payload globally during the drag lifecycle.
- **`use:dragging={(payload, isHovering) => cleanup | false}`**: A drop-zone validator. Returning `false` rejects the drop. Returning a function executes it on `dragleave` or `drop`.
- **`use:drop={(payload) => void}`**: The final drop handler, automatically catching the active drag payload safely.

### `intersect`

Wraps `IntersectionObserver`.

Exports:

- `intersect`
- `IntersectOptions`

Use when you need viewport entry / exit observation for lazy loading, animation triggers, or progressive rendering.

### `loading`

Marks an element as busy and disables supported form elements while loading.

Exports:

- `loading`

Use for form controls or regions that should communicate busy state through DOM attributes.

### `pointer`

Binds pointer state to a reactive holder.

Exports:

- `pointer`
- `PointerBinding`
- `PointerState`

Use for press / drag / hover interaction models where you want low-level pointer coordinates and button state.

### `resize`

Wraps `ResizeObserver`.

Exports:

- `resize`
- `ResizeValue`

Use to observe element size changes and feed them back into reactive state.

### `scroll`

Tracks scroll position and limits.

Exports:

- `scroll`
- `ScrollAxis`
- `ScrollOptions`

Use when an element's horizontal or vertical scroll state should be mirrored into application state.

### `sizeable`

Adds user-resize behavior.

Exports:

- `sizeable`

Use for panes, panels, or shells that the user can drag-resize.

### `tail`

Keeps a scroll container pinned to the bottom when appropriate.

Exports:

- `tail`

Use for logs, chat threads, and similar append-only scroll regions.

## Notes

- These directives are headless DOM behavior helpers.
- They do not style anything.
- They are exported directly from `@sursaut/ui`.
- For exact value types, see the corresponding files in `src/directives/`.
