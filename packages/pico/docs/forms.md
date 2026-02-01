# Forms

Form control components with consistent styling and variant support.

## Select

Dropdown select with variant support:

```tsx
import { Select } from '@pounce/pico'

<Select variant="primary">
	<option value="1">Option 1</option>
	<option value="2">Option 2</option>
</Select>
```

### Full Width

```tsx
<Select fullWidth>
	<option>Option 1</option>
	<option>Option 2</option>
</Select>
```

## Combobox

Input with datalist for autocomplete:

```tsx
import { Combobox } from '@pounce/pico'

<Combobox
	variant="primary"
	options={['Apple', 'Banana', 'Cherry']}
	placeholder="Search fruits..."
/>
```

### Custom Options

Options can be strings or objects with custom labels:

```tsx
<Combobox
	options={[
		'Simple option',
		{ value: 'custom', label: 'Custom Label' },
		{ value: 'same', label: 'Same as value' },
	]}
/>
```

## Checkbox

Checkbox with label and optional description:

```tsx
import { Checkbox } from '@pounce/pico'

<Checkbox variant="primary" checked={enabled}>
	Enable notifications
</Checkbox>
```

### With Description

```tsx
<Checkbox
	variant="primary"
	checked={subscribe}
	label="Subscribe to newsletter"
	description="Receive weekly updates via email"
/>
```

### Two-way Binding

```tsx
const enabled = stored(false)

<Checkbox checked={enabled}>
	Enable feature
</Checkbox>
// Clicking toggles enabled automatically
```

## Radio

Radio button with label and optional description:

```tsx
import { Radio } from '@pounce/pico'

const choice = stored('option1')

<Radio variant="primary" value="option1" checked={choice === 'option1'}>
	Option 1
</Radio>
<Radio variant="primary" value="option2" checked={choice === 'option2'}>
	Option 2
</Radio>
```

### With Description

```tsx
<Radio
	variant="primary"
	value="standard"
	label="Standard shipping"
	description="5-7 business days"
/>
```

## Switch

Toggle switch with label:

```tsx
import { Switch } from '@pounce/pico'

<Switch variant="primary" checked={enabled}>
	Enable dark mode
</Switch>
```

### Label Position

Labels can be positioned at the start or end (default: end):

```tsx
<Switch labelPosition="start" checked={enabled}>
	Label on left
</Switch>

<Switch labelPosition="end" checked={enabled}>
	Label on right
</Switch>
```

### With Description

```tsx
<Switch
	variant="primary"
	checked={syncEnabled}
	label="Sync settings"
	description="Automatically sync across devices"
/>
```

## Variants

All form controls support semantic variants:

```tsx
<Select variant="primary">...</Select>
<Select variant="secondary">...</Select>
<Select variant="danger">...</Select>
<Select variant="success">...</Select>
```

## Accessibility

- Checkbox and Radio use native `<input>` elements with proper labels
- Switch uses `role="switch"` with `aria-checked`
- All controls support `label` and `description` props for accessible labeling
- Use `labelProps` to pass additional attributes to the label element

## Options

### Select
- `variant?: Variant` - Control variant (default: `'primary'`)
- `fullWidth?: boolean` - Full width styling (default: `false`)
- All standard `<select>` HTML attributes

### Combobox
- `variant?: Variant` - Control variant (default: `'primary'`)
- `options?: readonly ComboboxOption[]` - Autocomplete options
- All standard `<input>` HTML attributes

### Checkbox / Radio
- `variant?: Variant` - Control variant (default: `'primary'`)
- `label?: JSX.Element | string` - Label text
- `description?: JSX.Element | string` - Description text
- `labelProps?: Omit<JSX.IntrinsicElements['label'], 'children'>` - Additional label attributes
- `el?: JSX.IntrinsicElements['label']` - Additional label HTML attributes
- All standard `<input>` HTML attributes

### Switch
- `variant?: Variant` - Control variant (default: `'primary'`)
- `labelPosition?: 'start' | 'end'` - Label position (default: `'end'`)
- `label?: JSX.Element | string` - Label text
- `description?: JSX.Element | string` - Description text
- `labelProps?: Omit<JSX.IntrinsicElements['label'], 'children'>` - Additional label attributes
- `el?: JSX.IntrinsicElements['label']` - Additional label HTML attributes
- All standard `<input>` HTML attributes

