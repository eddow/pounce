import { reactive } from 'mutts'
import {
	Button, Badge, Chip, Pill,
	Heading, Text, Link,
	Stack, Inline, Grid,
	Icon,
} from '../../src'

const surface = 'background: var(--pounce-bg-muted, rgba(0,0,0,0.06)); padding: 0.75rem; border-radius: var(--pounce-border-radius, 0.5rem);'

export default function DisplayRoute() {
	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Display</Heading>
				<Text muted>Typography, buttons, status tokens, and icons.</Text>
			</header>

			<section>
				<Heading level={3}>Typography</Heading>
				<Stack>
					<Heading level={2} variant="primary">Primary Heading</Heading>
					<Heading level={3} variant="secondary">Secondary Heading</Heading>
					<Heading level={4} variant="success">Success Heading</Heading>
					<Text>
						Regular body copy with <strong>strong emphasis</strong> and{' '}
						<Link href="https://github.com" target="_blank" rel="noreferrer">inline links</Link>.
					</Text>
					<Text size="sm" muted>Muted supporting text for captions.</Text>
					<Text size="lg">Large text for emphasis.</Text>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Buttons</Heading>
				<Stack gap="md">
					<Inline wrap gap="sm">
						<Button>Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="success">Success</Button>
						<Button variant="warning">Warning</Button>
						<Button variant="danger">Danger</Button>
						<Button variant="contrast">Contrast</Button>
					</Inline>
					<Inline wrap gap="sm">
						<Button disabled>Disabled</Button>
						<Button variant="secondary" disabled>Disabled</Button>
					</Inline>
				</Stack>
			</section>

			<section>
				<Heading level={3}>Badges</Heading>
				<Inline wrap gap="sm">
					<Badge>Primary</Badge>
					<Badge variant="secondary">Info</Badge>
					<Badge variant="success">Live</Badge>
					<Badge variant="warning">Beta</Badge>
					<Badge variant="danger">Error</Badge>
					<Badge variant="contrast">Dark</Badge>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Pills</Heading>
				<Inline wrap gap="sm">
					<Pill>Default</Pill>
					<Pill variant="success">Confirmed</Pill>
					<Pill variant="warning">Pending</Pill>
					<Pill variant="contrast">Navigate</Pill>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Chips</Heading>
				<Inline wrap gap="sm">
					<Chip variant="secondary">Label</Chip>
					<Chip variant="success">Assigned</Chip>
					<Chip variant="warning" dismissible>Fast track</Chip>
					<Chip variant="danger" dismissible>Blocking</Chip>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Link Variants</Heading>
				<Inline wrap gap="md">
					<Link href="#">Primary</Link>
					<Link href="#" variant="secondary">Secondary</Link>
					<Link href="#" variant="success">Success</Link>
					<Link href="#" variant="danger">Danger</Link>
					<Link href="#" underline={false}>No underline</Link>
				</Inline>
			</section>
		</Stack>
	)
}
