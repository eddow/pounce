import {
	Button,
	CheckButton,
	Checkbox,
	Combobox,
	Inline,
	Multiselect,
	type PicoVariant,
	Radio,
	RadioButton,
	Select,
	Stack,
	Switch,
} from '@sursaut'
import { splitButtonModel, splitRadioButtonModel } from '@sursaut/ui/models'
import { reactive } from 'mutts'
import { ApiTable, Demo, Section } from '../../components'

const selectSource = `<Select variant={state.variant} fullWidth={state.fullWidth}>
  <option>Option A</option>
  <option>Option B</option>
  <option>Option C</option>
</Select>`

const comboboxSource = `<Combobox
  options={['Apple', 'Banana', 'Cherry', 'Date']}
  placeholder="Type to search..."
/>`

const checkboxSource = `<Checkbox checked={state.notifications}>Notifications</Checkbox>
<Checkbox checked={state.alerts} description="Weekly digest">Alerts</Checkbox>`

const radioSource = `// group= two-way binds to the selected value.
// Checked when group === value; clicking sets group = value.
<Radio name="color" value="red" group={state.color}>Red</Radio>
<Radio name="color" value="green" group={state.color}>Green</Radio>
<Radio name="color" value="blue" group={state.color}>Blue</Radio>`

const switchSource = `<Switch checked={state.dark}>Dark mode</Switch>
<Switch checked={state.notifications} labelPosition="start">
  Notifications
</Switch>`

const checkButtonSource = `<CheckButton
  variant={state.variant}
  icon={state.icon || undefined}
  checked={state.checked}
>
  Favorite
</CheckButton>`

const radioButtonSource = `<RadioButton value="a" group={state.selected}>Alpha</RadioButton>
<RadioButton value="b" group={state.selected}>Beta</RadioButton>
<RadioButton value="c" group={state.selected} icon="settings">Gamma</RadioButton>`

const multiselectSource = `<Multiselect
  items={fruits}
  value={selected}
  renderItem={(item, on) => <span>{on ? '✓ ' : ''}{item}</span>}
>
  <Button>Pick fruits</Button>
</Multiselect>`

const splitButtonSource = `const model = splitButtonModel({
  value: state.action,
  items: [
    { value: 'save', label: 'Save', onClick: () => run('Save') },
    { value: 'saveAs', label: 'Save as…', onClick: () => run('Save as…') },
    { value: 'share', label: 'Share', onClick: () => run('Share') },
  ],
  onValueChange: (value) => (state.action = value),
})

<button {...model.button}>{model.selected?.label}</button>
<button {...model.trigger}>▾</button>`

const splitRadioButtonSource = `const model = splitRadioButtonModel({
  items: [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ],
  get group() {
    return state.align
  },
  set group(value) {
    state.align = value
  },
  onClick: (value) => run(\`Align \${value}\`),
})

<button {...model.button}>{model.selected?.label}</button>
<button {...model.trigger}>▾</button>`

function SelectDemo() {
	const state = reactive({ variant: 'primary', fullWidth: false, value: '' })
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="success">success</option>
						<option value="warning">warning</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<Switch checked={state.fullWidth}>fullWidth</Switch>
			</Inline>
			<hr />
			<Select variant={state.variant} fullWidth={state.fullWidth} value={state.value}>
				<option value="">Pick one...</option>
				<option value="a">Option A</option>
				<option value="b">Option B</option>
				<option value="c">Option C</option>
			</Select>
			<span style="opacity: 0.6">Selected: {state.value || '(none)'}</span>
		</Stack>
	)
}

function ComboboxDemo() {
	const state = reactive({ value: '' })
	return (
		<Stack gap="md">
			<Combobox
				options={['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig']}
				placeholder="Type to search..."
				value={state.value}
			/>
			<span style="opacity: 0.6">Value: {state.value || '(empty)'}</span>
		</Stack>
	)
}

function CheckboxDemo() {
	const state = reactive({
		notifications: true,
		alerts: false,
		disabled: false,
		variant: 'primary' as PicoVariant,
	})
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="success">success</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<Switch checked={state.disabled}>disabled</Switch>
			</Inline>
			<hr />
			<Stack gap="sm">
				<Checkbox checked={state.notifications} variant={state.variant} disabled={state.disabled}>
					Notifications
				</Checkbox>
				<Checkbox
					checked={state.alerts}
					variant={state.variant}
					disabled={state.disabled}
					description="Weekly digest"
				>
					Alerts
				</Checkbox>
			</Stack>
			<span style="opacity: 0.6">
				notifications: {state.notifications ? 'true' : 'false'}, alerts:{' '}
				{state.alerts ? 'true' : 'false'}
			</span>
		</Stack>
	)
}

