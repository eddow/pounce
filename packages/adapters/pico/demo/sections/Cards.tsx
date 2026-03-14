import { Button, Card } from '@sursaut/adapter-pico'
import { DemoSection } from './shared'

export default function CardsSection() {
	return (
		<DemoSection
			title="Cards"
			description="Card composition with header, body and footer regions using pico adapter primitives."
		>
			<Card>
				<Card.Header>
					<div style="display: flex; justify-content: space-between; gap: 1rem; align-items: center;">
						<strong>Adapter card</strong>
						<small>Composable sections</small>
					</div>
				</Card.Header>
				<Card.Body>
					<p style="margin: 0;">
						Cards stay intentionally thin: semantic structure comes from the adapter wrapper, content stays yours.
					</p>
				</Card.Body>
				<Card.Footer>
					<div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
						<Button outline>Cancel</Button>
						<Button variant="primary">Save</Button>
					</div>
				</Card.Footer>
			</Card>
		</DemoSection>
	)
}
