# Dialog

Programmatic dialogs with PicoCSS styling.

## Basic

```ts
import { dialog } from '@pounce/pico'
await dialog('This is a simple dialog')
```

## Custom buttons

```ts
await dialog({
	title: 'Confirm action',
	message: 'Are you sure?',
	buttons: {
		cancel: 'Cancel',
		ok: { text: 'Ok' },
	},
	default: 'ok',
})
```

## Stamp (optional)

Left-side illustration area between header and footer.

```ts
await dialog({
	title: 'Heads up',
	message: 'Please confirm.',
	stamp: 'mdi:alert', // or JSX: <Icon name="mdi:alert" size="48px" />
	buttons: { cancel: 'Cancel', ok: 'Ok' },
	default: 'ok',
})
```

## Enter handling

- If `default` is set and the default button is not disabled, Enter triggers it.
- Otherwise Enter triggers the first enabled button.

## Confirm helper

Simple boolean confirm.

```ts
import { confirm } from '@pounce/pico'
const ok = await confirm({ title: 'Confirm', message: 'Proceed?' })
```

Customization:

```ts
await confirm({
	title: 'Delete file',
	message: 'This cannot be undone.',
	okText: 'Delete',
	cancelText: 'Cancel',
	okVariant: 'danger',
})
```

## Styling

- Sizes: `size: 'sm' | 'md' | 'lg'` (sets width class)
- Actions: right-aligned via `.pp-actions[role="group"]`
- Stamp: two-column body grid when `stamp` is present; `.pp-stamp` is a 4rem square, icon ~2.25rem

Override styles via `src/components/variants.scss`.

## Accessibility

- Native `<dialog>` with `aria-modal="true"`
- Title: `<h3 id="pp-dialog-title">…</h3>` referenced via `aria-labelledby` when present
- If no title, pass `ariaLabel` to label the dialog
- Keyboard: Escape closes (unless `closeOnEscape: false`), Enter triggers default or first enabled action

## Options

- `title?: UIContent`
- `message?: UIContent`
- `stamp?: UIContent`
- `buttons?: Record<string, string | DialogButton>`
- `default?: keyof buttons`
- `size?: 'sm' | 'md' | 'lg'`
- `closeOnBackdrop?: boolean` (default: true)
- `closeOnEscape?: boolean` (default: true)
- `ariaLabel?: string` (used when no title)
- `class?: string`
