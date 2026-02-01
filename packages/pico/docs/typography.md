# Typography

Typography components for headings, text, and links with variant support.

## Heading

Semantic heading component with level and variant support:

```tsx
import { Heading } from '@pounce/pico'

<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection</Heading>
```

### Variants

```tsx
<Heading level={2} variant="primary">Primary heading</Heading>
<Heading level={2} variant="secondary">Secondary heading</Heading>
<Heading level={2} variant="danger">Danger heading</Heading>
<Heading level={2} variant="success">Success heading</Heading>
```

### Alignment

```tsx
<Heading level={2} align="start">Left aligned (default)</Heading>
<Heading level={2} align="center">Center aligned</Heading>
<Heading level={2} align="end">Right aligned</Heading>
```

### Custom Tag

Override the default tag while keeping semantic level:

```tsx
<Heading level={1} tag="h2">
	Level 1 styling, h2 tag
</Heading>
```

## Text

Text component with size and variant support:

```tsx
import { Text } from '@pounce/pico'

<Text>Default text</Text>
<Text size="sm">Small text</Text>
<Text size="md">Medium text (default)</Text>
<Text size="lg">Large text</Text>
```

### Variants

```tsx
<Text variant="primary">Primary text</Text>
<Text variant="secondary">Secondary text</Text>
<Text variant="danger">Danger text</Text>
<Text variant="success">Success text</Text>
```

### Muted

```tsx
<Text muted>Muted text for secondary information</Text>
```

### Custom Tag

```tsx
<Text tag="span">Inline span text</Text>
<Text tag="div">Block div text</Text>
```

## Link

Link component with variant and underline control:

```tsx
import { Link } from '@pounce/pico'

<Link href="/page">Default link</Link>
<Link href="/page" variant="primary">Primary link</Link>
<Link href="/page" variant="danger">Danger link</Link>
```

### Without Underline

```tsx
<Link href="/page" underline={false}>
	No underline
</Link>
```

### With Underline

```tsx
<Link href="/page" underline={true}>
	Underlined (default)
</Link>
```

## Variants

All typography components support semantic variants:

- `primary` (default)
- `secondary`
- `contrast`
- `danger`
- `success`
- `warning`

## Accessibility

- Heading uses semantic HTML tags (`h1`-`h6`) by default
- Link uses the router's `A` component for navigation
- All components support standard HTML attributes via `el` prop

## Options

### Heading
- `level?: 1 | 2 | 3 | 4 | 5 | 6` - Heading level (default: `2`)
- `tag?: JSX.HTMLElementTag` - HTML tag (default: `h{level}`)
- `variant?: Variant` - Semantic variant (default: `'primary'`)
- `align?: 'start' | 'center' | 'end'` - Text alignment (default: `'start'`)
- `el?: JSX.GlobalHTMLAttributes` - Additional HTML attributes
- `children?: JSX.Children` - Heading content

### Text
- `tag?: JSX.HTMLElementTag` - HTML tag (default: `'p'`)
- `variant?: Variant` - Semantic variant (default: `'primary'`)
- `size?: 'sm' | 'md' | 'lg'` - Text size (default: `'md'`)
- `muted?: boolean` - Muted styling (default: `false`)
- `el?: JSX.GlobalHTMLAttributes` - Additional HTML attributes
- `children?: JSX.Children` - Text content

### Link
- `variant?: Variant` - Semantic variant (default: `'primary'`)
- `underline?: boolean` - Show underline (default: `true`)
- All standard `<a>` HTML attributes (href, target, etc.)

## Notes

- Heading level is clamped between 1 and 6
- Link component uses the router's `A` component internally for client-side navigation
- Customize typography styles via `src/components/variants.scss`

