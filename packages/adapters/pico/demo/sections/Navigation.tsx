import { A, Accordion, AccordionGroup, Menu } from '@sursaut/adapter-pico'
import { DemoCard, DemoGrid, DemoSection } from './shared'
import { h } from '@sursaut/core'

const accordionItems = [
	{ id: 'intro', title: 'What is pico?', body: 'A tiny CSS adapter layer around the headless Sursaut UI models.' },
	{ id: 'reactivity', title: 'How does precedence work?', body: 'Passthrough props spread first, then model-owned semantics override when needed.' },
]

export default function NavigationSection() {
	return (
		<DemoSection
			title="Navigation"
			description="Link, menu and accordion concerns grouped around navigation semantics and disclosure UI."
		>
			<DemoGrid>
				<DemoCard title="Links + Menu.Bar">
					<Menu.Bar
						brand={<A href="/">Sursaut</A>}
						items={[
							<A href="/buttons">Buttons</A>,
							<A href="/options">Options</A>,
						]}
						trailing={<A href="/theme">Theme</A>}
					/>
				</DemoCard>
				<DemoCard title="Menu">
					<Menu summary="Actions">
						<ul role="menu">
							<li role="none"><Menu.Item href="/buttons">Open buttons</Menu.Item></li>
							<li role="none"><Menu.Item href="/status">Open status</Menu.Item></li>
						</ul>
					</Menu>
				</DemoCard>
				<DemoCard title="Accordion">
					<AccordionGroup>
						<for each={accordionItems}>
							{(item) => (
								<Accordion value={item.id} summary={item.title}>
									<p style="margin: 0;">{item.body}</p>
								</Accordion>
							)}
						</for>
					</AccordionGroup>
				</DemoCard>
			</DemoGrid>
		</DemoSection>
	)
}
