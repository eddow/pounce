import { reactive } from 'mutts'
import {
	Button,
	Heading, Text,
	Stack, Inline,
	Card, Progress, Accordion, AccordionGroup,
} from '../../../../ui/src'
import { tooltip } from '../../src'

export default function PicoFeaturesRoute() {
	const themeState = reactive({ current: 'auto' as string })
	const progressState = reactive({ value: 60 })

	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Pico-Specific Features</Heading>
				<Text muted>Features that leverage PicoCSS v2's native capabilities.</Text>
			</header>

			<section>
				<Heading level={3}>Tooltip Directive</Heading>
				<Text muted>Pure-CSS tooltips via Pico's <code>data-tooltip</code> attribute.</Text>
				<Inline wrap gap="sm" style="margin-top: 0.5rem;">
					<Button use:tooltip="Default tooltip (top)">Hover me</Button>
					<Button variant="secondary" use:tooltip={{ text: 'Bottom placement', placement: 'bottom' }}>
						Bottom
					</Button>
					<Button variant="contrast" use:tooltip={{ text: 'Left placement', placement: 'left' }}>
						Left
					</Button>
					<Button variant="success" use:tooltip={{ text: 'Right placement', placement: 'right' }}>
						Right
					</Button>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Card (native &lt;article&gt;)</Heading>
				<Text muted>Pico styles <code>&lt;article&gt;</code> as a card with header/footer.</Text>
				<Inline wrap gap="md" style="margin-top: 0.5rem;">
					<Card el={{ style: 'flex: 1; min-width: 200px;' }}>
						<Card.Header>Simple Card</Card.Header>
						<Card.Body>
							<Text>Card body content styled by PicoCSS natively.</Text>
						</Card.Body>
					</Card>
					<Card el={{ style: 'flex: 1; min-width: 200px;' }}>
						<Card.Header>With Footer</Card.Header>
						<Card.Body>
							<Text>This card has a footer with actions.</Text>
						</Card.Body>
						<Card.Footer>
							<Inline gap="sm">
								<Button>Save</Button>
								<Button variant="secondary">Cancel</Button>
							</Inline>
						</Card.Footer>
					</Card>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Progress (native &lt;progress&gt;)</Heading>
				<Text muted>Pico styles <code>&lt;progress&gt;</code> natively. Drag to change value.</Text>
				<Stack gap="sm" style="margin-top: 0.5rem; max-width: 400px;">
					<Progress value={progressState.value} />
					<input
						type="range"
						min={0}
						max={100}
						value={progressState.value}
						onInput={(e: Event) => {
							progressState.value = Number((e.target as HTMLInputElement).value)
						}}
					/>
					<Text size="sm" muted>Value: {progressState.value}%</Text>
					<Progress />
					<Text size="sm" muted>Indeterminate (no value)</Text>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Accordion (native &lt;details&gt;)</Heading>
				<Text muted>Pico styles <code>&lt;details&gt;</code>/<code>&lt;summary&gt;</code> natively.</Text>
				<Stack gap="md" style="margin-top: 0.5rem;">
					<Accordion summary="Single accordion item" open={true}>
						<Text>This accordion is open by default. Click the summary to toggle.</Text>
					</Accordion>

					<AccordionGroup name="faq">
						<Accordion summary="What is Pounce?">
							<Text>A component-oriented UI framework with fine-grained reactivity.</Text>
						</Accordion>
						<Accordion summary="What is PicoCSS?">
							<Text>A minimal CSS framework that styles semantic HTML natively.</Text>
						</Accordion>
						<Accordion summary="How do they work together?">
							<Text>The adapter maps Pounce's design tokens to Pico's CSS variables.</Text>
						</Accordion>
					</AccordionGroup>
				</Stack>
			</section>

			<section>
				<Heading level={3}>data-theme Scoping</Heading>
				<Text muted>Pico supports per-element theme overrides via <code>data-theme</code>.</Text>
				<Inline wrap gap="sm" style="margin-top: 0.5rem;">
					<Button onClick={() => { themeState.current = 'auto' }}>Auto</Button>
					<Button variant="secondary" onClick={() => { themeState.current = 'light' }}>Light</Button>
					<Button variant="contrast" onClick={() => { themeState.current = 'dark' }}>Dark</Button>
				</Inline>
				<div
					data-theme={themeState.current === 'auto' ? undefined : themeState.current}
					style="margin-top: 0.75rem; padding: 1.5rem; border-radius: var(--pounce-border-radius, 0.5rem); border: 1px solid var(--pounce-border, rgba(0,0,0,0.1));"
				>
					<Heading level={4}>Scoped Theme: {themeState.current}</Heading>
					<Text>This section respects the <code>data-theme</code> attribute.</Text>
					<Inline wrap gap="sm" style="margin-top: 0.5rem;">
						<Button>Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="contrast">Contrast</Button>
					</Inline>
				</div>
			</section>
		</Stack>
	)
}
