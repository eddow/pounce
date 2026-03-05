# @pounce/ui

Headless UI primitives for Pounce applications. Zero styling, zero class names, zero opinions on CSS frameworks.

## Overview

`@pounce/ui` provides behavioral logic and state management for common UI components. It's designed to be used with adapters (like `@pounce/adapter-pico`) that provide the visual styling.

### Features

- **Headless**: No styles, no class names, just behavior
- **Composable models**: Each component exports a `*Model` function
- **Type-safe**: Full TypeScript support with proper prop types
- **Accessible**: Built with accessibility in mind
- **Reactive**: Fully reactive state management via mutts

## Quick Start

```tsx
import { buttonModel, checkboxModel } from '@pounce/ui'

function MyComponent() {
  const button = buttonModel({
    onClick: () => console.log('clicked'),
    disabled: false
  })
  
  const checkbox = checkboxModel({
    checked: true,
    onChange: (checked) => console.log('checked:', checked)
  })
  
  return (
    <div>
      <button {...button.button}>Click me</button>
      <label>
        <input {...checkbox.input} />
        Check me
      </label>
    </div>
  )
}
```

## Components

### Button
- [Documentation](./docs/button.md)
- `buttonModel(props)` → `{ button: {...} }`

### Checkbox
- [Documentation](./docs/checkbox.md)
- `checkboxModel(props)` → `{ input: {...} }`
- Supports checked/unchecked/indeterminate states

### Select
- [Documentation](./docs/select.md)
- `selectModel(props)` → `{ select: {...} }`

### Overlay
- [Documentation](./docs/overlay.md)
- `createOverlayStack()` for dialog/toast management
- `dialogSpec()` for common dialog patterns

## Architecture

### Model Pattern

Each component follows the model pattern:

```ts
export function componentName(props: ComponentProps): ComponentModel {
  const model: ComponentModel = {
    get elementGroup() {
      return {
        // Spreadable attributes for the target element
        get disabled() { return props.disabled },
        get onClick() { return props.onClick },
        // ... more attributes
      }
    }
  }
  return model
}
```

### Adapters

Adapters consume the models and add styling:

```tsx
import { buttonModel } from '@pounce/ui'

export const Button = (props) => {
  const model = buttonModel(props)
  return (
    <button className="btn" {...model.button}>
      {props.children}
    </button>
  )
}
```

## Development

### Running the Demo

```bash
pnpm demo
```

The demo server runs on port 5270 and showcases all components.

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

### Building

```bash
pnpm build
```

## Documentation

- [Button](./docs/button.md)
- [Checkbox](./docs/checkbox.md)
- [Select](./docs/select.md)
- [Overlay](./docs/overlay.md)

## License

MIT