function RadioDemo() {
	const state = reactive({ color: 'red', variant: 'primary' as PicoVariant })
	return (
		<Stack gap="md">
			<label>
				variant
				<Select value={state.variant}>
					<option value="primary">primary</option>
					<option value="success">success</option>
					<option value="danger">danger</option>
				</Select>
			</label>
			<hr />
			<Stack gap="sm">
				<Radio name="color" value="red" group={state.color} variant={state.variant}>
					Red
				</Radio>
				<Radio name="color" value="green" group={state.color} variant={state.variant}>
					Green
				</Radio>
				<Radio name="color" value="blue" group={state.color} variant={state.variant}>
					Blue
				</Radio>
			</Stack>
			<span style="opacity: 0.6">Selected: {state.color}</span>
		</Stack>
	)
}

function SwitchDemo() {
	const state = reactive({
		dark: false,
		notifications: true,
		variant: 'primary' as PicoVariant,
		labelPosition: 'end' as 'start' | 'end',
	})
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="success">success</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<label>
					labelPosition
					<Select value={state.labelPosition}>
						<option value="end">end</option>
						<option value="start">start</option>
					</Select>
				</label>
			</Inline>
			<hr />
			<Stack gap="sm">
				<Switch checked={state.dark} variant={state.variant} labelPosition={state.labelPosition}>
					Dark mode
				</Switch>
				<Switch
					checked={state.notifications}
					variant={state.variant}
					labelPosition={state.labelPosition}
					description="Push and email"
				>
					Notifications
				</Switch>
			</Stack>
			<span style="opacity: 0.6">
				dark: {state.dark ? 'true' : 'false'}, notifications:{' '}
				{state.notifications ? 'true' : 'false'}
			</span>
		</Stack>
	)
}

function CheckButtonDemo() {
	const state = reactive({ checked: false, variant: 'primary' as PicoVariant, icon: '' })
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="success">success</option>
						<option value="danger">danger</option>
					</Select>
				</label>
				<label>
					icon
					<Select value={state.icon}>
						<option value="">none</option>
						<option value="check">check</option>
						<option value="star">star</option>
						<option value="settings">settings</option>
					</Select>
				</label>
			</Inline>
			<hr />
			<Inline gap="sm">
				<CheckButton variant={state.variant} icon={state.icon || undefined} checked={state.checked}>
					Favorite
				</CheckButton>
				<CheckButton
					variant={state.variant}
					icon={state.icon || undefined}
					checked={!state.checked}
				>
					Bookmark
				</CheckButton>
			</Inline>
			<span style="opacity: 0.6">checked: {state.checked ? 'true' : 'false'}</span>
		</Stack>
	)
}

function RadioButtonDemo() {
	const state = reactive({ selected: 'a' as string, variant: 'primary' as PicoVariant })
	return (
		<Stack gap="md">
			<label>
				variant
				<Select value={state.variant}>
					<option value="primary">primary</option>
					<option value="success">success</option>
					<option value="danger">danger</option>
				</Select>
			</label>
			<hr />
			<Inline gap="sm">
				<RadioButton value="a" group={state.selected} variant={state.variant}>
					Alpha
				</RadioButton>
				<RadioButton value="b" group={state.selected} variant={state.variant}>
					Beta
				</RadioButton>
				<RadioButton value="c" group={state.selected} variant={state.variant} icon="settings">
					Gamma
				</RadioButton>
			</Inline>
			<span style="opacity: 0.6">selected: {state.selected}</span>
		</Stack>
	)
}

function MultiselectDemo() {
	const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig']
	const selected = reactive(new Set<string>())
	return (
		<Stack gap="md">
			<Multiselect
				items={fruits}
				value={selected}
				renderItem={(item: string, on: boolean) => (
					<span>
						{on ? '✓ ' : ''}
						{item}
					</span>
				)}
			>
				<Button>Pick fruits ({selected.size})</Button>
			</Multiselect>
			<span style="opacity: 0.6">selected: {[...selected].join(', ') || '(none)'}</span>
		</Stack>
	)
}

