# Actions (Directives)

Actions in Pounce-UI are functions that attach behavior to DOM elements using the `use:action` syntax. They are powerful tools for managing side effects, event listeners, and bi-directional bindings directly on elements.

## Scope Injection

Unlike components, actions must be available in the template's scope to be usable with the `use:` prefix.

### Preferred Method: `bindApp`

The simplest way to make all Pounce-UI actions available globally is to pass them to `bindApp` during initialization:

```tsx
import { bindApp } from '@pounce/core'
import * as actions from '@pounce/pico/src/actions'
import { App } from './App'

bindApp(<App />, '#app', actions)
```

This makes all actions (like `resize`, `scroll`, etc.) directly usable in any template as `use:resize={...}`.

### Alternative Method: Root Scope Augmentation

You can also manually augment the root scope:

```tsx
import { resize, scroll } from '@pounce/pico'

const App = (props, scope) => {
    scope.resize = resize
    scope.scroll = scroll
    // ...
}
```

---

## Available Actions

### `resize`
Binds an element's size to a reactive state using `ResizeObserver`. It supports bi-directional binding: updating the state can change the element's style, and resizing the element updates the state.

**Usage:**
```tsx
const size = reactive({ width: 0, height: 0 })

<div use:resize={size} style="resize: both; overflow: auto; border: 1px solid var(--primary);">
  Size: {size.width}x{size.height}
</div>
```

---

### `scroll`
Binds the scroll position of an element. It supports both `x` and `y` axes.

**Usage:**
```tsx
const scrollState = reactive({ value: 0, max: 0 })

<div use:scroll={{ y: scrollState }} style="height: 200px; overflow-y: auto;">
  <div style="height: 1000px;">Scroll me!</div>
</div>

<p>Scroll Position: {scrollState.value} / {scrollState.max}</p>
```

---

### `pointer`
Tracks pointer (mouse/touch) position and button state relative to the element.

**Usage:**
```tsx
const pointerData = reactive({ value: undefined })

<div 
  use:pointer={{ value: pointerData }} 
  style="width: 200px; height: 100px; background: var(--secondary);"
>
  {pointerData.value ? `Pos: ${pointerData.value.x}, ${pointerData.value.y}` : 'Hover me'}
</div>
```

**Data Structure:**
- `x`, `y`: Coordinates relative to the element.
- `buttons`: Bitmask of pressed buttons.
- `undefined` when the pointer leaves the element.

---

### `intersect`
Uses `IntersectionObserver` to track when an element enters or leaves the viewport (or a specific root element).

**Usage:**
```tsx
const onEnter = () => console.log('Entered viewport')
const onLeave = () => console.log('Left viewport')

<div use:intersect={{ onEnter, onLeave, threshold: 0.5 }}>
  Watch me!
</div>
```

**Options:**
- `onEnter`: Callback when visibility starts.
- `onLeave`: Callback when visibility ends.
- `onChange`: Callback for any change in intersection.
- `threshold`: Percentage of visibility (0 to 1) to trigger callbacks.
- `root`: The element that is used as the viewport for checking visibility of the target (defaults to browser viewport).
- `rootMargin`: Margin around the root.
