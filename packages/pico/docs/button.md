# Button

Primary button component with icon support, variants, and badge integration.

## Basic

```tsx
import { Button } from '@pounce/pico'

<Button>Click me</Button>
```

## Variants

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="contrast">Contrast</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger">Danger</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
```

## With Icon

Icons can be placed at the start (default) or end:

```tsx
<Button icon="mdi:content-save">Save</Button>

<Button icon="mdi:download" iconPosition="end">
	Download
</Button>
```

## Icon-only

When only an icon is provided (no children), the button becomes square. Always provide `aria-label`:

```tsx
<Button icon="mdi:settings" aria-label="Settings" />
<Button icon="mdi:close" aria-label="Close" />
```

## With Badge

Buttons support badges via the `badge` prop:

```tsx
<Button badge={5}>Inbox</Button>
<Button badge="99+">Messages</Button>
<Button badge={<Icon name="mdi:star" />}>Favorite</Button>
```

The badge is automatically positioned at the top-right corner using the Badged component.

## Custom Icon Element

Icons can be JSX elements:

```tsx
<Button icon={<CustomIcon />}>Custom</Button>
```

## Event Handling

```tsx
<Button onClick={(event) => {
	console.log('Clicked!', event)
}}>
	Click me
</Button>
```

## Accessibility

- Icon-only buttons automatically get `aria-label` (default: "Action") if not provided
- Use `ariaLabel` prop or `el.aria-label` to customize
- Icons are marked with `aria-hidden="true"` when using string icon names

## Options

- `variant?: Variant` - Button variant (default: `'primary'`)
- `icon?: string | JSX.Element` - Icon name or JSX element
- `iconPosition?: 'start' | 'end'` - Icon position (default: `'start'`)
- `badge?: number | string | JSX.Element` - Badge to display on button
- `ariaLabel?: string` - Accessible label (required for icon-only buttons)
- `onClick?: (event: MouseEvent) => void` - Click handler
- `el?: JSX.HTMLAttributes<'button'>` - Additional button HTML attributes
- `children?: JSX.Children` - Button content

## Styling

- Icon-only buttons automatically get `pp-button-icon-only` class for square sizing
- Buttons in toolbars automatically align with form elements (see Toolbar docs)
- Customize via `src/components/variants.scss`

