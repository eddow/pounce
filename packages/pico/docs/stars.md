# Stars

A rating component supporting single and range values, custom icons, and a "zero" element.

## Props

-   `value`: `number | [number, number]`
    -   Current value
    -   Single value treated as range `[value, value]` for visualization
-   `maximum`: `number` (Default: 5)
-   `readonly`: `boolean`
-   `size`: `string` (CSS size unit, Default: "1.5rem")
-   `inside`: `string` (Icon for range interior, defaults to `before`)
-   `before`: `string` (Icon for range start/before, default: Filled Star)
-   `after`: `string` (Icon for after range, default: Outline Star)
-   `zeroElement`: `string` (Optional icon for 0-th element)
    -   When provided, renders an extra element before the first star.
    -   Allows the component to have a value of `0` (otherwise minimum is 1).

## Styling

The component uses specific classes for different states, allowing for granular customization.

### Default States

-   `.pp-stars`: Container.
-   `.pp-stars-item`: Base class for all items. Defaults to **Muted** color (`var(--pico-muted-color)`).
-   `.pp-zero`: Applied to the 0-th element. Inherits base color (Muted) by default.
-   `.pp-before`: Applied to items *before* the current range/value. Defaults to **Primary** color.
-   `.pp-inside`: Applied to items *inside* the current range/value. Defaults to **Inherit** color (Plain).
-   `.pp-after`: Applied to items *after* the current range/value. Inherits base color (Muted).

### Customization Example

You can override the default styles by targeting these classes.

```css
/* Example: Red "before" stars and customized zero element */
.my-custom-stars .pp-stars-item.pp-before {
    color: red;
}

.my-custom-stars .pp-stars-item.pp-zero {
    color: #555;
    opacity: 0.5;
}
.my-custom-stars .pp-stars-item.pp-zero:hover {
    opacity: 1;
    color: red;
}
```

## Usage

```tsx
// Single value
<Stars value={3} />

// Range
<Stars value={[2, 4]} />

// With 0-th element
<Stars value={0} zeroElement={myIcon} />
```
