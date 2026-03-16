# Split button models

This page covers the two related split-action models exported from `src/models/splitbutton.tsx` and `src/models/splitradiobutton.tsx`:

- `splitButtonModel`
- `splitRadioButtonModel`

## `splitButtonModel`

### Props

```ts
type SplitButtonItem<Value = string> = {
	value: Value
	label?: JSX.Children
	disabled?: boolean
	onClick?: (value: Value, e: MouseEvent) => void
}

type SplitButtonProps<Value = string> = VariantProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		value?: Value
		items: readonly SplitButtonItem<Value>[]
		onClick?: (value: Value | undefined, e: MouseEvent) => void
		onValueChange?: (value: Value) => void
		children?: JSX.Children
		menuAriaLabel?: string
	}
```

### Behavior

- `value` controls the primary selected item
- clicking the main button re-runs the selected item
- selecting from the menu calls `onValueChange(value)`
- selecting from the menu also calls the item `onClick` and the control `onClick`
- the menu owns its own internal open state
- disabled state suppresses both primary and menu interactions

### Return shape

```ts
type SplitButtonModel<Value = string> = {
	readonly selected: SplitButtonItem<Value> | undefined
	readonly hasSelection: boolean
	readonly open: boolean
	readonly button: JSX.IntrinsicElements['button']
	readonly trigger: JSX.IntrinsicElements['button']
	readonly menu: JSX.IntrinsicElements['div']
	readonly items: readonly {
		readonly item: SplitButtonItem<Value>
		readonly button: JSX.IntrinsicElements['button']
		activate: (e: MouseEvent) => void
	}[]
	toggleMenu: (e?: MouseEvent) => void
	closeMenu: () => void
	clickSelected: (e: MouseEvent) => void
}
```

### Usage

```tsx
import { splitButtonModel } from '@sursaut/ui'

function SplitButton(props) {
	const model = splitButtonModel(props)
	return (
		<div>
			<button {...model.button}>{model.selected?.label ?? 'Choose action'}</button>
			<button {...model.trigger}>▾</button>
			{model.open && (
				<div {...model.menu}>
					{model.items.map((item) => (
						<button {...item.button}>{item.item.label}</button>
					))}
				</div>
			)}
		</div>
	)
}
```

## `splitRadioButtonModel`

### Props

```ts
type SplitRadioButtonItem<Value = string> = {
	value: Value
	label?: JSX.Children
	disabled?: boolean
}

type SplitRadioButtonProps<Value = string> = VariantProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		value?: Value
		group?: Value
		items: readonly SplitRadioButtonItem<Value>[]
		onClick?: (value: Value | undefined, e: MouseEvent) => void
		onValueChange?: (value: Value) => void
		children?: JSX.Children
		menuAriaLabel?: string
	}
```

### Behavior

- `value` is the split control's selected primary item
- `group` is the external radio-group value used to derive checked state
- changing `group` externally updates checked styling and `aria-checked`, but does not overwrite `value`
- clicking the main button writes the selected item back into `group`
- selecting from the menu updates `value` through `onValueChange`, writes the same item into `group`, and calls `onClick`
- menu items use `role="menuitemradio"` and expose `aria-checked`
- the main button uses `role="radio"` and exposes `aria-checked`

### Return shape

```ts
type SplitRadioButtonModel<Value = string> = {
	readonly selected: SplitRadioButtonItem<Value> | undefined
	readonly checked: boolean
	readonly hasSelection: boolean
	readonly open: boolean
	readonly button: JSX.IntrinsicElements['button'] & {
		readonly role: 'radio'
		readonly 'aria-checked': 'true' | 'false'
	}
	readonly trigger: JSX.IntrinsicElements['button']
	readonly menu: JSX.IntrinsicElements['div']
	readonly items: readonly {
		readonly item: SplitRadioButtonItem<Value>
		readonly checked: boolean
		readonly button: JSX.IntrinsicElements['button'] & {
			readonly role: 'menuitemradio'
			readonly 'aria-checked': 'true' | 'false'
		}
		select: (e: MouseEvent) => void
	}[]
	toggleMenu: (e?: MouseEvent) => void
	closeMenu: () => void
	clickSelected: (e: MouseEvent) => void
}
```

### Usage

```tsx
import { splitRadioButtonModel } from '@sursaut/ui'

function SplitRadioButton(props) {
	const model = splitRadioButtonModel(props)
	return (
		<div>
			<button {...model.button}>{model.selected?.label ?? 'Choose option'}</button>
			<button {...model.trigger}>▾</button>
			{model.open && (
				<div {...model.menu}>
					{model.items.map((item) => (
						<button {...item.button}>{item.item.label}</button>
					))}
				</div>
			)}
		</div>
	)
}
```

## Notes

- both split models are headless and only return spread groups and behavior
- adapters/demos own layout, menu rendering, and visual styling
- `splitButtonModel` is action-first
- `splitRadioButtonModel` separates the selected primary value from the external checked group state
