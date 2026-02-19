import { Badge, Chip, Inline, Pill, Select, Stack, Switch } from '@pounce/ui'
import { reactive } from 'mutts'
import { ApiTable, Demo, Section } from '../../components'

const badgeSource = `<Badge>Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="danger" icon="alert">Error</Badge>`

const pillSource = `<Pill icon="user">John Doe</Pill>
<Pill variant="success" icon="check">Verified</Pill>`

const chipSource = `<Chip dismissible onDismiss={() => remove(tag)}>
  Tag
</Chip>`

function BadgeDemo() {
	const state = reactive({ variant: 'primary', icon: '' })
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
					</Select>
				</label>
				<label>
					icon
					<Select value={state.icon}>
						<option value="">none</option>
						<option value="check">check</option>
						<option value="alert">alert</option>
						<option value="info">info</option>
					</Select>
				</label>
			</Inline>
			<hr />
			<Inline gap="sm">
				<Badge variant={state.variant} icon={state.icon || undefined}>
					Status
				</Badge>
				<Badge variant={state.variant} icon={state.icon || undefined}>
					New
				</Badge>
				<Badge variant={state.variant} icon={state.icon || undefined}>
					v1.0
				</Badge>
			</Inline>
		</Stack>
	)
}

function PillDemo() {
	const state = reactive({ variant: 'primary', icon: 'user' })
	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="secondary">secondary</option>
						<option value="success">success</option>
						<option value="warning">warning</option>
					</Select>
				</label>
				<label>
					icon
					<Select value={state.icon}>
						<option value="">none</option>
						<option value="user">user</option>
						<option value="check">check</option>
						<option value="star-filled">star-filled</option>
					</Select>
				</label>
			</Inline>
			<hr />
			<Inline gap="sm">
				<Pill variant={state.variant} icon={state.icon || undefined}>
					John Doe
				</Pill>
				<Pill variant={state.variant} icon={state.icon || undefined}>
					Jane Smith
				</Pill>
			</Inline>
		</Stack>
	)
}

function ChipDemo() {
	const state = reactive({
		variant: 'secondary',
		dismissible: true,
		tags: reactive(['TypeScript', 'Pounce', 'Mutts', 'PicoCSS']),
	})

	function remove(tag: string) {
		const i = state.tags.indexOf(tag)
		if (i >= 0) state.tags.splice(i, 1)
	}

	function reset() {
		state.tags.splice(0, state.tags.length, 'TypeScript', 'Pounce', 'Mutts', 'PicoCSS')
	}

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
					</Select>
				</label>
				<Switch checked={state.dismissible}>dismissible</Switch>
			</Inline>
			<hr />
			<Inline gap="sm" wrap>
				<for each={state.tags}>
					{(tag: string) => (
						<Chip
							variant={state.variant}
							dismissible={state.dismissible}
							onDismiss={() => remove(tag)}
						>
							{tag}
						</Chip>
					)}
				</for>
			</Inline>
			<button onClick={reset} style="align-self: flex-start; font-size: 0.85rem">
				Reset tags
			</button>
		</Stack>
	)
}

export default function StatusPage() {
	return (
		<article>
			<h1>Status</h1>
			<p>
				Badge, Pill, and Chip — status indicators and interactive tokens. All support variant
				dot-syntax.
			</p>

			<Section title="Badge">
				<p>Small uppercase status label.</p>
				<Demo title="Badge" source={badgeSource} component={<BadgeDemo />} />
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'icon',
							type: 'string | JSX.Element',
							description: 'Leading icon name or element',
							required: false,
						},
						{
							name: 'tag',
							type: 'JSX.HTMLElementTag',
							description: "HTML element tag. Default: 'span'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Badge label content',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Pill">
				<p>Medium status indicator with optional leading and trailing icons.</p>
				<Demo title="Pill" source={pillSource} component={<PillDemo />} />
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'icon',
							type: 'string | JSX.Element',
							description: 'Leading icon name or element',
							required: false,
						},
						{
							name: 'trailingIcon',
							type: 'string | JSX.Element',
							description: 'Trailing icon name or element',
							required: false,
						},
						{
							name: 'tag',
							type: 'JSX.HTMLElementTag',
							description: "HTML element tag. Default: 'span'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Pill label content',
							required: false,
						},
					]}
				/>
			</Section>

			<Section title="Chip">
				<p>Interactive token — clickable, optionally dismissible with a × button.</p>
				<Demo title="Chip" source={chipSource} component={<ChipDemo />} />
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'secondary'",
							required: false,
						},
						{
							name: 'icon',
							type: 'string | JSX.Element',
							description: 'Leading icon name or element',
							required: false,
						},
						{
							name: 'dismissible',
							type: 'boolean',
							description: 'Show a dismiss (×) button. Default: false',
							required: false,
						},
						{
							name: 'dismissLabel',
							type: 'string',
							description: "Accessible label for the dismiss button. Default: 'Remove'",
							required: false,
						},
						{
							name: 'onDismiss',
							type: '() => void',
							description: 'Called when the chip is dismissed',
							required: false,
						},
						{
							name: 'tag',
							type: 'JSX.HTMLElementTag',
							description: "HTML element tag. Default: 'button'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Chip label content',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
