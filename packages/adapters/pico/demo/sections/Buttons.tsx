import {
	Button,
	ButtonGroup,
	CheckButton,
	RadioButton,
	SplitButton,
	SplitRadioButton,
} from '@sursaut/adapter-pico'
import { reactive } from 'mutts'
import { DemoCard, DemoGrid, DemoSection, DemoState } from './shared'

export default function ButtonsSection() {
	const state = reactive({
		clicks: 0,
		wifi: true,
		mode: 'alpha' as 'alpha' | 'beta' | 'gamma',
		action: 'save' as 'save' | 'saveAs' | 'share',
		theme: 'light' as 'light' | 'dark',
		selectedTheme: 'light' as 'light' | 'dark',
	})

	return (
		<DemoSection
			title="Buttons"
			description="Button-like components, variants, toggles and keyboard navigation wrappers."
		>
			<DemoGrid>
				<DemoCard title="Buttons" footer={<DemoState label="Clicks" value={state.clicks} />}>
					<Button variant="primary" onClick={() => state.clicks++}>
						Primary
					</Button>
					<Button variant="danger" outline onClick={() => state.clicks++}>
						Danger outline
					</Button>
				</DemoCard>
				<DemoCard
					title="CheckButton"
					footer={<DemoState label="Wi-Fi" value={state.wifi ? 'on' : 'off'} />}
				>
					<CheckButton
						checked={state.wifi}
						onCheckedChange={(next: boolean) => {
							state.wifi = next
						}}
					>
						Wi-Fi
					</CheckButton>
				</DemoCard>
				<DemoCard
					title="RadioButton + ButtonGroup"
					footer={<DemoState label="Mode" value={state.mode} />}
				>
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
				<DemoCard
					title="SplitButton"
					footer={
						<>
							<DemoState label="Selected" value={state.action} />
							<DemoState label="Mode" value={state.mode} />
						</>
					}
				>
					<SplitButton
						variant="primary"
						value={state.action}
						items={[
							{ value: 'save' as const, label: 'Save', onClick: () => (state.mode = 'alpha') },
							{ value: 'saveAs' as const, label: 'Save as…', onClick: () => (state.mode = 'beta') },
							{ value: 'share' as const, label: 'Share', onClick: () => (state.mode = 'gamma') },
						]}
						onValueChange={(value: 'save' | 'saveAs' | 'share') => {
							state.action = value
						}}
					>
						Run action
					</SplitButton>
				</DemoCard>
				<DemoCard
					title="SplitRadioButton"
					footer={
						<>
							<DemoState label="Selected" value={state.selectedTheme} />
							<DemoState label="Group" value={state.theme} />
						</>
					}
				>
					<SplitRadioButton
						value={state.selectedTheme}
						group={state.theme}
						items={[
							{ value: 'light' as const, label: 'Light' },
							{ value: 'dark' as const, label: 'Dark' },
						]}
						onValueChange={(value: 'light' | 'dark') => {
							state.selectedTheme = value
						}}
						onClick={(value: 'light' | 'dark' | undefined) => {
							if (value) state.theme = value
						}}
					>
						Theme
					</SplitRadioButton>
					<ButtonGroup>
						<RadioButton value="light" group={state.theme} onClick={() => (state.theme = 'light')}>
							Light
						</RadioButton>
						<RadioButton value="dark" group={state.theme} onClick={() => (state.theme = 'dark')}>
							Dark
						</RadioButton>
					</ButtonGroup>
				</DemoCard>
			</DemoGrid>
		</DemoSection>
	)
}
