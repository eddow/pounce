# Checkbox

A headless checkbox primitive with support for checked, unchecked, and indeterminate states.

## States

The checkbox supports three states:

- **Checked**: `checked={true}` - submits the value
- **Unchecked**: `checked={false}` - does not submit the value  
- **Indeterminate**: `checked={undefined}` - visual-only "dash" state, does not affect form submission

The indeterminate state is useful for "select all" checkboxes where some but not all child items are checked.

## Props

```ts
interface CheckboxProps {
  /** Current state: true=checked, false=unchecked, undefined=indeterminate */
  checked?: boolean | undefined
  /** Whether the checkbox is disabled */
  disabled?: boolean
  /** Change handler */
  onChange?: (checked: boolean) => void
  /** Label position relative to the control */
  labelPosition?: 'start' | 'end'
  /** Description text */
  description?: JSX.Element | string
  /** Form name */
  name?: string
  /** Children (label text) */
  children?: JSX.Children
}
```

## Usage

```tsx
import { checkboxModel } from '@pounce/ui'

function Checkbox(props: CheckboxProps) {
  const model = checkboxModel(props)
  return (
    <label style="display: inline-flex; align-items: center;">
      <input {...model.input} />
      {props.children}
    </label>
  )
}

// Examples
<Checkbox checked={true}>Checked</Checkbox>
<Checkbox checked={false}>Unchecked</Checkbox>
<Checkbox checked={undefined}>Indeterminate</Checkbox>
```

## Model API

The `checkboxModel` returns:

```ts
interface CheckboxModel {
  /** Spreadable attrs for the `<input>` element */
  input: {
    type: 'checkbox'
    checked?: boolean
    disabled?: boolean
    onChange?: (e: Event) => void
    style: { order: -1 | 0 }
    indeterminate?: boolean  // Derived from checked === undefined
  }
}
```

## Accessibility

- Uses native `<input type="checkbox">` element
- Proper `checked` state for screen readers
- Indeterminate state is visual-only and does not affect accessibility tree
