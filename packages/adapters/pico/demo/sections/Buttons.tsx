import { Button, ButtonGroup, CheckButton, RadioButton } from '@pounce/adapter-pico'
import { reactive } from 'mutts'
import { DemoCard, DemoGrid, DemoSection, DemoState } from './shared'

export default function ButtonsSection() {
	const state = reactive({
		clicks: 0,
		wifi: true,
		mode: 'alpha',
	})

	return (
		<DemoSection
			title="Buttons"
			description="Button-like components, variants, toggles and keyboard navigation wrappers."
		>
			<DemoGrid>
				<DemoCard title="Buttons" footer={<DemoState label="Clicks" value={state.clicks} />}>
					<Button variant="primary" onClick={() => state.clicks++}>Primary</Button>
					<Button variant="danger" outline onClick={() => state.clicks++}>Danger outline</Button>
				</DemoCard>
				<DemoCard title="CheckButton" footer={<DemoState label="Wi-Fi" value={state.wifi ? 'on' : 'off'} />}>
					<CheckButton
						checked={state.wifi}
						onCheckedChange={(next: boolean) => {
							state.wifi = next
						}}
					>
						Wi-Fi
					</CheckButton>
				</DemoCard>
				<DemoCard title="RadioButton + ButtonGroup" footer={<DemoState label="Mode" value={state.mode} />}>
					<ButtonGroup>
						<RadioButton value="alpha" group={state.mode} onClick={() => (state.mode = 'alpha')}>
							Alpha
						</RadioButton>
						<RadioButton value="beta" group={state.mode} onClick={() => (state.mode = 'beta')}>
							Beta
						</RadioButton>
						<RadioButton value="gamma" group={state.mode} onClick={() => (state.mode = 'gamma')}>
							Gamma
						</RadioButton>
					</ButtonGroup>
				</DemoCard>
			</DemoGrid>
		</DemoSection>
	)
}
