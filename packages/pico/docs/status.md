# Status

Status indicator components: Badge, Pill, and Chip for displaying labels, tags, and removable tokens.

## Badge

Simple badge indicator with variant and optional icon:

```tsx
import { Badge } from '@pounce/pico'

<Badge variant="primary">New</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>
```

### With Icon

```tsx
<Badge variant="success" icon="mdi:check-circle">
	Verified
</Badge>

<Badge variant="danger" icon="mdi:alert">
	Critical
</Badge>
```

### Custom Tag

```tsx
<Badge tag="span" variant="primary">Span badge</Badge>
<Badge tag="div" variant="secondary">Div badge</Badge>
```

## Pill

Pill-shaped token with leading and trailing icons:

```tsx
import { Pill } from '@pounce/pico'

<Pill variant="primary">Tag</Pill>
<Pill variant="secondary">Category</Pill>
```

### With Icons

```tsx
<Pill
	variant="success"
	icon="mdi:check"
	trailingIcon="mdi:close"
>
	Completed
</Pill>
```

### Custom Tag

```tsx
<Pill tag="span" variant="primary">Span pill</Pill>
```

## Chip

Dismissible chip/token with optional icon:

```tsx
import { Chip } from '@pounce/pico'

<Chip variant="secondary" dismissible>
	Removable tag
</Chip>
```

### With Dismiss Handler

```tsx
<Chip
	variant="primary"
	dismissible
	onDismiss={() => console.log('Chip dismissed')}
>
	Tag
</Chip>
```

### Custom Dismiss Label

```tsx
<Chip
	dismissible
	dismissLabel="Remove tag"
>
	Custom label
</Chip>
```

### With Icon

```tsx
<Chip variant="success" icon="mdi:tag" dismissible>
	Tagged
</Chip>
```

### Non-dismissible

```tsx
<Chip variant="primary">Static chip</Chip>
```

### Custom Tag

When dismissible and tag is `button`, the component automatically switches to `div` with `role="group"` to avoid nested interactive controls:

```tsx
<Chip tag="span" variant="primary" dismissible>
	Span chip
</Chip>
```

## Variants

All status components support semantic variants:

```tsx
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="contrast">Contrast</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
```

## Accessibility

- Badge and Pill icons are marked with `aria-hidden="true"` when using string icon names
- Chip dismiss button includes `aria-label` (default: "Remove")
- Dismissible chips on button elements automatically switch to `div` with `role="group"` to prevent nested interactive controls

## Options

### Badge
- `tag?: JSX.HTMLElementTag` - HTML tag (default: `'span'`)
- `variant?: Variant` - Semantic variant (default: `'primary'`)
- `icon?: string | JSX.Element` - Leading icon
- `el?: JSX.GlobalHTMLAttributes` - Additional HTML attributes
- `children?: JSX.Children` - Badge content

### Pill
- `tag?: JSX.HTMLElementTag` - HTML tag (default: `'span'`)
- `variant?: Variant` - Semantic variant (default: `'primary'`)
- `icon?: string | JSX.Element` - Leading icon
- `trailingIcon?: string | JSX.Element` - Trailing icon
- `el?: JSX.GlobalHTMLAttributes` - Additional HTML attributes
- `children?: JSX.Children` - Pill content

### Chip
- `tag?: JSX.HTMLElementTag` - HTML tag (default: `'button'`, switches to `'div'` when dismissible)
- `variant?: Variant` - Semantic variant (default: `'secondary'`)
- `icon?: string | JSX.Element` - Leading icon
- `dismissible?: boolean` - Show dismiss button (default: `false`)
- `dismissLabel?: string` - Aria label for dismiss button (default: `'Remove'`)
- `onDismiss?: () => void` - Callback when chip is dismissed
- `el?: JSX.GlobalHTMLAttributes` - Additional HTML attributes
- `children?: JSX.Children` - Chip content

## Notes

- Badge uses smaller icon size (14px) compared to Pill (16px)
- Chip automatically hides when dismissed (uses `if={state.open}`)
- Chip dismiss button stops event propagation to prevent parent click handlers

