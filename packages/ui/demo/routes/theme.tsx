import type { Scope } from '@pounce/core'
import { reactive } from 'mutts'
import {
	Button,
	DisplayProvider,
	Heading, Text,
	Stack, Inline,
	ThemeToggle,
} from '../../src'
import { useDisplayContext } from '../../src/display/display-context'

function ContextInspector(_props: {}, scope: Scope) {
	const display = useDisplayContext(scope)
	return (
		<div style="padding: 1rem; border: 1px solid var(--pounce-border, #d1d5db); border-radius: var(--pounce-border-radius, 0.5rem); background: var(--pounce-bg-muted, rgba(0,0,0,0.04));">
			<Text size="sm" muted>
				<strong>theme:</strong> {display.theme} &nbsp;
				<strong>setting:</strong> {display.themeSetting} &nbsp;
				<strong>dir:</strong> {display.direction} &nbsp;
				<strong>locale:</strong> {display.locale}
			</Text>
		</div>
	)
}

export default function ThemeRoute() {
	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Display &amp; Theming</Heading>
				<Text muted>DisplayProvider, ThemeToggle, nested contexts, and RTL.</Text>
			</header>

			<section>
				<Heading level={3}>ThemeToggle</Heading>
				<Text size="sm" muted>Split-button: main toggles dark↔light, dropdown adds auto.</Text>
				<Inline gap="md" wrap>
					<ThemeToggle />
					<ThemeToggle simple />
				</Inline>
				<ContextInspector />
			</section>

			<section>
				<Heading level={3}>Nested Provider — Dark Override</Heading>
				<Text size="sm" muted>Inner region forced to dark, regardless of outer theme.</Text>
				<DisplayProvider theme="dark">
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
				</DisplayProvider>
			</section>

			<section>
				<Heading level={3}>Nested Provider — RTL Override</Heading>
				<Text size="sm" muted>Inner region forced to RTL direction.</Text>
				<DisplayProvider direction="rtl" locale="ar-SA">
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
				</DisplayProvider>
			</section>

			<section>
				<Heading level={3}>Nested Provider — Locale Override</Heading>
				<Text size="sm" muted>Inner region with French locale.</Text>
				<DisplayProvider locale="fr-FR">
					<div style="padding: 1rem; border: 1px solid var(--pounce-border, #d1d5db); border-radius: var(--pounce-border-radius, 0.5rem);">
						<Stack gap="sm">
							<Text>Cette section utilise le locale français.</Text>
							<ContextInspector />
						</Stack>
					</div>
				</DisplayProvider>
			</section>
		</Stack>
	)
}
