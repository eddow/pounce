import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Accordion, AccordionGroup } from '../../src/components/accordion'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'

describe('Accordion', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		installTestAdapter()
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders <details> with adapter base class', () => {
		render(<Accordion summary="Title">Content</Accordion>)
		const details = container.querySelector('details.test-accordion')
		expect(details).toBeTruthy()
	})

	it('renders with default pounce class when no adapter', () => {
		resetAdapter()
		render(<Accordion summary="Title">Content</Accordion>)
		const details = container.querySelector('details.pounce-accordion')
		expect(details).toBeTruthy()
	})

	it('renders summary text', () => {
		render(<Accordion summary="Click me">Hidden content</Accordion>)
		const summary = container.querySelector('.test-accordion-summary')
		expect(summary).toBeTruthy()
		expect(summary?.tagName).toBe('SUMMARY')
		expect(summary?.textContent).toContain('Click me')
	})

	it('renders content in content wrapper', () => {
		render(<Accordion summary="Title">Body text</Accordion>)
		const content = container.querySelector('.test-accordion-content')
		expect(content).toBeTruthy()
		expect(content?.textContent).toContain('Body text')
	})

	it('respects open prop', () => {
		render(<Accordion summary="Title" open={true}>Content</Accordion>)
		const details = container.querySelector('details') as HTMLDetailsElement
		expect(details.open).toBe(true)
	})

	it('defaults to closed', () => {
		render(<Accordion summary="Title">Content</Accordion>)
		const details = container.querySelector('details') as HTMLDetailsElement
		expect(details.open).toBe(false)
	})

	it('passes el props through', () => {
		render(<Accordion summary="Title" el={{ id: 'my-accordion' }}>Content</Accordion>)
		const details = container.querySelector('#my-accordion')
		expect(details).toBeTruthy()
		expect(details?.tagName).toBe('DETAILS')
	})

	it('supports variant via dot-syntax', () => {
		render(<Accordion.primary summary="Title">Content</Accordion.primary>)
		const details = container.querySelector('details')
		expect(details).toBeTruthy()
	})
})

describe('AccordionGroup', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		installTestAdapter()
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders group wrapper with adapter class', () => {
		render(
			<AccordionGroup name="faq">
				<Accordion summary="Q1">A1</Accordion>
				<Accordion summary="Q2">A2</Accordion>
			</AccordionGroup>
		)
		const group = container.querySelector('.test-accordion-group')
		expect(group).toBeTruthy()
		const items = group?.querySelectorAll('details')
		expect(items?.length).toBe(2)
	})

	it('passes el props through', () => {
		render(
			<AccordionGroup name="test" el={{ id: 'my-group' }}>
				<Accordion summary="Item">Content</Accordion>
			</AccordionGroup>
		)
		const group = container.querySelector('#my-group')
		expect(group).toBeTruthy()
	})
})
