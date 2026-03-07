# Select

This page covers both exported selection helpers from `src/models/options.tsx`:

- `selectModel`
- `comboboxModel`

## Option type

Both APIs use the same option shape:

```ts
type Option = string | { value: string; label?: string; disabled?: boolean }
```

## `selectModel`

### Props

```ts
type SelectProps = VariantProps &
	DisableableProps &
	ValidationProps &
	ElementPassthroughProps<'select'> &
	JSX.IntrinsicElements['select'] & {
		fullWidth?: boolean
		options?: readonly Option[]
		onInput?: (value: string) => void
	}
```

`ValidationProps` currently includes:

```ts
type ValidationProps = {
	valid?: boolean | 'warning'
	validationMessage?: JSX.Children
}
```

### Return shape

```ts
type SelectModel = {
	readonly select: JSX.IntrinsicElements['select']
	readonly options: JSX.Element
}
```

### Important behavior

- `model.select` forwards almost all select attributes through to the target element
- `model.select.onInput` wraps the DOM event and calls your callback with `e.target.value`
- `model.options` renders the option list for you as JSX
- initial selection is derived from the initial `props.value`

### Usage

```tsx
import { selectModel } from '@pounce/ui'

function Select(props) {
	const model = selectModel(props)
	return <select {...model.select} {...props.el}>{model.options}</select>
}
```

## `comboboxModel`

### Props

```ts
type ComboboxProps = VariantProps &
	DisableableProps &
	ValidationProps & {
		el?: InputTextAttrs
	} & Omit<InputTextAttrs, 'list'> & {
		options?: readonly Option[]
	}
```

### Return shape

```ts
type ComboboxModel = {
	readonly input: InputTextAttrs
	readonly dataList: JSX.Element
}
```

### Important behavior

- the model generates a stable datalist id
- `model.input` supplies the `list` attribute for the input
- `model.dataList` renders the `<datalist>` with all options

### Usage

```tsx
import { comboboxModel } from '@pounce/ui'

function Combobox(props) {
	const model = comboboxModel(props)
	return (
		<div>
			<input {...props} {...model.input} />
			{model.dataList}
		</div>
	)
}
```

## Notes

- `selectModel` owns the option JSX rendering
- `comboboxModel` owns the datalist wiring only
- both APIs are string-based today
