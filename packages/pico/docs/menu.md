# Menu

Dropdown menu component built on native `<details>` with accessibility features.

## Basic

```tsx
import { Menu } from '@pounce/pico'

<Menu summary="Options">
	<Menu.Item href="/settings">Settings</Menu.Item>
	<Menu.Item href="/profile">Profile</Menu.Item>
	<Menu.Item href="/logout">Logout</Menu.Item>
</Menu>
```

## Multiple Items

```tsx
<Menu summary="More">
	<Menu.Item href="/item1">Item 1</Menu.Item>
	<Menu.Item href="/item2">Item 2</Menu.Item>
	<Menu.Item href="/item3">Item 3</Menu.Item>
</Menu>
```

## Custom Summary

Summary can be any JSX element:

```tsx
<Menu summary={<Button icon="mdi:menu">Menu</Button>}>
	<Menu.Item href="/home">Home</Menu.Item>
	<Menu.Item href="/about">About</Menu.Item>
</Menu>
```

## Single Item

Works with a single item:

```tsx
<Menu summary="Actions">
	<Menu.Item href="/new">New Item</Menu.Item>
</Menu>
```

## Custom Styling

```tsx
<Menu summary="Menu" class="my-custom-menu">
	<Menu.Item href="/item">Item</Menu.Item>
</Menu>
```

## Behavior

- Menu closes automatically when a menu item link is clicked
- Uses native `<details>` element for open/close state
- Summary has `aria-haspopup="menu"` for accessibility

## Accessibility

The Menu component includes development-time accessibility checks:

- Validates that `<summary>` exists inside `<details>`
- Validates that `<ul role="menu">` exists
- Validates that list items have `role="none"`
- Validates that actionable elements (links, buttons, or `role="menuitem"`) exist in each item
- Updates `aria-expanded` on summary when present

### Testing

When testing menus in Playwright or similar tools:

- Use `getByRole('menuitem', { name: ... })` to select menu items
- Do not use `getByRole('link')` as menu items are wrapped in `<li role="none">`

### Strict Mode

Set `globalThis.PounceA11y.STRICT = true` to throw errors instead of warnings for accessibility issues.

## Structure

The Menu component renders:

```html
<details class="dropdown">
	<summary aria-haspopup="menu">Summary</summary>
	<ul role="menu">
		<li role="none">
			<a href="..." role="menuitem">Item</a>
		</li>
	</ul>
</details>
```

## Options

### Menu
- `summary: JSX.Element | string` - Summary/toggle content (required)
- `children: JSX.Element | JSX.Element[]` - Menu items (required)
- `class?: string` - Additional CSS class (default: `'dropdown'`)

### Menu.Item
- `href: string` - Link URL (required)
- `children: JSX.Element | string` - Item content (required)

## Notes

- Menu items use the router's `A` component for navigation
- Menu automatically closes when clicking a menu item link
- The component validates structure in development mode

