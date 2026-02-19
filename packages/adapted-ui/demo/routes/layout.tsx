import {
	Button,
	Heading, Text,
	Stack, Inline, Grid, Container,
} from '../../src'

const surface = 'background: var(--pounce-bg-muted, rgba(0,0,0,0.06)); padding: 0.75rem; border-radius: var(--pounce-border-radius, 0.5rem);'

export default function LayoutRoute() {
	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Layout</Heading>
				<Text muted>Stack, Inline, Grid, and Container primitives.</Text>
			</header>

			<section>
				<Heading level={3}>Stack (vertical)</Heading>
				<Stack style={surface}>
					<span>Item 1 — default gap (md)</span>
					<span>Item 2</span>
					<span>Item 3</span>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Stack — gap tokens</Heading>
				<Inline wrap gap="lg">
					<Stack gap="xs" style={surface}>
						<Text size="sm" muted>xs</Text>
						<span>A</span>
						<span>B</span>
					</Stack>
					<Stack gap="sm" style={surface}>
						<Text size="sm" muted>sm</Text>
						<span>A</span>
						<span>B</span>
					</Stack>
					<Stack gap="lg" style={surface}>
						<Text size="sm" muted>lg</Text>
						<span>A</span>
						<span>B</span>
					</Stack>
					<Stack gap="xl" style={surface}>
						<Text size="sm" muted>xl</Text>
						<span>A</span>
						<span>B</span>
					</Stack>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Inline (horizontal)</Heading>
				<Inline wrap gap="sm" style={surface}>
					<Button>Alpha</Button>
					<Button variant="secondary">Bravo</Button>
					<Button variant="success">Charlie</Button>
					<Button variant="warning">Delta</Button>
					<Button variant="danger">Echo</Button>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Inline — justify</Heading>
				<Stack gap="sm">
					<Inline justify="between" style={surface}>
						<span>Left</span>
						<span>Right</span>
					</Inline>
					<Inline justify="center" style={surface}>
						<span>Centered</span>
					</Inline>
					<Inline justify="evenly" style={surface}>
						<span>A</span>
						<span>B</span>
						<span>C</span>
					</Inline>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Grid — numeric columns</Heading>
				<Grid columns={3} gap="sm">
					<article style={surface}><strong>Column 1</strong><p>Three equal columns.</p></article>
					<article style={surface}><strong>Column 2</strong><p>Using repeat(3, 1fr).</p></article>
					<article style={surface}><strong>Column 3</strong><p>Responsive by default.</p></article>
				</Grid>
			</section>

			<section>
				<Heading level={3}>Grid — auto-fit with minItemWidth</Heading>
				<Grid minItemWidth="200px" gap="sm">
					<article style={surface}><strong>Card A</strong><p>Auto-fit to 200px min.</p></article>
					<article style={surface}><strong>Card B</strong><p>Wraps to next row.</p></article>
					<article style={surface}><strong>Card C</strong><p>When space runs out.</p></article>
					<article style={surface}><strong>Card D</strong><p>Fluid and responsive.</p></article>
				</Grid>
			</section>

			<section>
				<Heading level={3}>Container</Heading>
				<Stack gap="sm">
					<Container style={surface}>
						<Text>Default container (max-width centered).</Text>
					</Container>
					<Container fluid style={surface}>
						<Text>Fluid container (full width).</Text>
					</Container>
				</Stack>
			</section>
		</Stack>
	)
}
