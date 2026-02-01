
# Infinite Scroll

The `InfiniteScroll` component allows rendering large lists of data efficiently by only rendering the items currently visible in the viewport (virtualization). It mimics standard scrolling behavior but with performance optimizations for handling thousands of items.

## Import

```typescript
import { InfiniteScroll } from '@pounce/pico'
```

## Usage

### Basic Example

```tsx
import { InfiniteScroll } from '@pounce/pico'

const MyList = () => {
  const items = Array.from({ length: 1000 }, (_, i) => \`Item \${i}\`)

  return (
    <div style="height: 400px;">
      <InfiniteScroll
        items={items}
        itemHeight={30} // Height of each item in pixels
        el={{ class: "my-list-container" }}
      >
        {(item, index) => (
          <div style="height: 30px; padding: 0 1rem;">
            {item}
          </div>
        )}
      </InfiniteScroll>
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | `[]` | Array of data items to render. |
| `children` | `(item: T, index: number) => JSX.Element` | required | Render function for each item. |
| `itemHeight` | `number` | required | Fixed height of each item in pixels. |
| `stickyLast` | `boolean` | `true` | If true, auto-scrolls to bottom on new items if already at bottom. |
| `el` | `JSX.IntrinsicElements['div']` | `undefined` | Attributes to forward to the container (style, class, etc.). |

## Implementation Details

-   **Virtualization**: Renders only `visibleCount + 4` items (2 buffer above/below).
-   **Optimization**: Uses `mutts` `project` for efficient list rendering and DOM node recycling.
-   **Structure**: Uses a relative container with `overflow-y: auto`. Items are absolutely positioned.
