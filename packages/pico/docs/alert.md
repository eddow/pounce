# Alert

Alert components for displaying important messages with variants and optional dismissal.

## Basic

```tsx
import { Alert } from '@pounce/pico'

<Alert>This is a simple alert message.</Alert>
```

## Variants

Alerts support semantic variants with default icons:

```tsx
<Alert variant="primary">Information message</Alert>
<Alert variant="success">Operation completed successfully</Alert>
<Alert variant="warning">Warning message</Alert>
<Alert variant="danger">Error occurred</Alert>
<Alert variant="secondary">Secondary message</Alert>
<Alert variant="contrast">Contrast message</Alert>
```

## With Title

```tsx
<Alert variant="warning" title="Heads up">
	Please review your changes before submitting.
</Alert>
```

## Custom Icon

Override the default icon or disable it:

```tsx
<Alert variant="success" icon="mdi:check-circle">
	Custom icon alert
</Alert>

<Alert variant="info" icon={false}>
	Alert without icon
</Alert>
```

## Dismissible

Make alerts dismissible with a close button:

```tsx
<Alert
	variant="info"
	dismissible
	onDismiss={() => console.log('Alert dismissed')}
>
	This alert can be dismissed
</Alert>
```

Customize the dismiss button label:

```tsx
<Alert dismissible dismissLabel="Close alert">
	Dismissible with custom label
</Alert>
```

## Accessibility

- Default `role` is `"status"` for most variants
- `variant="danger"` defaults to `role="alert"` for immediate attention
- Override with `role` prop: `role="alert"` or `role="status"`
- Dismiss button includes `aria-label` (default: "Dismiss")

## Options

- `variant?: Variant` - Semantic variant (default: `'primary'`)
- `title?: string | JSX.Element` - Optional title/heading
- `icon?: string | JSX.Element | false` - Icon name, JSX element, or `false` to hide (default: variant-specific icon)
- `dismissible?: boolean` - Show dismiss button (default: `false`)
- `dismissLabel?: string` - Aria label for dismiss button (default: `'Dismiss'`)
- `onDismiss?: () => void` - Callback when alert is dismissed
- `role?: 'status' | 'alert'` - ARIA role (default: `'alert'` for danger, `'status'` otherwise)
- `el?: JSX.GlobalHTMLAttributes` - Additional HTML attributes
- `children?: JSX.Children` - Alert content