function SplitButtonDemo() {
	const state = reactive({ action: 'save' as 'save' | 'saveAs' | 'share', lastAction: 'none' })
	const model = splitButtonModel({
		get value() {
			return state.action
		},
		items: [
			{ value: 'save' as const, label: 'Save', onClick: () => (state.lastAction = 'Save') },
			{
				value: 'saveAs' as const,
				label: 'Save as…',
				onClick: () => (state.lastAction = 'Save as…'),
			},
			{ value: 'share' as const, label: 'Share', onClick: () => (state.lastAction = 'Share') },
		],
		onValueChange: (value: 'save' | 'saveAs' | 'share') => {
			state.action = value
		},
	})
	return (
		<Stack gap="md">
			<div style="position: relative; display: inline-flex; width: fit-content;">
				<Button {...model.button}>{model.selected?.label ?? 'Choose action'}</Button>
				<Button {...model.trigger}>▾</Button>
				<Stack
					if={model.open}
					gap="xs"
					style="position: absolute; top: calc(100% + 4px); left: 0; min-width: 180px; padding: 6px; border: 1px solid var(--pico-muted-border-color); border-radius: 8px; background: var(--pico-background-color); z-index: 1;"
					{...model.menu}
				>
					<for each={model.items}>
						{(item) => (
							<Button {...item.button}>{item.item.label ?? String(item.item.value)}</Button>
						)}
					</for>
				</Stack>
			</div>
			<span style="opacity: 0.6">
				selected: {state.action} · last run: {state.lastAction}
			</span>
		</Stack>
	)
}

function SplitRadioButtonDemo() {
	const state = reactive({ align: 'left' as 'left' | 'center' | 'right', lastAction: 'none' })
	const model = splitRadioButtonModel({
		items: [
			{ value: 'left' as const, label: 'Left' },
			{ value: 'center' as const, label: 'Center' },
			{ value: 'right' as const, label: 'Right' },
		],
		get group() {
			return state.align
		},
		set group(value) {
			state.align = value
		},
		onClick: (value: 'left' | 'center' | 'right' | undefined) => {
			if (value) state.lastAction = `Align ${value}`
		},
	})
	return (
		<Stack gap="md">
			<div style="position: relative; display: inline-flex; width: fit-content;">
				<Button {...model.button}>{model.selected?.label ?? 'Choose alignment'}</Button>
				<Button {...model.trigger}>▾</Button>
				<Stack
					if={model.open}
					gap="xs"
					style="position: absolute; top: calc(100% + 4px); left: 0; min-width: 180px; padding: 6px; border: 1px solid var(--pico-muted-border-color); border-radius: 8px; background: var(--pico-background-color); z-index: 1;"
					{...model.menu}
				>
					<for each={model.items}>
						{(item) => (
							<Button {...item.button} variant={item.checked ? 'primary' : undefined}>
								{item.item.label ?? String(item.item.value)}
							</Button>
						)}
					</for>
				</Stack>
			</div>
			<span style="opacity: 0.6">
				alignment: {state.align} · last run: {state.lastAction}
			</span>
		</Stack>
	)
}

