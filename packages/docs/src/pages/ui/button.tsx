import { Button, ButtonGroup, Inline, Select, Stack, Switch } from '@pounce'
import { reactive } from 'mutts'
import { ApiTable, Code, Demo, Section } from '../../components'

const playgroundSource = `<Button
  variant={state.variant}
  disabled={state.disabled}
  icon={state.icon || undefined}
  iconPosition={state.iconPosition}
  tag={state.tag}
>
  {state.label}
</Button>`

const variantDotSyntax = `// Variant dot-syntax — shorthand for variant="..."
<Button.primary>Save</Button.primary>
<Button.danger>Delete</Button.danger>
<Button.success>Confirm</Button.success>
<Button.secondary>Cancel</Button.secondary>

// asVariant() creates these automatically from the adapter's
// variant list. Any variant defined in the adapter is available.`

const loadingState = `import { loading } from '@pounce/ui'

function SaveButton(_props: {}, env: Env) {
  env.loading = loading
  const state = reactive({ saving: false })

  function save() {
    state.saving = true
    setTimeout(() => { state.saving = false }, 2000)
  }

  return (
    <Button use:loading={state.saving} onClick={save}>
      Save
    </Button>
  )
}`

const buttonGroupCode = `<ButtonGroup>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>`

function ButtonPlayground() {
	const state = reactive({
		variant: 'primary',
		disabled: false,
		icon: '',
		iconPosition: 'start' as 'start' | 'end',
		tag: 'button' as 'button' | 'a' | 'div' | 'span',
		label: 'Click me',
		clicks: 0,
	})

	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="secondary">secondary</option>
						<option value="success">success</option>
						<option value="danger">danger</option>
						<option value="warning">warning</option>
						<option value="contrast">contrast</option>
					</Select>
				</label>
				<label>
					icon
					<Select value={state.icon}>
						<option value="">none</option>
						<option value="check">check</option>
						<option value="trash">trash</option>
						<option value="settings">settings</option>
						<option value="arrow-right">arrow-right</option>
					</Select>
				</label>
				<label>
					iconPosition
					<Select value={state.iconPosition}>
						<option value="start">start</option>
						<option value="end">end</option>
					</Select>
				</label>
				<label>
					tag
					<Select value={state.tag}>
						<option value="button">button</option>
						<option value="a">a</option>
						<option value="div">div</option>
						<option value="span">span</option>
					</Select>
				</label>
			</Inline>
			<Inline gap="md">
				<Switch checked={state.disabled}>disabled</Switch>
			</Inline>
			<hr />
			<div>
				<Button
					variant={state.variant as 'primary'}
					disabled={state.disabled}
					icon={state.icon || undefined}
					iconPosition={state.iconPosition}
					tag={state.tag}
					onClick={() => {
						state.clicks++
					}}
				>
					{state.label}
				</Button>
				<span style="margin-left: 1rem; opacity: 0.6">Clicked: {state.clicks}</span>
			</div>
		</Stack>
	)
}

function ButtonGroupPlayground() {
	const state = reactive({ variant: 'primary' })
	return (
		<Stack gap="md">
			<label>
				variant
				<Select value={state.variant}>
					<option value="primary">primary</option>
					<option value="secondary">secondary</option>
					<option value="success">success</option>
					<option value="danger">danger</option>
				</Select>
			</label>
			<hr />
			<ButtonGroup>
				<Button variant={state.variant as 'primary'}>Left</Button>
				<Button variant={state.variant as 'primary'}>Center</Button>
				<Button variant={state.variant as 'primary'}>Right</Button>
			</ButtonGroup>
		</Stack>
	)
}

export default function ButtonPage() {
	return (
		<article>
			<h1>Button</h1>
			<p>
				Interactive button with variants, icons, loading state, and dot-syntax. Built with{' '}
				<code>asVariant()</code> for automatic variant generation.
			</p>

			<Section title="Playground">
				<p>Toggle props to see the button update live.</p>
				<Demo
					title="Button Playground"
					source={playgroundSource}
					component={<ButtonPlayground />}
				/>
			</Section>

			<Section title="Variant Dot-Syntax">
				<p>
					Every variant defined in the adapter is available as a dot-property.
					<code>{'<Button.primary>'}</code> is shorthand for{' '}
					<code>{'<Button variant="primary">'}</code>.
				</p>
				<Demo
					title="Dot-Syntax"
					source={variantDotSyntax}
					component={
						<Inline gap="sm" wrap>
							<Button.primary>Save</Button.primary>
							<Button.danger>Delete</Button.danger>
							<Button.success>Confirm</Button.success>
							<Button.secondary>Cancel</Button.secondary>
						</Inline>
					}
				/>
			</Section>

			<Section title="Loading State">
				<p>
					Use the <code>use:loading</code> directive to show a spinner overlay. Inject{' '}
					<code>loading</code> into env first.
				</p>
				<Code code={loadingState} lang="tsx" />
			</Section>

			<Section title="ButtonGroup">
				<Demo title="Button Group" source={buttonGroupCode} component={<ButtonGroupPlayground />} />
			</Section>

			<Section title="API Reference">
				<h4>ButtonProps</h4>
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant — any name defined by the adapter. Default: 'primary'",
							required: false,
						},
						{
							name: 'icon',
							type: 'string | JSX.Element',
							description: 'Icon name (resolved by adapter icon factory) or a JSX element',
							required: false,
						},
						{
							name: 'iconPosition',
							type: "'start' | 'end'",
							description: "Icon placement relative to label. Default: 'start'",
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disable the button. Suppresses onClick. Default: false',
							required: false,
						},
						{
							name: 'onClick',
							type: '(e: MouseEvent) => void',
							description: 'Click handler (suppressed when disabled)',
							required: false,
						},
						{
							name: 'ariaLabel',
							type: 'string',
							description: 'Accessible label — required for icon-only buttons',
							required: false,
						},
						{
							name: 'tag',
							type: "'button' | 'a' | 'div' | 'span'",
							description: "HTML element tag. Default: 'button'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.HTMLAttributes',
							description: 'Pass-through HTML attributes forwarded to the root element',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Button label content. Omit for icon-only buttons',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
