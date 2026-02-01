import { reactive } from 'mutts'
import {
	tablerFilledHeart,
	tablerOutlineChevronDown,
	tablerOutlineCircleMinus,
	tablerOutlineCircleX,
	tablerOutlineHeart,
} from 'pure-glyf/icons'
import { Button } from '../components/button'
import { Checkbox, Combobox, Radio, Select, Switch } from '../components/forms'
import { Container, Inline, Stack } from '../components/layout'
import { Multiselect } from '../components/multiselect'
import { Stars } from '../components/stars'
import { Heading, Text } from '../components/typography'

type Fruit = { id: number; name: string; color: string }

const fruits: Fruit[] = [
	{ id: 1, name: 'Apple', color: '#dc2626' },
	{ id: 2, name: 'Banana', color: '#fbbf24' },
	{ id: 3, name: 'Cherry', color: '#dc2626' },
	{ id: 4, name: 'Dragon Fruit', color: '#ec4899' },
	{ id: 5, name: 'Elderberry', color: '#a855f7' },
	{ id: 6, name: 'Fig', color: '#92400e' },
	{ id: 7, name: 'Grape', color: '#7c3aed' },
	{ id: 8, name: 'Honeydew', color: '#22c55e' },
]

export default function FormsRoute() {
	const state = reactive({
		selectedFruits: new Set<Fruit>(),
		hideSelected: false,
		closeOnSelect: false,
		starsValue: 2,
		starsLargeValue: 7,
		starsRangeValue: [2, 4] as const,
		starsZeroValue: 0,
		starsZeroRangeValue: [0, 3] as const,
	})

	const checkboxState = reactive({
		notifications: true,
		summaries: false,
		alerts: false,
		disabled: false,
	})

	const radioState = reactive({
		value: 'a',
		get inline() {
			return this.value
		},
		set inline(v: string) {
			this.value = v
		},
		get stacked() {
			return this.value
		},
		set stacked(v: string) {
			this.value = v
		},
		get inlineA() {
			return this.value === 'a'
		},
		set inlineA(v: boolean) {
			if (v) this.value = 'a'
		},
		get inlineB() {
			return this.value === 'b'
		},
		set inlineB(v: boolean) {
			if (v) this.value = 'b'
		},
		get inlineC() {
			return this.value === 'c'
		},
		set inlineC(v: boolean) {
			if (v) this.value = 'c'
		},
		get stackedA() {
			return this.value === 'a'
		},
		set stackedA(v: boolean) {
			if (v) this.value = 'a'
		},
		get stackedB() {
			return this.value === 'b'
		},
		set stackedB(v: boolean) {
			if (v) this.value = 'b'
		},
		get stackedC() {
			return this.value === 'c'
		},
		set stackedC(v: boolean) {
			if (v) this.value = 'c'
		},
	})

	return (
		<Container tag="section">
			<Stack gap="lg">
				<header>
					<Heading level={1}>Forms</Heading>
					<Text muted>Controls and inputs styled with @pounce/pico.</Text>
				</header>

				<section>
					<Heading level={3}>Selects and Combobox</Heading>
					<Stack>
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
							<Select variant="contrast" fullWidth aria-label="Full width select">
								<option>Full width</option>
								<option>Option</option>
							</Select>
						</Inline>
						<Inline wrap gap="sm">
							<Combobox placeholder="Combobox" options={['One', 'Two', 'Three']} />
							<Combobox
								variant="success"
								placeholder="With status tone"
								options={[
									{ value: 'ready', label: 'Ready' },
									{ value: 'running', label: 'Running' },
									{ value: 'complete', label: 'Complete' },
								]}
							/>
						</Inline>
					</Stack>
				</section>

				<section>
					<Heading level={3}>Checkboxes</Heading>
					<Inline wrap gap="md">
						<Stack gap="xs">
							<Checkbox checked={checkboxState.notifications}>Notifications</Checkbox>
							<Text size="sm" muted>
								Value: {String(checkboxState.notifications)}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Checkbox
								variant="success"
								description="Send weekly summaries"
								checked={checkboxState.summaries}
							>
								Summaries
							</Checkbox>
							<Text size="sm" muted>
								Value: {String(checkboxState.summaries)}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Checkbox
								variant="warning"
								description="Requires attention"
								checked={checkboxState.alerts}
							>
								Alerts
							</Checkbox>
							<Text size="sm" muted>
								Value: {String(checkboxState.alerts)}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Checkbox variant="danger" disabled checked={checkboxState.disabled}>
								Disabled
							</Checkbox>
							<Text size="sm" muted>
								Value: {String(checkboxState.disabled)}
							</Text>
						</Stack>
					</Inline>
				</section>

				<section>
					<Heading level={3}>Radio buttons</Heading>
					<Stack gap="md">
						<Stack gap="sm">
							<Text muted>Inline layout</Text>
							<Inline wrap gap="md">
								<Radio name="radio-sample-inline" value="a" checked={radioState.inlineA}>
									Option A
								</Radio>
								<Radio name="radio-sample-inline" value="b" checked={radioState.inlineB}>
									Option B
								</Radio>
								<Radio
									name="radio-sample-inline"
									value="c"
									variant="success"
									checked={radioState.inlineC}
								>
									Option C
								</Radio>
							</Inline>
							<Text size="sm" muted>
								Value: {radioState.inline}
							</Text>
						</Stack>
						<Stack gap="sm">
							<Text muted>Stacked layout</Text>
							<Stack gap="sm" align="start">
								<Radio name="radio-sample-stacked" value="a" checked={radioState.stackedA}>
									Option A
								</Radio>
								<Radio name="radio-sample-stacked" value="b" checked={radioState.stackedB}>
									Option B
								</Radio>
								<Radio
									name="radio-sample-stacked"
									value="c"
									variant="success"
									checked={radioState.stackedC}
								>
									Option C
								</Radio>
							</Stack>
							<Text size="sm" muted>
								Value: {radioState.stacked}
							</Text>
						</Stack>
					</Stack>
				</section>

				<section>
					<Heading level={3}>Switches</Heading>
					<Inline wrap gap="md">
						<Switch>Default switch</Switch>
						<Switch variant="secondary" checked>
							Secondary
						</Switch>
						<Switch
							variant="success"
							checked
							description="Label on the leading side"
							labelPosition="start"
						>
							Maintenance
						</Switch>
						<Switch variant="danger" description="Disabled state" disabled>
							Disabled
						</Switch>
					</Inline>
				</section>

				<section>
					<Heading level={3}>Multiselect</Heading>
					<Text muted>
						A dropdown component for selecting multiple items with a customizable trigger and item
						renderer.
					</Text>
					<Stack gap="md">
						<div>
							<Multiselect
								items={fruits}
								value={state.selectedFruits}
								closeOnSelect={state.closeOnSelect}
								renderItem={(fruit, checked) => {
									return (
										<span style={{ color: fruit.color, fontWeight: checked ? 'bold' : 'normal' }}>
											{checked ? '✓ ' : ''}
											{fruit.name}
										</span>
									)
								}}
							>
								<Button icon={tablerOutlineChevronDown} tag="span">
									Select Fruits ({state.selectedFruits.size})
								</Button>
							</Multiselect>
						</div>

						<Inline gap="md">
							<Checkbox checked={state.closeOnSelect} label="Close on select" />
						</Inline>

						<div>
							<strong>Selected:</strong>{' '}
							{state.selectedFruits.size > 0
								? Array.from(state.selectedFruits)
										.map((f) => f.name)
										.join(', ')
								: 'None'}
						</div>

						<Button
							variant="secondary"
							onClick={() => state.selectedFruits.clear()}
							el={{ disabled: state.selectedFruits.size === 0 }}
						>
							Clear Selection
						</Button>
					</Stack>
				</section>

				<section>
					<Heading level={3}>Stars Rating</Heading>
					<Inline wrap gap="md">
						<Stack gap="xs">
							<Text muted>Interactive</Text>
							<Stars value={state.starsValue} />
							<Text size="sm" muted>
								Value: {state.starsValue}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Text muted>Read-only (3/5)</Text>
							<Stars value={3} readonly />
						</Stack>
						<Stack gap="xs">
							<Text muted>Custom Size & Max</Text>
							<Stars
								value={state.starsLargeValue}
								maximum={5}
								size="2rem"
								before={tablerFilledHeart}
								after={tablerOutlineHeart}
							/>
							<Text size="sm" muted>
								Value: {state.starsLargeValue} / 5 (Custom Icons)
							</Text>
						</Stack>
						<Stack gap="xs">
							<Text muted>Range</Text>
							<Stars
								value={state.starsRangeValue}
								maximum={5}
								onChange={(v) => (state.starsRangeValue = v)}
							/>
							<Text size="sm" muted>
								Value: {state.starsRangeValue.join('-')}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Text muted>Range with Before Icon</Text>
							<Stars
								value={state.starsRangeValue}
								maximum={5}
								before={tablerOutlineCircleMinus}
								onChange={(v) => (state.starsRangeValue = v)}
							/>
							<Text size="sm" muted>
								Value: {state.starsRangeValue.join('-')}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Text muted>With Zero Element (Single)</Text>
							<Stars
								value={state.starsZeroValue}
								maximum={5}
								zeroElement={tablerOutlineCircleX}
								onChange={(v) => (state.starsZeroValue = v)}
							/>
							<Text size="sm" muted>
								Value: {state.starsZeroValue}
							</Text>
						</Stack>
						<Stack gap="xs">
							<Text muted>With Zero Element (Range)</Text>
							<Stars
								value={state.starsZeroRangeValue}
								maximum={5}
								zeroElement={tablerOutlineCircleX}
								onChange={(v) => (state.starsZeroRangeValue = v)}
							/>
							<Text size="sm" muted>
								Value:{' '}
								{Array.isArray(state.starsZeroRangeValue)
									? state.starsZeroRangeValue.join('-')
									: state.starsZeroRangeValue}
							</Text>
						</Stack>
					</Inline>
				</section>
			</Stack>
		</Container>
	)
}
