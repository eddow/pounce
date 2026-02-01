# Multiselect

A dropdown component for selecting multiple items from a list, using a `Set` for state management.

## Import

```tsx
import { Multiselect } from '@pounce/pico'
```

## Basic Usage

```tsx
const allItems = ['Apple', 'Banana', 'Cherry']
const selectedItems = reactive(new Set<string>())

<Multiselect
  items={allItems}
  value={selectedItems}
  renderItem={(item, checked) => (
    <span>{checked ? '✓ ' : ''}{item}</span>
  )}
>
  <Button>Select Fruits ({selectedItems.size})</Button>
</Multiselect>
```

## Features

### Filtering / Hiding Items
The `renderItem` function can return `false` to hide an item from the list. This is useful for implementing features like "Hide selected items".

```tsx
<Multiselect
  items={allItems}
  value={selectedItems}
  renderItem={(item, checked) => {
    // Hide if already selected
    if (checked) return false
    return <span>{item}</span>
  }}
>
  <Button>Add Item</Button>
</Multiselect>
```

### Close Behavior
By default, the dropdown closes when an item is selected (`closeOnSelect={true}`). You can change this behavior to keep it open for multiple selections.

```tsx
<Multiselect
  closeOnSelect={false} // Keep open on click
  items={items}
  value={selected}
  renderItem={...}
>
  <Button>Select Multiple</Button>
</Multiselect>
```

## Props

- `items: T[]` - Array of items to display.
- `value: Set<T>` - Reactive Set containing selected items.
- `renderItem: (item: T, checked: boolean) => JSX.Element | false` - Render function for list items. Return `false` to hide the item.
- `closeOnSelect?: boolean` - Whether to close the dropdown when an item is selected. Default is `true`.
- `variant?: Variant` - Visual styling variant (primary, secondary, etc).
- `class?: string` - Additional CSS class.
- `el?: JSX.IntrinsicElements['details']` - Props spread to the root `<details>` element.
- `children`: Trigger element (e.g., `<Button>`) displayed in the `<summary>`.
