# Overlay

The overlay module provides:

- a reactive overlay stack
- focus and transition helpers
- dialog / toast / drawer spec builders
- convenience binders for exposing overlay helpers from an adapter

## Core types

### `OverlaySpec<T>`

```ts
interface OverlaySpec<T = unknown> {
	id?: string
	mode: string
	render?: (close: (value: T) => void) => JSX.Children
	props?: any
	dismissible?: boolean
	autoFocus?: boolean | string
	aria?: {
		label?: string
		labelledby?: string
		describedby?: string
	}
}
```

### `OverlayEntry`

```ts
interface OverlayEntry extends OverlaySpec {
	id: string
	resolve: (value: unknown) => void
	closing?: boolean
}
```

## `createOverlayStack()`

This is the core state container.

```ts
interface OverlayStackState {
	readonly stack: OverlayEntry[]
	readonly hasBackdrop: boolean
	readonly push: <T>(spec: OverlaySpec<T>) => Promise<T | null>
	readonly registerElement: (id: string, el: HTMLElement) => void
	isClosing(id: string): boolean
	readonly onKeydown: (e: KeyboardEvent) => void
	readonly onBackdropClick: (e: MouseEvent) => void
}
```

Important differences from older docs:

- `push()` returns a `Promise<T | null>`
- there is no `remove()` or `clear()` API on the state object
- exit transitions are coordinated through `registerElement()` and `isClosing()`

## Basic usage

```tsx
import { createOverlayStack, dialogSpec } from '@pounce/ui'

function WithOverlays(props) {
	const state = createOverlayStack()

	return (
		<fragment>
			{props.children}
			<div onKeydown={state.onKeydown}>
				<div if={state.hasBackdrop} onClick={state.onBackdropClick}></div>
				<for each={state.stack}>
					{(entry) => entry.render?.(entry.resolve)}
				</for>
			</div>
		</fragment>
	)
}
```

## Spec builders

### `dialogSpec()`

Builds a modal dialog spec.

```ts
type DialogOptions = {
	title?: JSX.Children
	message?: JSX.Children
	size?: 'sm' | 'md' | 'lg'
	buttons?: Record<string, string | DialogButton>
	dismissible?: boolean
	variant?: string
	render?: (close: (value: unknown) => void) => JSX.Children
}
```

Returns an `OverlaySpec` with:

- `mode: 'modal'`
- `autoFocus: true`
- generated `aria.labelledby` / `aria.describedby` ids when title/message are present

### `toastSpec()`

Builds a toast overlay spec.

```ts
type ToastOptions = {
	message: JSX.Children
	variant?: 'success' | 'danger' | 'warning' | 'primary' | 'secondary'
	duration?: number
	render?: (close: (value: unknown) => void) => JSX.Children
}
```

Returns an `OverlaySpec` with:

- `mode: 'toast'`
- `dismissible: false`
- `autoFocus: false`
- optional timed auto-close inside `render`

### `drawerSpec()`

Builds a left or right drawer spec.

```ts
type DrawerOptions = {
	title?: JSX.Children
	children: JSX.Children
	footer?: JSX.Children
	side?: 'left' | 'right'
	dismissible?: boolean
	render?: (close: (value: unknown) => void) => JSX.Children
}
```

Returns an `OverlaySpec` with mode `drawer-left` or `drawer-right`.

## Helper binders

The module also exports:

- `bindDialog(push)`
- `bindToast(push)`
- `bindDrawer(push)`

These wrap a `push` function and give adapters convenient helper APIs such as:

- `dialog(...)`
- `dialog.confirm(...)`
- `toast.success(...)`
- `toast.error(...)`

## DOM helpers

The same module exports lower-level helpers for adapters:

- `applyTransition(element, type, config, onComplete)`
- `applyAutoFocus(container, strategy)`
- `trapFocus(container)`

These are useful when an adapter is responsible for rendering and animating the overlay shell.
