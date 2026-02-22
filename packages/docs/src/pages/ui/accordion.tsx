import { Accordion, AccordionGroup, Button, Inline, Stack, Switch } from '@pounce'
import { reactive } from 'mutts'
import { ApiTable, Demo, Section } from '../../components'

const playgroundSource = `<Accordion
  summary={state.summary}
  open={state.open}
>
  <p>Collapsible content here.</p>
</Accordion>`

const controlledSource = `const state = reactive({ open: false })

// open={state.open} is two-way bound automatically —
// the accordion writes back when toggled.
<Accordion open={state.open} summary="Controlled">
  <p>Open state is managed externally.</p>
</Accordion>

<Button onClick={() => state.open = !state.open}>
  Toggle from outside
</Button>`

const groupSource = `<AccordionGroup>
  <Accordion summary="Question 1">Answer 1</Accordion>
  <Accordion summary="Question 2">Answer 2</Accordion>
  <Accordion summary="Question 3">Answer 3</Accordion>
</AccordionGroup>

{/* Multi-open: */}
<AccordionGroup multi>
  <Accordion summary="Item 1">Content 1</Accordion>
  <Accordion summary="Item 2">Content 2</Accordion>
</AccordionGroup>`

function AccordionPlayground() {
	const state = reactive({
		open: false,
		summary: 'Click to expand',
	})

	return (
		<Stack gap="md">
			<Inline gap="md">
				<Switch checked={state.open}>open</Switch>
			</Inline>
			<hr />
			<Accordion summary={state.summary} open={state.open}>
				<p>
					This content is revealed when the accordion is open. The <code>open</code> prop is two-way
					bound — toggling the accordion updates the switch above.
				</p>
			</Accordion>
		</Stack>
	)
}

function ControlledDemo() {
	const state = reactive({ open: false })
	return (
		<Stack gap="md">
			<Accordion open={state.open} summary="Controlled Accordion">
				<p>Open state is managed externally via two-way binding.</p>
			</Accordion>
			<Button
				onClick={() => {
					state.open = !state.open
				}}
			>
				Toggle from outside (open: {state.open ? 'true' : 'false'})
			</Button>
		</Stack>
	)
}

export default function AccordionPage() {
	return (
		<article>
			<h1>Accordion</h1>
			<p>
				Collapsible content section built on native <code>{'<details>'}</code>. Supports controlled
				state, variants, and auto-merging borders when stacked.
			</p>

			<Section title="Playground">
				<p>Toggle props to see the accordion update live.</p>
				<Demo
					title="Accordion Playground"
					source={playgroundSource}
					component={<AccordionPlayground />}
				/>
			</Section>

			<Section title="Controlled">
				<p>
					<code>open={'{state.open}'}</code> is two-way bound — the accordion reads and writes it
					directly. No <code>onToggle</code> callback needed for basic state sync.
				</p>
				<Demo
					title="Controlled Accordion"
					source={controlledSource}
					component={<ControlledDemo />}
				/>
			</Section>

			<Section title="AccordionGroup">
				<p>
					Wrap accordions in <code>AccordionGroup</code> to coordinate open state. Default is
					exclusive (single-open). Pass <code>multi</code> to allow multiple open at once.
				</p>
				<Demo
					title="Exclusive Group"
					source={groupSource}
					component={
						<AccordionGroup>
							<Accordion summary="Question 1">
								<p>Answer 1</p>
							</Accordion>
							<Accordion summary="Question 2">
								<p>Answer 2</p>
							</Accordion>
							<Accordion summary="Question 3">
								<p>Answer 3</p>
							</Accordion>
						</AccordionGroup>
					}
				/>
			</Section>

			<Section title="API Reference">
				<h4>AccordionProps</h4>
				<ApiTable
					props={[
						{
							name: 'summary',
							type: 'JSX.Children',
							description: 'Header content (always visible)',
							required: true,
						},
						{
							name: 'open',
							type: 'boolean',
							description: 'Controlled open state — two-way bound. Default: false',
							required: false,
						},
						{
							name: 'onToggle',
							type: '(open: boolean) => void',
							description: 'Side-effect callback when toggled (not needed for state sync)',
							required: false,
						},
						{
							name: 'el',
							type: 'JSX.GlobalHTMLAttributes',
							description: 'Pass-through HTML attributes',
							required: false,
						},
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Collapsible content',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
