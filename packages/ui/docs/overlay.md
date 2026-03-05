# Overlay

A headless overlay system for dialogs, toasts, and other floating content.

## Core Concepts

Overlays in Pounce use a stack-based system where each overlay is an entry that can be pushed and removed. The overlay system handles:

- Stack management (multiple overlays can be open)
- Transition effects
- Focus trapping
- Auto-dismissal

## Basic Usage

```tsx
import { createOverlayStack, dialogSpec } from '@pounce/ui'

function MyComponent() {
  const stack = createOverlayStack()
  
  const openDialog = () => {
    stack.push(dialogSpec({
      title: 'Confirm',
      content: 'Are you sure?',
      actions: [
        { label: 'Cancel', action: 'close' },
        { label: 'Confirm', action: 'confirm' }
      ]
    }))
  }
  
  return (
    <div>
      <button onClick={openDialog}>Open Dialog</button>
      
      {/* Render active overlays */}
      {stack.stack.map(entry => (
        <div key={entry.id} className="overlay-backdrop">
          {entry.render?.(entry.resolve)}
        </div>
      ))}
    </div>
  )
}
```

## API

### createOverlayStack()

Creates a new overlay stack instance:

```ts
interface OverlayStack {
  /** Current stack entries */
  stack: readonly OverlayEntry[]
  
  /** Push a new overlay */
  push(spec: OverlaySpec): OverlayEntry
  
  /** Remove an overlay */
  remove(entry: OverlayEntry): void
  
  /** Clear all overlays */
  clear(): void
}
```

### dialogSpec()

Creates a dialog overlay specification:

```ts
function dialogSpec(options: {
  title?: string
  content: JSX.Element | string
  actions?: Array<{
    label: string
    action: string | ((entry: OverlayEntry) => void)
    variant?: 'primary' | 'secondary'
  }>
  closeOnBackdrop?: boolean
}): OverlaySpec
```

### OverlayEntry

Represents an active overlay in the stack:

```ts
interface OverlayEntry extends OverlaySpec {
  /** Unique identifier */
  id: string
  
  /** Render the overlay content */
  render?: (resolve: (result?: any) => void) => JSX.Element
  
  /** Resolve/close the overlay */
  resolve: (result?: any) => void
}
```

## Rendering Overlays

When rendering overlays, iterate over `stack.stack` and call `entry.render()`:

```tsx
{stack.stack.map(entry => (
  <div key={entry.id} className="overlay-backdrop">
    {entry.render?.(entry.resolve)}
  </div>
))}
```

**Important**: Use `entry.render?.(entry.resolve)` - don't try to access `entry.element` as it doesn't exist.
