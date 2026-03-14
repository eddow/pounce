import { Combobox, Multiselect, Select } from '@sursaut/adapter-pico'
import { reactive } from 'mutts'
import { DemoCard, DemoGrid, DemoSection, DemoState } from './shared'

export function SelectFixture() {
	return (
		<Select
			options={['alpha', 'beta']}
			disabled
			el={{ disabled: false, 'data-testid': 'select' }}
		/>
	)
}

export function ComboboxFixture() {
	return (
		<Combobox options={['alpha', 'beta']} el={{ list: 'manual-list', 'data-testid': 'combobox' }} />
	)
}

export default function OptionsSection() {
	const state = reactive({
		selectValue: 'beta',
		comboValue: 'alpha',
		items: new Set(['TypeScript', 'Sursaut']),
	})

	return (
		<DemoSection
			title="Options"
			description="Select, combobox and multiselect grouped around generated list wiring and reactive selection state."
		>
			<DemoGrid>
				<DemoCard title="Select" footer={<DemoState label="Value" value={state.selectValue} />}>
					<Select
						options={['alpha', 'beta', 'gamma']}
						value={state.selectValue}
						onInput={(value: string) => {
							state.selectValue = value
						}}
					/>
				</DemoCard>
				<DemoCard title="Combobox" footer={<DemoState label="Typed" value={state.comboValue} />}>
					<Combobox
						options={['alpha', 'beta', 'gamma']}
						value={state.comboValue}
						onInput={(e: Event) => {
							if (e.target instanceof HTMLInputElement) state.comboValue = e.target.value
						}}
					/>
				</DemoCard>
				<DemoCard
					title="Multiselect"
					footer={<DemoState label="Chosen" value={Array.from(state.items).join(', ')} />}
				>
					<Multiselect
						label="Tech stack"
						items={['TypeScript', 'Sursaut', 'PicoCSS', 'Vitest']}
						value={state.items}
						onChange={(value: Set<string>) => {
							state.items = value
						}}
						closeOnSelect={false}
					/>
				</DemoCard>
			</DemoGrid>
		</DemoSection>
	)
}
