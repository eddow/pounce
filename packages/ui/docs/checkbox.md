# Checkbox

This page covers the three related control models exported from `src/models/checkbox.ts`:

- `checkboxModel`
- `radioModel`
- `switchModel`

## Shared control props

All three models share these control-level fields:

```ts
type ControlBaseProps = VariantProps &
	DisableableProps &
	CheckedProps &
	ElementPassthroughProps<'input'> & {
		labelPosition?: 'start' | 'end'
		description?: JSX.Element | string
		name?: string
		children?: JSX.Children
	}
```

`labelPosition` is implemented through `style.order` on the input spread group.

## `checkboxModel`

### Props

```ts
type CheckboxProps<Value = unknown> = ControlBaseProps & {
	checked?: boolean
	value?: Value
	group?: GroupCollection<Value>
}
```

### Behavior

- without `group`, `checked` comes from `props.checked`
- with `group` and `value`, checked state is derived from membership in the group collection
- `indeterminate` is exposed when `props.checked === undefined` and no group binding is active
- `onChange` receives the boolean DOM checked state

### Return shape

```ts
type CheckboxModel = {
	readonly input: {
		readonly type: 'checkbox'
		readonly checked?: boolean
		readonly disabled?: boolean
		readonly indeterminate?: boolean
		readonly style: { readonly order: -1 | 0 }
		onChange?: (e: Event) => void
	}
}
```

## `radioModel`

### Props

```ts
type RadioProps<Value = unknown> = ControlBaseProps & {
	value?: Value
	group?: Value
}
```

### Behavior

- `checked` is derived from `props.group === props.value`
- writing `input.checked = true` writes back to `props.group`
- radio grouping is value-based rather than collection-based
- `name` is passed through for native browser grouping behavior

### Return shape

```ts
type RadioModel = {
	readonly input: {
		readonly type: 'radio'
		checked: boolean
		readonly name?: string
		readonly disabled?: boolean
		readonly style: { readonly order: -1 | 0 }
		readonly onChange?: (e: Event) => void
	}
}
```

## `switchModel`

### Props

```ts
type SwitchProps = ControlBaseProps & {
	checked?: boolean
}
```

### Behavior

- renders as `type="checkbox"`
- adds `role="switch"`
- mirrors `checked` via `aria-checked`
- forwards DOM changes through `props.onChange?.(checked)`

### Return shape

```ts
type SwitchModel = {
	readonly input: {
		readonly type: 'checkbox'
		readonly role: 'switch'
		readonly checked?: boolean
		readonly disabled?: boolean
		readonly 'aria-checked'?: boolean
		readonly style: { readonly order: -1 | 0 }
		readonly onChange?: (e: Event) => void
	}
}
```

## Usage

```tsx
import { checkboxModel, radioModel, switchModel } from '@sursaut/ui'

function Checkbox(props) {
	const model = checkboxModel(props)
	return (
		<label style="display: inline-flex; align-items: center; gap: 8px;">
			<input {...model.input} />
			{props.children}
		</label>
	)
}
```

## Notes

- `checkboxModel` supports checked, unchecked, and indeterminate states
- `radioModel` is controlled through a single shared `group` value
- `switchModel` is semantically a switch but still uses a checkbox input underneath
- all three models are headless: adapters own all markup outside the spread groups
