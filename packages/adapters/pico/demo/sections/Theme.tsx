import { type ThemeValue } from '@pounce/ui'
import { DisplayProvider } from '@pounce/kit'
import { AppShell, Button, ThemeToggle } from '@pounce/adapter-pico'
import { reactive } from 'mutts'
import { DemoSection, DemoState } from './shared'

export default function ThemeSection() {
	const settings = reactive({ theme: 'auto' as ThemeValue })
	const state = reactive({ direction: 'ltr' as 'ltr' | 'rtl', locale: 'en-US' })

	return (
		<DisplayProvider theme={settings.theme} direction={state.direction} locale={state.locale}>
			<DemoSection
				title="Theme + AppShell"
				description="ThemeToggle, display context and AppShell grouped around app-level chrome."
			>
				<AppShell
					header={
						<div class="container" style="display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; padding-block: 1rem;">
							<strong>Pico shell</strong>
							<ThemeToggle settings={settings} />
						</div>
					}
				>
					<div class="container" style="display: grid; gap: 1rem; padding-block: 1rem;">
						<div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
							<Button onClick={() => (state.direction = 'ltr')}>LTR</Button>
							<Button onClick={() => (state.direction = 'rtl')}>RTL</Button>
							<Button outline onClick={() => (state.locale = 'en-US')}>en-US</Button>
							<Button outline onClick={() => (state.locale = 'fr-FR')}>fr-FR</Button>
						</div>
						<DemoState label="Theme setting" value={settings.theme} />
						<DemoState label="Direction" value={state.direction} />
						<DemoState label="Locale" value={state.locale} />
					</div>
				</AppShell>
			</DemoSection>
		</DisplayProvider>
	)
}
