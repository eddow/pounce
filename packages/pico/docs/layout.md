# Layout

Layout components for structuring content with consistent spacing and alignment.

## Container

Container with optional fluid width:

```tsx
import { Container } from '@pounce/pico'

<Container>
	Content with max-width constraint
</Container>

<Container fluid>
	Full-width content
</Container>
```

### Custom Tag

```tsx
<Container tag="section">
	Semantic section container
</Container>
```

## Stack

Vertical stack with consistent gap spacing:

```tsx
import { Stack } from '@pounce/pico'

<Stack gap="md">
	<div>Item 1</div>
	<div>Item 2</div>
	<div>Item 3</div>
</Stack>
```

### Gap Sizes

Predefined spacing tokens:

```tsx
<Stack gap="none">No gap</Stack>
<Stack gap="xs">Extra small gap</Stack>
<Stack gap="sm">Small gap</Stack>
<Stack gap="md">Medium gap (default)</Stack>
<Stack gap="lg">Large gap</Stack>
<Stack gap="xl">Extra large gap</Stack>

// Custom CSS value
<Stack gap="2rem">Custom gap</Stack>
```

### Alignment

Control alignment and justification:

```tsx
<Stack gap="md" align="center">
	Center-aligned items
</Stack>

<Stack gap="md" align="stretch">
	Stretched items
</Stack>

<Stack gap="md" justify="center">
	Centered vertically
</Stack>

<Stack gap="md" justify="between">
	Space between items
</Stack>
```

Alignment options:
- `align`: `'start' | 'center' | 'end' | 'baseline' | 'stretch'`
- `justify`: `'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'`

## Inline

Horizontal inline layout with gap:

```tsx
import { Inline } from '@pounce/pico'

<Inline gap="sm">
	<Button>Button 1</Button>
	<Button>Button 2</Button>
	<Button>Button 3</Button>
</Inline>
```

### Default Alignment

Inline defaults to `align="center"` and `gap="sm"`:

```tsx
<Inline>
	<Button>Centered by default</Button>
</Inline>
```

### Wrapping

Enable wrapping for responsive layouts:

```tsx
<Inline gap="sm" wrap>
	<Button>Wraps</Button>
	<Button>to next</Button>
	<Button>line when</Button>
	<Button>needed</Button>
</Inline>
```

### Alignment

```tsx
<Inline gap="sm" align="start">Start aligned</Inline>
<Inline gap="sm" align="end">End aligned</Inline>
<Inline gap="sm" justify="between">Space between</Inline>
```

## Grid

CSS Grid layout with flexible column configuration:

```tsx
import { Grid } from '@pounce/pico'

<Grid columns={3} gap="md">
	<div>Item 1</div>
	<div>Item 2</div>
	<div>Item 3</div>
</Grid>
```

### Auto-fit Columns

Use `minItemWidth` for responsive auto-fit grid:

```tsx
<Grid minItemWidth="200px" gap="md">
	<div>Auto-fits based on width</div>
	<div>Minimum 200px per item</div>
	<div>Wraps responsively</div>
</Grid>
```

### Custom Grid Template

Pass custom CSS grid template:

```tsx
<Grid columns="repeat(4, 1fr) 2fr" gap="md">
	<div>Custom template</div>
</Grid>
```

### Alignment

```tsx
<Grid columns={3} gap="md" align="center">
	Center-aligned grid items
</Grid>

<Grid columns={3} gap="md" justify="center">
	Centered grid items
</Grid>
```

Alignment options:
- `align`: `'start' | 'center' | 'end' | 'stretch'`
- `justify`: `'start' | 'center' | 'end' | 'stretch'`

## Spacing Tokens

Predefined spacing values (based on PicoCSS `--pico-spacing`):

- `none`: `0`
- `xs`: `calc(var(--pico-spacing) * 0.5)`
- `sm`: `var(--pico-spacing)`
- `md`: `calc(var(--pico-spacing) * 1.5)` (default for Stack/Grid)
- `lg`: `calc(var(--pico-spacing) * 2)`
- `xl`: `calc(var(--pico-spacing) * 3)`

Or use any CSS value: `"2rem"`, `"16px"`, etc.

## Options

### Container
- `tag?: JSX.HTMLElementTag` - HTML tag (default: `'div'`)
- `fluid?: boolean` - Full-width container (default: `false`)
- All standard `<div>` HTML attributes

### Stack
- `gap?: SpacingToken` - Vertical gap (default: `'md'`)
- `align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'` - Cross-axis alignment
- `justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'` - Main-axis justification
- All standard `<div>` HTML attributes

### Inline
- `gap?: SpacingToken` - Horizontal gap (default: `'sm'`)
- `align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'` - Cross-axis alignment (default: `'center'`)
- `justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'` - Main-axis justification
- `wrap?: boolean` - Enable wrapping (default: `false`)
- All standard `<div>` HTML attributes

### Grid
- `gap?: SpacingToken` - Grid gap (default: `'md'`)
- `columns?: number | string` - Column template (number or CSS value)
- `minItemWidth?: string` - Minimum item width for auto-fit (CSS value)
- `align?: 'start' | 'center' | 'end' | 'stretch'` - Grid item alignment
- `justify?: 'start' | 'center' | 'end' | 'stretch'` - Grid item justification
- All standard `<div>` HTML attributes

