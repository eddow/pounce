import { Checkbox, Progress, Radio, Switch } from '@sursaut/adapter-pico'
import { reactive } from 'mutts'
import { DemoCard, DemoGrid, DemoSection, DemoState } from './shared'

export function CheckboxFixture() {
	return (
		<Checkbox checked disabled el={{ checked: false, disabled: false, 'data-testid': 'checkbox' }}>
			Agree
		</Checkbox>
	)
}

export function SwitchFixture() {
	return (
		<Switch checked el={{ role: 'checkbox', 'aria-checked': false, 'data-testid': 'switch' }}>
			Enabled
		</Switch>
	)
}

export function RadioFixture() {
	return (
		<Radio
			name="color"
			value="red"
			group="red"
			disabled
			el={{ checked: false, disabled: false, name: 'other', 'data-testid': 'radio' }}
		>
			Red
		</Radio>
	)
}

export function ProgressFixture() {
	return (
		<Progress
			value={40}
			max={100}
			el={{ value: 0, max: 1, role: 'presentation', 'data-testid': 'progress' }}
		/>
	)
}

export default function FormControlsSection() {
	const state = reactive({
		checked: true,
		switchOn: true,
		radio: 'red',
		progress: 40,
	})

	return (
		<DemoSection
			title="Form controls"
			description="Checkbox, radio, switch and progress grouped around model-owned input semantics."
		>
			<DemoGrid>
				<DemoCard
					title="Checkbox + Switch"
					footer={<DemoState label="States" value={`${state.checked} / ${state.switchOn}`} />}
				>
					<Checkbox checked={state.checked} onChange={(next: boolean) => (state.checked = next)}>
						Receive updates
					</Checkbox>
					<Switch checked={state.switchOn} onChange={(next: boolean) => (state.switchOn = next)}>
						Dark mode
					</Switch>
				</DemoCard>
				<DemoCard title="Radio group" footer={<DemoState label="Selected" value={state.radio} />}>
					<Radio
						name="demo-color"
						value="red"
						group={state.radio}
						onChange={() => (state.radio = 'red')}
					>
						Red
					</Radio>
					<Radio
						name="demo-color"
						value="blue"
						group={state.radio}
						onChange={() => (state.radio = 'blue')}
					>
						Blue
					</Radio>
				</DemoCard>
				<DemoCard
					title="Progress"
					footer={<DemoState label="Value" value={`${state.progress}%`} />}
				>
					<Progress value={state.progress} max={100} el={{ style: 'width:100%' }} />
					<input
						type="range"
						min={0}
						max={100}
						value={state.progress}
						onInput={(e: Event) => {
							if (e.target instanceof HTMLInputElement) state.progress = Number(e.target.value)
						}}
					/>
				</DemoCard>
			</DemoGrid>
		</DemoSection>
	)
}
