import { Button, Card, Inline, Select, Stack, Switch } from '@pounce/ui'
import { reactive } from 'mutts'
import { ApiTable, Demo, Section } from '../../components'

const playgroundSource = `<Card variant={state.variant}>
  <Card.Header if={state.showHeader}>Card Title</Card.Header>
  <Card.Body>Card body content.</Card.Body>
  <Card.Footer if={state.showFooter}>
    <Button variant="primary">Action</Button>
  </Card.Footer>
</Card>`

function CardPlayground() {
	const state = reactive({
		variant: 'primary',
		showHeader: true,
		showFooter: true,
	})

	return (
		<Stack gap="md">
			<Inline gap="md" wrap>
				<label>
					variant
					<Select value={state.variant}>
						<option value="primary">primary</option>
						<option value="secondary">secondary</option>
						<option value="success">success</option>
						<option value="danger">danger</option>
						<option value="outlined">outlined</option>
					</Select>
				</label>
			</Inline>
			<Inline gap="md">
				<Switch checked={state.showHeader}>Header</Switch>
				<Switch checked={state.showFooter}>Footer</Switch>
			</Inline>
			<hr />
			<Card variant={state.variant}>
				<Card.Header if={state.showHeader}>Card Title</Card.Header>
				<Card.Body>
					<p>Card body content. Toggle the switches above to show or hide the header and footer.</p>
				</Card.Body>
				<Card.Footer if={state.showFooter}>
					<Inline gap="sm">
						<Button variant="primary">Save</Button>
						<Button variant="secondary">Cancel</Button>
					</Inline>
				</Card.Footer>
			</Card>
		</Stack>
	)
}

export default function CardPage() {
	return (
		<article>
			<h1>Card</h1>
			<p>
				Semantic card component using <code>{'<article>'}</code>. Composable with{' '}
				<code>Card.Header</code>, <code>Card.Body</code>, and <code>Card.Footer</code>{' '}
				sub-components.
			</p>

			<Section title="Playground">
				<p>Toggle parts and change the variant to see the card update live.</p>
				<Demo title="Card Playground" source={playgroundSource} component={<CardPlayground />} />
			</Section>

			<Section title="API Reference">
				<h4>CardProps</h4>
				<ApiTable
					props={[
						{
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'primary'",
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes on the <article>',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Card content — typically Card.Header, Card.Body, Card.Footer',
							required: false,
						},
					]}
				/>
				<h4>CardSectionProps (Header, Body, Footer)</h4>
				<ApiTable
					props={[
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Section content',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
