import type { Scope } from '@pounce/core'
import { reactive } from 'mutts'
import {
	Button,
	Heading, Text,
	Stack, Inline,
	ThemeToggle,
} from '../../src'
import { Env, type EnvSettings } from '@pounce/kit/env'

const envSettings = reactive<EnvSettings>({ theme: 'auto' })

function ContextInspector(_props: {}, scope: Scope) {
	return (
		<div style="padding: 1rem; border: 1px solid var(--pounce-border, #d1d5db); border-radius: var(--pounce-border-radius, 0.5rem); background: var(--pounce-bg-muted, rgba(0,0,0,0.04));">
			<Text size="sm" muted>
				<strong>theme:</strong> {scope.theme} &nbsp;
				<strong>setting:</strong> {envSettings.theme ?? 'auto'} &nbsp;
				<strong>dir:</strong> {scope.direction} &nbsp;
				<strong>locale:</strong> {scope.locale}
			</Text>
		</div>
	)
}

export default function ThemeRoute() {
	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Display &amp; Theming</Heading>
				<Text muted>Env, ThemeToggle, nested contexts, and RTL.</Text>
			</header>

			<section>
				<Heading level={3}>ThemeToggle</Heading>
				<Text size="sm" muted>Split-button: main toggles dark↔light, dropdown adds auto.</Text>
				<Inline gap="md" wrap>
					<ThemeToggle settings={envSettings} />
					<ThemeToggle settings={envSettings} simple />
				</Inline>
				<ContextInspector />
			</section>

			<section>
				<Heading level={3}>Nested Env — Dark Override</Heading>
				<Text size="sm" muted>Inner region forced to dark, regardless of outer theme.</Text>
				<Env settings={{ theme: 'dark' }}>
					<div style="padding: 1rem; border-radius: var(--pounce-border-radius, 0.5rem); background: var(--pounce-bg, #1a1a2e); color: var(--pounce-fg, #eee);">
						<Stack gap="sm">
							<Text>This region is always dark.</Text>
							<Inline gap="sm">
								<Button>Dark Button</Button>
								<Button variant="secondary">Secondary</Button>
							</Inline>
							<ContextInspector />
						</Stack>
					</div>
				</Env>
			</section>

			<section>
				<Heading level={3}>Nested Env — RTL Override</Heading>
				<Text size="sm" muted>Inner region forced to RTL direction.</Text>
				<Env settings={{ direction: 'rtl', locale: 'ar-SA' }}>
					<div style="padding: 1rem; border: 1px dashed var(--pounce-border, #d1d5db); border-radius: var(--pounce-border-radius, 0.5rem);">
						<Stack gap="sm">
							<Text>هذا القسم بالعربية (RTL region)</Text>
							<Inline gap="sm">
								<Button>زر</Button>
								<Button variant="success">نجاح</Button>
							</Inline>
							<ContextInspector />
						</Stack>
					</div>
				</Env>
			</section>

			<section>
				<Heading level={3}>Nested Env — Locale Override</Heading>
				<Text size="sm" muted>Inner region with French locale.</Text>
				<Env settings={{ locale: 'fr-FR' }}>
					<div style="padding: 1rem; border: 1px solid var(--pounce-border, #d1d5db); border-radius: var(--pounce-border-radius, 0.5rem);">
						<Stack gap="sm">
							<Text>Cette section utilise le locale français.</Text>
							<ContextInspector />
						</Stack>
					</div>
				</Env>
			</section>
		</Stack>
	)
}
