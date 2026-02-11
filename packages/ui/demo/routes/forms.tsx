import type { Scope } from '@pounce/core'
import { reactive } from 'mutts'
import {
	Button,
	Heading, Text,
	Stack, Inline,
	Select, Combobox, Checkbox, Radio, Switch,
	Stars,
	loading,
} from '../../src'

function LoadingDemo(_props: {}, scope: Scope) {
	scope.loading = loading
	const state = reactive({ saving: false })
	function simulateSave() {
		state.saving = true
		setTimeout(() => { state.saving = false }, 2000)
	}
	return (
		<Stack gap="sm">
			<Inline wrap gap="md">
				<Button use:loading={state.saving} onClick={simulateSave}>
					Save (2s)
				</Button>
				<Button.secondary use:loading={state.saving}>
					Also busy
				</Button.secondary>
				<div use:loading={state.saving} style="padding: 1rem; border: 1px solid var(--pounce-muted-border, #ccc); border-radius: 0.5rem;">
					Any element can be loading
				</div>
			</Inline>
			<Text size="sm" muted>Status: {state.saving ? 'Saving...' : 'Idle'}</Text>
		</Stack>
	)
}

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
		feature: true,
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
				<Heading level={3}>Loading State</Heading>
				<Text muted>The <code>use:loading</code> directive works on any element — buttons, divs, inputs.</Text>
				<LoadingDemo />
			</section>

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
						<Radio.success name="demo-radio" value="a" group={radioState.value}>
							Option A
						</Radio.success>
						<Radio name="demo-radio" value="b" group={radioState.value}>
							Option B
						</Radio>
						<Radio.warning name="demo-radio" value="c" group={radioState.value}>
							Option C
						</Radio.warning>
					</Inline>
					<Text size="sm" muted>Selected: {radioState.value}</Text>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Switches</Heading>
				<Inline wrap gap="md">
					<Switch checked={switchState.maintenance}>Maintenance</Switch>
					<Switch variant="secondary" checked={switchState.darkMode}>Dark mode</Switch>
					<Switch variant="success" checked={switchState.feature} description="Active" labelPosition="start">
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
