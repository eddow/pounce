import { reactive } from 'mutts'
import {
	Button,
	Heading, Text,
	Stack, Inline,
	Select, Combobox, Checkbox, Radio, Switch,
	Stars,
} from '../../src'

export default function FormsRoute() {
	const checkState = reactive({
		notifications: true,
		summaries: false,
		alerts: false,
	})

	const radioState = reactive({
		value: 'a',
	})

	const switchState = reactive({
		maintenance: false,
		darkMode: true,
	})

	const starsState = reactive({
		rating: 3,
		large: 4,
	})

	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Forms</Heading>
				<Text muted>Controls and inputs with variant accent colors.</Text>
			</header>

			<section>
				<Heading level={3}>Select & Combobox</Heading>
				<Inline wrap gap="sm">
					<Select aria-label="Primary select">
						<option>Alpha</option>
						<option>Bravo</option>
						<option>Charlie</option>
					</Select>
					<Select variant="secondary" aria-label="Secondary select">
						<option>Secondary</option>
						<option>Option</option>
					</Select>
					<Combobox placeholder="Type to search..." options={['Apple', 'Banana', 'Cherry', 'Date']} />
					<Combobox variant="success" placeholder="Status" options={['Ready', 'Running', 'Complete']} />
				</Inline>
			</section>

			<section>
				<Heading level={3}>Checkboxes</Heading>
				<Inline wrap gap="md">
					<Stack gap="xs">
						<Checkbox checked={checkState.notifications}>Notifications</Checkbox>
						<Text size="sm" muted>Value: {String(checkState.notifications)}</Text>
					</Stack>
					<Stack gap="xs">
						<Checkbox variant="success" description="Weekly digest" checked={checkState.summaries}>
							Summaries
						</Checkbox>
						<Text size="sm" muted>Value: {String(checkState.summaries)}</Text>
					</Stack>
					<Stack gap="xs">
						<Checkbox variant="warning" description="Requires attention" checked={checkState.alerts}>
							Alerts
						</Checkbox>
						<Text size="sm" muted>Value: {String(checkState.alerts)}</Text>
					</Stack>
					<Checkbox variant="danger" disabled>Disabled</Checkbox>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Radio Buttons</Heading>
				<Stack gap="md">
					<Inline wrap gap="md">
						<Radio name="demo-radio" value="a" checked={radioState.value === 'a'} onClick={() => { radioState.value = 'a' }}>
							Option A
						</Radio>
						<Radio name="demo-radio" value="b" checked={radioState.value === 'b'} onClick={() => { radioState.value = 'b' }}>
							Option B
						</Radio>
						<Radio name="demo-radio" value="c" variant="success" checked={radioState.value === 'c'} onClick={() => { radioState.value = 'c' }}>
							Option C
						</Radio>
					</Inline>
					<Text size="sm" muted>Selected: {radioState.value}</Text>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Switches</Heading>
				<Inline wrap gap="md">
					<Switch checked={switchState.maintenance}>Maintenance</Switch>
					<Switch variant="secondary" checked={switchState.darkMode}>Dark mode</Switch>
					<Switch variant="success" checked description="Active" labelPosition="start">
						Feature flag
					</Switch>
					<Switch variant="danger" disabled description="Cannot change">Locked</Switch>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Stars Rating</Heading>
				<Inline wrap gap="lg">
					<Stack gap="xs">
						<Text muted>Interactive</Text>
						<Stars value={starsState.rating} />
						<Text size="sm" muted>Value: {starsState.rating}</Text>
					</Stack>
					<Stack gap="xs">
						<Text muted>Read-only (4/5)</Text>
						<Stars value={4} readonly />
					</Stack>
					<Stack gap="xs">
						<Text muted>Large (max 5)</Text>
						<Stars value={starsState.large} maximum={5} size="2rem" />
						<Text size="sm" muted>Value: {starsState.large}</Text>
					</Stack>
				</Inline>
			</section>
		</Stack>
	)
}
