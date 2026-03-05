# Select

A headless select primitive with value binding and change handling.

## Props

```ts
interface SelectProps<T = string> {
  /** Current selected value */
  value?: T
  /** Array of options */
  options?: Array<{ value: T; label: string }>
  /** Change handler - receives the selected value */
  onInput?: (value: T) => void
  /** Whether the select is disabled */
  disabled?: boolean
  /** Form name */
  name?: string
}
```

## Usage

```tsx
import { selectModel } from '@pounce/ui'

function Select<T = string>(props: SelectProps<T>) {
  const model = selectModel(props)
  return (
    <select {...model.select}>
      {props.options?.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// Example
<Select
  value={selectedColor}
  options={[
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' }
  ]}
  onInput={(value) => setSelectedColor(value)}
/>
```

## Model API

The `selectModel` returns:

```ts
interface SelectModel {
  /** Spreadable attrs for the `<select>` element */
  select: {
    value?: string
    disabled?: boolean
    name?: string
    onInput?: (e: Event) => void  // Wraps to extract e.target.value
  }
}
```

## Notes

The `onInput` handler in the model automatically extracts the value from the DOM Event before calling your callback, so you receive the actual value type instead of the Event object.
