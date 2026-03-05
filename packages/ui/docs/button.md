# Button

A headless button primitive with disabled state and click handling.

## Props

```ts
interface ButtonProps {
  /** Whether the button is disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: (e: MouseEvent) => void
  /** Accessibility label */
  'aria-label'?: string
  /** Additional element attributes */
  [key: string]: any
}
```

## Usage

```tsx
import { buttonModel } from '@pounce/ui'

function Button(props: ButtonProps) {
  const model = buttonModel(props)
  return <button {...model.button}>{props.children}</button>
}

// Examples
<Button onClick={() => console.log('clicked')}>Click me</Button>
<Button disabled>Disabled button</Button>
```

## Model API

The `buttonModel` returns:

```ts
interface ButtonModel {
  /** Spreadable attrs for the `<button>` element */
  button: {
    disabled?: boolean
    onClick?: (e: MouseEvent) => void
    'aria-label'?: string
    'aria-disabled'?: boolean
  }
}
```

## Accessibility

- Uses native `<button>` element
- Proper disabled state handling
- `aria-disabled` when disabled prop is true
