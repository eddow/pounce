# Badged

Wrapper component that adds a badge indicator to any element, positioned at one of the four corners.

## Basic

```tsx
import { Badged, Button } from '@pounce/pico'

<Badged badge={5}>
	<Button>Inbox</Button>
</Badged>
```

## Badge Content

Badges can display numbers, strings, or JSX elements:

```tsx
// Number badge
<Badged badge={42}>
	<Button>Notifications</Button>
</Badged>

// String badge
<Badged badge="New">
	<Button>Messages</Button>
</Badged>

// Custom JSX badge
<Badged badge={<Icon name="mdi:star" />}>
	<Button>Favorite</Button>
</Badged>
```

## Position

Control badge position with the `position` prop:

```tsx
<Badged badge={3} position="top-right">   {/* default */}
	<Button>Top Right</Button>
</Badged>

<Badged badge={3} position="top-left">
	<Button>Top Left</Button>
</Badged>

<Badged badge={3} position="bottom-right">
	<Button>Bottom Right</Button>
</Badged>

<Badged badge={3} position="bottom-left">
	<Button>Bottom Left</Button>
</Badged>
```

## With Links

Works with any element:

```tsx
<Badged badge="New" position="top-left">
	<A href="/new">New Items</A>
</Badged>
```

## With CheckButton

```tsx
<Badged badge={<Icon name="mdi:star" />}>
	<CheckButton>Favorite</CheckButton>
</Badged>
```

## Options

- `badge: number | string | JSX.Element` - Badge content (required)
- `position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'` - Badge position (default: `'top-right'`)
- `children: JSX.Element` - Element to badge (required)

## Notes

- The badge is positioned absolutely relative to the wrapped element
- The wrapped element fills the Badged wrapper's dimensions
- Badge has `aria-hidden="true"` for accessibility (decorative indicator)

