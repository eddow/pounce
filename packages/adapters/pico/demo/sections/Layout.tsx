import { Button, Container, Grid, Heading, Inline, Stack, Text, Toolbar } from '@pounce/adapter-pico'
import { DemoCard, DemoGrid, DemoSection } from './shared'

export default function LayoutSection() {
	return (
		<DemoSection
			title="Layout"
			description="Container, typography and layout helpers grouped around spacing, alignment and toolbar navigation."
		>
			<Container>
				<DemoGrid>
					<DemoCard title="Typography">
						<Heading level={3}>Section heading</Heading>
						<Text muted>Muted copy built from the headless text model.</Text>
					</DemoCard>
					<DemoCard title="Stack + Inline">
						<Stack gap="0.5rem">
							<Button>Top</Button>
							<Button outline>Bottom</Button>
						</Stack>
						<Inline gap="0.5rem" el={{ style: { marginTop: '0.75rem' } }}>
							<Button variant="primary">One</Button>
							<Button variant="secondary">Two</Button>
						</Inline>
					</DemoCard>
					<DemoCard title="Grid + Toolbar">
						<Grid columns={2} gap="0.5rem">
							<Button>Left</Button>
							<Button>Right</Button>
						</Grid>
						<Toolbar el={{ style: { marginTop: '0.75rem' } }}>
							<Button>Back</Button>
							<Button>Forward</Button>
							<Toolbar.Spacer />
							<Button variant="primary">Publish</Button>
						</Toolbar>
					</DemoCard>
				</DemoGrid>
			</Container>
		</DemoSection>
	)
}
