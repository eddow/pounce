import {
	tablerOutlineArrowsHorizontal,
	tablerOutlineBell,
	tablerOutlineBolt,
	tablerOutlineBrandGithub,
	tablerOutlineCalendar,
	tablerOutlineCheck,
	tablerOutlineChevronRight,
	tablerOutlineCircleLetterA,
	tablerOutlineCircleLetterB,
	tablerOutlineCircleLetterC,
	tablerOutlineCircleLetterD,
	tablerOutlineCircleLetterE,
	tablerOutlineHome,
	tablerOutlineInfoCircle,
	tablerOutlineMail,
	tablerOutlineMessage,
	tablerOutlineRocket,
	tablerOutlineShoppingCart,
	tablerOutlineStar,
	tablerOutlineTag,
	tablerOutlineUser,
	tablerOutlineUserCircle,
} from 'pure-glyf/icons'
import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Icon } from '../components/icon'
import { Container, Grid, Inline, Stack } from '../components/layout'
import { Badge, Chip, Pill } from '../components/status'
import { Heading, Link, Text } from '../components/typography'
import { css, sass } from '@pounce/kit'

// Test the css tag function
css`.css-tag-test { 
	color: red; 
	font-weight: bold;
	padding: 0.5rem;
	border: 2px solid blue;
}`

// Test the sass tag function (indented SASS syntax)
sass`
.sass-tag-test
	color: green
	font-size: 1.2em
	&:hover
		color: darkgreen
		text-decoration: underline
`

const surfaceStyle =
	'background: var(--pico-muted-border-color, rgba(0,0,0,.08)); padding: 0.75rem; border-radius: var(--pico-border-radius);'

