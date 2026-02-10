# @pounce/ui Overlays

This directory contains the unified overlay system for `@pounce/ui`. It orchestrates Dialogs, Toasts, Drawers, and other blocking or transient UI elements in a coordinated layer.

## Architecture

The system is based on three pillars:

1.  **Functional Interactors**: Components like `Dialog` and `Toast` provide a `.show(options)` method that returns an `OverlaySpec`. This specification describes *what* to render and *how* it should behave.
2.  **Local Stacking & Nesting**: Each `WithOverlays` component manages its own `overlayStack`. This allows for "Windowed Modals" that only affect a specific sub-section of your UI.
3.  **Scoped Dispatcher**: The `overlay` function is injected into the Pounce component scope. This allows subtrees to override how overlays are handled.

### Depth & Z-Index Coordination

Managers are **Nesting-Aware**:

- **Dynamic Z-Index**: Managers use the scope to track depth (`overlayLevel`). Each level increments the base z-index (starting at `10000`) by `1000`, ensuring that localized sub-dialogs always render above their parent's overlays.
- **Max Level Tracking**: The system tracks the `maxOverlayLevel` reactively in the scope, allowing components to adjust their behavior based on whether they are in the deepest active overlay manager.
- **Escape Key Orchestration**: Managers listen for the `Escape` key via event bubbling. If a user hits Escape while focus is inside a windowed overlay, that manager consumes the event, closes its top-most overlay, and stops propagation.

## Configuration

### Dynamic Layers

The host can be configured with specific layers:

```tsx
<WithOverlays layers={['modal', 'toast']}>
```

Overlays are grouped by their `mode` into dedicated containers. If `layers` is omitted, all overlays render in a single flat container.

### Backdrop Modes

The `backdropModes` prop (array of strings) determines which overlay modes trigger the dimming backdrop.

- **Default**: `['modal', 'drawer-left', 'drawer-right']`
- **Contextual Backdrops**: In windowed mode (`fixed={false}`), the backdrop only dims the container of the `WithOverlays` component.

## Usage

### 1-Config Setup

Wrap your application root with `StandardOverlays`:

```tsx
import { StandardOverlays } from '@pounce/ui'

const App = () => (
    <StandardOverlays>
        <MainContent />
    </StandardOverlays>
)
```

### Calling from Components

Deconstruct the bound helpers directly from the scope:

```tsx
export const MyComponent = (props, { dialog, toast }) => {
    const handleClick = async () => {
        const result = await dialog.confirm("Are you sure?")
        if (result) {
            toast.success("Done!")
        }
    }
    
    return <button onClick={handleClick}>Open Dialog</button>
}
```

### Binding Factories (`bindDialog`, `bindToast`)

The `dialog` and `toast` functions in the scope are created using **Binding Factories**. These factories take a push function (like `scope.overlay`) and return a high-level API.

```tsx
import { bindDialog } from '@pounce/ui/overlays'

// Manually binding to a specific dispatcher:
const myDialog = bindDialog(customOverlayPush);
myDialog.confirm("Hello");
```

## Custom Helpers

If you want to provide your own interaction helpers, use the `extend` prop on `WithOverlays`:

```tsx
<WithOverlays 
    extend={{
        drawer: (push) => (options) => push(MyDrawer.show(options))
    }}
>
    <App />
</WithOverlays>
```

## Windowed Modals Pattern

For localized overlay management (e.g., a modal that only affects a specific panel), use `fixed={false}`:

```tsx
<div class="panel">
    <WithOverlays fixed={false}>
        <PanelContent />
    </WithOverlays>
</div>
```

**Behavior:**
- Container uses `position: absolute` instead of `fixed`
- Backdrop only dims the panel, not the entire viewport
- Z-index automatically increments above parent overlay managers
- Escape key handling is scoped to this manager

**Use cases:**
- Modals within a DockView panel
- Confirmation dialogs in a sidebar
- Contextual overlays in a split-pane layout
