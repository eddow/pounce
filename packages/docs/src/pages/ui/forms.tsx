import { reactive } from 'mutts'
import { Select, Combobox, Checkbox, Radio, Switch, Stack, Inline } from '@pounce/ui'
import { Section, Demo, ApiTable } from '../../components'

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
  const state = reactive({ notifications: true, alerts: false, disabled: false, variant: 'primary' })
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
        <Checkbox checked={state.alerts} variant={state.variant} disabled={state.disabled} description="Weekly digest">
          Alerts
        </Checkbox>
      </Stack>
      <span style="opacity: 0.6">
        notifications: {state.notifications ? 'true' : 'false'}, alerts: {state.alerts ? 'true' : 'false'}
      </span>
    </Stack>
  )
}

function RadioDemo() {
  const state = reactive({ color: 'red', variant: 'primary' })
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
        <Radio name="color" value="red" group={state.color} variant={state.variant}>Red</Radio>
        <Radio name="color" value="green" group={state.color} variant={state.variant}>Green</Radio>
        <Radio name="color" value="blue" group={state.color} variant={state.variant}>Blue</Radio>
      </Stack>
      <span style="opacity: 0.6">Selected: {state.color}</span>
    </Stack>
  )
}

function SwitchDemo() {
  const state = reactive({ dark: false, notifications: true, variant: 'primary', labelPosition: 'end' as 'start' | 'end' })
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
        <Switch checked={state.notifications} variant={state.variant} labelPosition={state.labelPosition} description="Push and email">
          Notifications
        </Switch>
      </Stack>
      <span style="opacity: 0.6">
        dark: {state.dark ? 'true' : 'false'}, notifications: {state.notifications ? 'true' : 'false'}
      </span>
    </Stack>
  )
}

export default function FormsPage() {
  return (
    <article>
      <h1>Form Components</h1>
      <p>
        Select, Combobox, Checkbox, Radio, and Switch.
        All support variant dot-syntax and two-way binding.
      </p>

      <Section title="Select">
        <Demo title="Select" source={selectSource} component={<SelectDemo />} />
        <ApiTable props={[
          { name: 'variant', type: 'string', description: "Accent color variant. Default: 'primary'", required: false },
          { name: 'fullWidth', type: 'boolean', description: 'Stretch to container width. Default: false', required: false },
          { name: '...native', type: 'JSX.IntrinsicElements["select"]', description: 'All native <select> attributes (value, disabled, etc.)', required: false },
        ]} />
      </Section>

      <Section title="Combobox">
        <Demo title="Combobox" source={comboboxSource} component={<ComboboxDemo />} />
        <ApiTable props={[
          { name: 'options', type: 'Array<string | { value, label? }>', description: 'Suggestion list rendered as <datalist> options', required: false },
          { name: 'variant', type: 'string', description: "Accent color variant. Default: 'primary'", required: false },
          { name: '...native', type: 'JSX.IntrinsicElements["input"]', description: 'All native <input> attributes (value, placeholder, etc.)', required: false },
        ]} />
      </Section>

      <Section title="Checkbox">
        <p>Two-way binding on <code>checked</code>. Supports <code>label</code>, <code>description</code>, and <code>variant</code>.</p>
        <Demo title="Checkbox" source={checkboxSource} component={<CheckboxDemo />} />
        <ApiTable props={[
          { name: 'checked', type: 'boolean', description: 'Checked state — two-way bound', required: false },
          { name: 'label', type: 'JSX.Element | string', description: 'Label text (or use children)', required: false },
          { name: 'description', type: 'JSX.Element | string', description: 'Helper text below the label', required: false },
          { name: 'variant', type: 'string', description: "Accent color variant. Default: 'primary'", required: false },
          { name: 'disabled', type: 'boolean', description: 'Disable the checkbox', required: false },
          { name: 'name', type: 'string', description: 'Form field name', required: false },
          { name: 'el', type: 'JSX.IntrinsicElements["label"]', description: 'Pass-through attributes on the wrapper <label>', required: false },
        ]} />
      </Section>

      <Section title="Radio">
        <p>
          Use <code>group</code> for two-way binding — the radio is checked when
          <code>group === value</code>, and clicking sets <code>group = value</code>.
        </p>
        <Demo title="Radio" source={radioSource} component={<RadioDemo />} />
        <ApiTable props={[
          { name: 'group', type: 'any', description: 'Two-way bound selected value. Checked when group === value', required: false },
          { name: 'checked', type: 'boolean', description: 'Direct checked state (alternative to group)', required: false },
          { name: 'value', type: 'string', description: 'Radio value — compared against group', required: false },
          { name: 'name', type: 'string', description: 'Radio group name (shared across radios)', required: false },
          { name: 'label', type: 'JSX.Element | string', description: 'Label text (or use children)', required: false },
          { name: 'description', type: 'JSX.Element | string', description: 'Helper text below the label', required: false },
          { name: 'variant', type: 'string', description: "Accent color variant. Default: 'primary'", required: false },
          { name: 'disabled', type: 'boolean', description: 'Disable the radio', required: false },
        ]} />
      </Section>

      <Section title="Switch">
        <p>Toggle switch with <code>role="switch"</code> semantics and <code>checked</code> two-way binding.</p>
        <Demo title="Switch" source={switchSource} component={<SwitchDemo />} />
        <ApiTable props={[
          { name: 'checked', type: 'boolean', description: 'Checked state — two-way bound', required: false },
          { name: 'labelPosition', type: "'start' | 'end'", description: "Label placement relative to the switch track. Default: 'end'", required: false },
          { name: 'label', type: 'JSX.Element | string', description: 'Label text (or use children)', required: false },
          { name: 'description', type: 'JSX.Element | string', description: 'Helper text below the label', required: false },
          { name: 'variant', type: 'string', description: "Accent color variant. Default: 'primary'", required: false },
          { name: 'disabled', type: 'boolean', description: 'Disable the switch', required: false },
          { name: 'name', type: 'string', description: 'Form field name', required: false },
        ]} />
      </Section>
    </article>
  )
}