export default () => (
	<Container tag="section">
		<Stack gap="lg">
			<header>
				<Heading level={1}>Display</Heading>
				<Text muted>Design primitives available in @pounce/pico.</Text>
			</header>
			<div>
				<Heading level={3}>Typography</Heading>
				<Stack>
					<Heading level={2} variant="primary">
						Heading level 2
					</Heading>
					<Heading level={3} variant="secondary">
						Secondary tone heading
					</Heading>
					<Text>
						Regular body copy with <strong>strong emphasis</strong> and inline{' '}
						<Link href="https://picocss.com" target="_blank" rel="noreferrer">
							links
						</Link>
						.
					</Text>
					<Text size="sm" muted>
						Muted supporting text for fine print or captions.
					</Text>
				</Stack>
			</div>
			<div>
				<Heading level={3}>Icons</Heading>
				<Inline gap="md">
					<Icon icon={tablerOutlineHome} />
					<Icon icon={tablerOutlineUser} size="24px" />
					<Icon icon={tablerOutlineBrandGithub} size="24px" />
				</Inline>
			</div>
			<div>
				<Heading level={3}>Buttons</Heading>
				<Inline role="group">
					<Button el:aria-current="true">Active</Button>
					<Button>Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="contrast">Contrast</Button>
					<Button variant="success">Success</Button>
					<Button variant="warning">Warning</Button>
					<Button variant="danger">Danger</Button>
				</Inline>
			</div>
			<div>
				<Heading level={3}>Iconed Buttons</Heading>
				<Inline role="group">
					<Button icon={tablerOutlineHome}>Home</Button>
					<Button variant="secondary" icon={tablerOutlineUser}>
						Account
					</Button>
					<Button variant="contrast" iconPosition="end" icon={tablerOutlineBrandGithub}>
						GitHub
					</Button>
				</Inline>
			</div>
			<div>
				<Heading level={3}>Buttons with Badges</Heading>
				<Stack gap="sm">
					<Text size="sm" muted>
						Badges can be used to show notification counts, unread items, or other indicators.
					</Text>
					<Inline role="group" wrap gap="sm">
						<Button icon={tablerOutlineMail} use:badge={5} ariaLabel="Inbox">
							Inbox
						</Button>
						<Button icon={tablerOutlineBell} use:badge={12} ariaLabel="Notifications" />
						<Button icon={tablerOutlineMessage} use:badge="99+" ariaLabel="Messages" />
						<Button icon={tablerOutlineShoppingCart} use:badge={3} ariaLabel="Shopping cart">
							Cart
						</Button>
						<Button
							variant="secondary"
							icon={tablerOutlineUserCircle}
							use:badge="New"
							ariaLabel="Profile"
						/>
						<Button
							variant="success"
							ariaLabel="Starred"
							use:badge={{
								value: <Icon icon={tablerOutlineStar} size="12px" />,
								position: 'top-right',
							}}
						>
							Starred
						</Button>
					</Inline>
				</Stack>
			</div>
			<div>
				<Heading level={3}>Badges</Heading>
				<Inline wrap gap="sm">
					<Badge variant="primary">Primary</Badge>
					<Badge variant="secondary" icon={tablerOutlineInfoCircle}>
						Info
					</Badge>
					<Badge variant="success">Live</Badge>
					<Badge variant="warning">Beta</Badge>
					<Badge variant="danger">Error</Badge>
					<Badge variant="contrast">Dark</Badge>
				</Inline>
			</div>
			<div>
				<Heading level={3}>Chips</Heading>
				<Inline wrap gap="sm">
					<Chip icon={tablerOutlineTag} variant="secondary">
						Label
					</Chip>
					<Chip icon={tablerOutlineUser} variant="success">
						Assigned
					</Chip>
					<Chip icon={tablerOutlineBolt} variant="warning" dismissible>
						Fast track
					</Chip>
					<Chip variant="danger" dismissible>
						Blocking
					</Chip>
				</Inline>
			</div>
			<div>
				<Heading level={3}>Pills</Heading>
				<Inline wrap gap="sm">
					<Pill icon={tablerOutlineCalendar}>Upcoming</Pill>
					<Pill variant="success" icon={tablerOutlineCheck}>
						Confirmed
					</Pill>
					<Pill variant="contrast" trailingIcon={tablerOutlineChevronRight}>
						Navigate
					</Pill>
				</Inline>
			</div>
			<div>
				<Heading level={3}>Layout primitives</Heading>
				<Stack gap="lg">
					<Stack style={surfaceStyle}>
						<strong>Stack</strong>
						<span>Vertical spacing with precise control.</span>
						<span>Gap defaults to 1.5× Pico spacing.</span>
					</Stack>
					<Inline wrap gap="sm" style={surfaceStyle}>
						<Button icon={tablerOutlineCircleLetterA}>Alpha</Button>
						<Button icon={tablerOutlineCircleLetterB}>Bravo</Button>
						<Button icon={tablerOutlineCircleLetterC}>Charlie</Button>
						<Button icon={tablerOutlineCircleLetterD}>Delta</Button>
						<Button icon={tablerOutlineCircleLetterE}>Echo</Button>
					</Inline>
					<Grid minItemWidth="12rem" gap="sm">
						<article style={surfaceStyle}>
							<strong>Responsive cards</strong>
							<p>Auto-fit to minimum width of 12rem.</p>
						</article>
						<article style={surfaceStyle}>
							<strong>Custom columns</strong>
							<p>Grid integrates Pico spacing tokens.</p>
						</article>
						<article style={surfaceStyle}>
							<strong>Fluid layout</strong>
							<p>Combine with Container to center content.</p>
						</article>
					</Grid>
				</Stack>
			</div>
			<div>
				<Heading level={3}>Fluid container</Heading>
				{/* Break out of parent container to show fluid effect - extends to viewport edges */}
				<div style="width: 100vw; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw;">
					<Container style={surfaceStyle}>
						<Inline wrap gap="sm">
							<span>Container without fluid width for media or dashboards.</span>
							<Button variant="secondary" icon={tablerOutlineArrowsHorizontal}>
								Expand
							</Button>
						</Inline>
					</Container>
					<Container fluid style={surfaceStyle}>
						<Inline wrap gap="sm">
							<span>Container with fluid width for media or dashboards.</span>
							<Button variant="secondary" icon={tablerOutlineArrowsHorizontal}>
								Expand
							</Button>
						</Inline>
					</Container>
				</div>
			</div>
			<div>
				<Heading level={3}>Alerts</Heading>
				<Stack gap="sm">
					<Alert title="Heads up" variant="primary">
						You can use alerts for inline messaging and inline callouts.
					</Alert>
					<Alert title="Deployment ready" variant="success" icon={tablerOutlineRocket}>
						All checks passed. Prepare to deploy when ready.
					</Alert>
					<Alert title="Action required" variant="warning" dismissible>
						Update the configuration before continuing.
					</Alert>
					<Alert title="Critical issue" variant="danger" dismissible>
						Service interruptions detected. Investigate immediately.
					</Alert>
				</Stack>
			</div>
			<div>
				<Heading level={3}>CSS Tag Function Test</Heading>
				<Stack gap="sm">
					<Text size="sm" muted>
						Testing the css and sass template tag functions.
					</Text>
					<div class="css-tag-test">This div uses the css tag function (red text, blue border)</div>
					<div class="sass-tag-test">
						This div uses the sass tag function (green text, hover effect)
					</div>
				</Stack>
			</div>
		</Stack>
	</Container>
)
