import { Accordion, AccordionGroup, Button, Inline, Select, Stack, Switch } from '@pounce/ui'
import { reactive } from 'mutts'
import { ApiTable, Demo, Section } from '../../components'

const playgroundSource = `<Accordion
  summary={state.summary}
  open={state.open}
  variant={state.variant}
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

const groupSource = `<AccordionGroup name="faq">
  <Accordion summary="Question 1">Answer 1</Accordion>
  <Accordion summary="Question 2">Answer 2</Accordion>
  <Accordion summary="Question 3">Answer 3</Accordion>
</AccordionGroup>`

function AccordionPlayground() {
	const state = reactive({
		variant: 'primary',
		open: false,
		summary: 'Click to expand',
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
						<option value="warning">warning</option>
					</Select>
				</label>
			</Inline>
			<Inline gap="md">
				<Switch checked={state.open}>open</Switch>
			</Inline>
			<hr />
			<Accordion summary={state.summary} open={state.open} variant={state.variant}>
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
					<code>AccordionGroup</code> wraps accordions with a shared <code>name</code> for
					exclusive-open behaviour (only one open at a time, via native HTML).
				</p>
				<Demo
					title="Exclusive Group"
					source={groupSource}
					component={
						<AccordionGroup name="faq">
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
							name: 'variant',
							type: 'string',
							description: "Visual variant. Default: 'primary'",
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
				<h4>AccordionGroupProps</h4>
				<ApiTable
					props={[
						{
							name: 'name',
							type: 'string',
							description: 'Shared name for exclusive-open behaviour',
							required: true,
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
							description: 'Accordion children',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}