export default function FormsPage() {
	return (
		<article>
			<h1>Form Components</h1>
			<p>
				Select, Combobox, Checkbox, Radio, Switch, CheckButton, RadioButton, and Multiselect. All
				support variant dot-syntax and two-way binding.
			</p>

			<Section title="Select">
				<Demo title="Select" source={selectSource} component={<SelectDemo />} />
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Accent color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'fullWidth',
							type: 'boolean',
							description: 'Stretch to container width. Default: false',
							required: false,
						},
						{
							name: '...native',
							type: 'JSX.IntrinsicElements["select"]',
							description: 'All native <select> attributes (value, disabled, etc.)',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Combobox">
				<Demo title="Combobox" source={comboboxSource} component={<ComboboxDemo />} />
				<ApiTable
					props={[
						{
							name: 'options',
							type: 'Array<string | { value, label? }>',
							description: 'Suggestion list rendered as <datalist> options',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Accent color variant. Default: 'primary'",
							required: false,
						},
						{
							name: '...native',
							type: 'JSX.IntrinsicElements["input"]',
							description: 'All native <input> attributes (value, placeholder, etc.)',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Checkbox">
				<p>
					Two-way binding on <code>checked</code>. Supports <code>label</code>,{' '}
					<code>description</code>, and <code>variant</code>.
				</p>
				<Demo title="Checkbox" source={checkboxSource} component={<CheckboxDemo />} />
				<ApiTable
					props={[
						{
							name: 'checked',
							type: 'boolean',
							description: 'Checked state — two-way bound',
							required: false,
						},
						{
							name: 'label',
							type: 'JSX.Element | string',
							description: 'Label text (or use children)',
							required: false,
						},
						{
							name: 'description',
							type: 'JSX.Element | string',
							description: 'Helper text below the label',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Accent color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disable the checkbox',
							required: false,
						},
						{ name: 'name', type: 'string', description: 'Form field name', required: false },
						{
							name: 'el',
							type: 'JSX.IntrinsicElements["label"]',
							description: 'Pass-through attributes on the wrapper <label>',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Radio">
				<p>
					Use <code>group</code> for two-way binding — the radio is checked when
					<code>group === value</code>, and clicking sets <code>group = value</code>.
				</p>
				<Demo title="Radio" source={radioSource} component={<RadioDemo />} />
				<ApiTable
					props={[
						{
							name: 'group',
							type: 'any',
							description: 'Two-way bound selected value. Checked when group === value',
							required: false,
						},
						{
							name: 'checked',
							type: 'boolean',
							description: 'Direct checked state (alternative to group)',
							required: false,
						},
						{
							name: 'value',
							type: 'string',
							description: 'Radio value — compared against group',
							required: false,
						},
						{
							name: 'name',
							type: 'string',
							description: 'Radio group name (shared across radios)',
							required: false,
						},
						{
							name: 'label',
							type: 'JSX.Element | string',
							description: 'Label text (or use children)',
							required: false,
						},
						{
							name: 'description',
							type: 'JSX.Element | string',
							description: 'Helper text below the label',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Accent color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disable the radio',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Switch">
				<p>
					Toggle switch with <code>role="switch"</code> semantics and <code>checked</code> two-way
					binding.
				</p>
				<Demo title="Switch" source={switchSource} component={<SwitchDemo />} />
				<ApiTable
					props={[
						{
							name: 'checked',
							type: 'boolean',
							description: 'Checked state — two-way bound',
							required: false,
						},
						{
							name: 'labelPosition',
							type: "'start' | 'end'",
							description: "Label placement relative to the switch track. Default: 'end'",
							required: false,
						},
						{
							name: 'label',
							type: 'JSX.Element | string',
							description: 'Label text (or use children)',
							required: false,
						},
						{
							name: 'description',
							type: 'JSX.Element | string',
							description: 'Helper text below the label',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Accent color variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disable the switch',
							required: false,
						},
						{ name: 'name', type: 'string', description: 'Form field name', required: false },
					]}
				/>
			</Section>
			<Section title="CheckButton">
				<p>
					Toggle button with <code>role="checkbox"</code> semantics. Supports variant dot-syntax:{' '}
					<code>{'<CheckButton.danger>'}</code>.
				</p>
				<Demo title="CheckButton" source={checkButtonSource} component={<CheckButtonDemo />} />
				<ApiTable
					props={[
						{
							name: 'checked',
							type: 'boolean',
							description: 'Controlled checked state — two-way bound. Default: false',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'icon',
							type: 'string | JSX.Element',
							description: 'Icon name or JSX element',
							required: false,
						},
						{
							name: 'iconPosition',
							type: "'start' | 'end'",
							description: "Icon placement. Default: 'start'",
							required: false,
						},
						{
							name: 'onCheckedChange',
							type: '(checked: boolean) => void',
							description: 'Callback when checked state changes',
							required: false,
						},
						{
							name: 'aria-label',
							type: 'string',
							description: 'Accessible label — required for icon-only buttons',
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.HTMLAttributes<"button">',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Button label. Omit for icon-only',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="RadioButton">
				<p>
					Button-style radio with <code>role="radio"</code> semantics. Uses <code>group</code>/
					<code>value</code> two-way binding like <code>Radio</code>. Supports variant dot-syntax.
				</p>
				<Demo title="RadioButton" source={radioButtonSource} component={<RadioButtonDemo />} />
				<ApiTable
					props={[
						{
							name: 'group',
							type: 'any',
							description: 'Two-way bound selected value. Checked when group === value',
							required: false,
						},
						{
							name: 'value',
							type: 'any',
							description: "This button's value — compared against group",
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'icon',
							type: 'string | JSX.Element',
							description: 'Icon name or JSX element',
							required: false,
						},
						{
							name: 'iconPosition',
							type: "'start' | 'end'",
							description: "Icon placement. Default: 'start'",
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disable the button',
							required: false,
						},
						{
							name: 'onClick',
							type: '(e: MouseEvent) => void',
							description: 'Click handler',
							required: false,
						},
						{
							name: 'ariaLabel',
							type: 'string',
							description: 'Accessible label — required for icon-only buttons',
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.HTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Button label',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Multiselect">
				<p>
					Dropdown multi-selection using native <code>{'<details>'}</code>/
					<code>{'<summary>'}</code>. Mutates a <code>Set</code> in place on toggle.
				</p>
				<Demo title="Multiselect" source={multiselectSource} component={<MultiselectDemo />} />
				<ApiTable
					props={[
						{ name: 'items', type: 'T[]', description: 'Available options', required: true },
						{
							name: 'value',
							type: 'Set<T>',
							description: 'Selected items — mutated in place on toggle',
							required: true,
						},
						{
							name: 'renderItem',
							type: '(item: T, checked: boolean) => JSX.Element | false',
							description: 'Renders each item. Return false to hide',
							required: true,
						},
						{
							name: 'children',
							type: 'JSX.Element',
							description: 'Trigger element rendered inside <summary>',
							required: true,
						},
						{
							name: 'closeOnSelect',
							type: 'boolean',
							description: 'Close dropdown after each selection. Default: true',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: "Variant name. Default: 'primary'",
							required: false,
						},
						{ name: 'class', type: 'string', description: 'CSS class override', required: false },
						{
							name: 'el',
							type: 'JSX.IntrinsicElements["details"]',
							description: 'Pass-through attributes on the <details> wrapper',
							required: false,
						},
					]}
				/>
			</Section>
			<Section title="SplitButton">
				<p>
					Split action button. The main button re-runs the selected action, and the trigger opens a
					menu to choose another action. Selecting from the menu both selects and executes it. It
					consumes arranged scope; split controls default to <code>joined=true</code> and can flip
					vertical through explicit or ambient organization props.
				</p>
				<Demo title="SplitButton" source={splitButtonSource} component={<SplitButtonDemo />} />
				<ApiTable
					props={[
						{
							name: 'value',
							type: 'T',
							description: 'Currently selected item value',
							required: false,
						},
						{
							name: 'items',
							type: 'Array<{ value: T; label?: JSX.Children; disabled?: boolean; onClick?: (value, e) => void }>',
							description: 'Available actions shown in the menu',
							required: true,
						},
						{
							name: 'onValueChange',
							type: '(value: T) => void',
							description: 'Called when a menu item becomes selected',
							required: false,
						},
						{
							name: 'onClick',
							type: '(value: T | undefined, e: MouseEvent) => void',
							description: 'Primary action callback, also called after menu activation',
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disables both the primary button and the trigger',
							required: false,
						},
						{
							name: 'menuAriaLabel',
							type: 'string',
							description: 'Accessible label for the menu trigger/menu',
							required: false,
						},
						{
							name: 'orientation',
							type: "'horizontal' | 'vertical'",
							description: 'Organization axis, also used for split layout and menu anchoring',
							required: false,
						},
						{
							name: 'joined',
							type: 'boolean',
							description: 'Whether the main button and trigger are visually joined. Default: true',
							required: false,
						},
					]}
				/>
			</Section>
			<Section title="SplitRadioButton">
				<p>
					Split button with exclusive menu choices. Menu items expose radio semantics and selecting
					one updates the current primary action. It also consumes arranged scope, including
					vertical layout and the default <code>joined=true</code> split styling.
				</p>
				<Demo
					title="SplitRadioButton"
					source={splitRadioButtonSource}
					component={<SplitRadioButtonDemo />}
				/>
				<ApiTable
					props={[
						{
							name: 'group',
							type: 'T',
							description: 'Current selected value in the shared radio group',
							required: false,
						},
						{
							name: 'items',
							type: 'Array<{ value: T; label?: JSX.Children; disabled?: boolean }>',
							description: 'Exclusive menu choices',
							required: true,
						},
						{
							name: 'onClick',
							type: '(value: T | undefined, e: MouseEvent) => void',
							description: 'Called for the current primary action and after menu selection',
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disables the control',
							required: false,
						},
						{
							name: 'menuAriaLabel',
							type: 'string',
							description: 'Accessible label for the menu trigger/menu',
							required: false,
						},
						{
							name: 'orientation',
							type: "'horizontal' | 'vertical'",
							description: 'Organization axis, also used for split layout and menu anchoring',
							required: false,
						},
						{
							name: 'joined',
							type: 'boolean',
							description: 'Whether the main button and trigger are visually joined. Default: true',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
