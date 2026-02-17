import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Card } from '../../src/components/card'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'

describe('Card', () => {
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
		unmount = latch(container, element)
	}

	it('renders as <article> with adapter base class', () => {
		render(<Card>Content</Card>)
		const card = container.querySelector('article.test-card')
		expect(card).toBeTruthy()
		expect(card?.textContent).toContain('Content')
	})

	it('renders with default pounce class when no adapter', () => {
		resetAdapter()
		render(<Card>Content</Card>)
		const card = container.querySelector('article.pounce-card')
		expect(card).toBeTruthy()
	})

	it('renders Header sub-component with adapter class', () => {
		render(
			<Card>
				<Card.Header>Title</Card.Header>
			</Card>
		)
		const header = container.querySelector('.test-card-header')
		expect(header).toBeTruthy()
		expect(header?.tagName).toBe('HEADER')
		expect(header?.textContent).toContain('Title')
	})

	it('renders Body sub-component with adapter class', () => {
		render(
			<Card>
				<Card.Body>Body text</Card.Body>
			</Card>
		)
		const body = container.querySelector('.test-card-body')
		expect(body).toBeTruthy()
		expect(body?.textContent).toContain('Body text')
	})

	it('renders Footer sub-component with adapter class', () => {
		render(
			<Card>
				<Card.Footer>Actions</Card.Footer>
			</Card>
		)
		const footer = container.querySelector('.test-card-footer')
		expect(footer).toBeTruthy()
		expect(footer?.tagName).toBe('FOOTER')
		expect(footer?.textContent).toContain('Actions')
	})

	it('renders full card with all sections', () => {
		render(
			<Card>
				<Card.Header>Title</Card.Header>
				<Card.Body>Content</Card.Body>
				<Card.Footer>Actions</Card.Footer>
			</Card>
		)
		const card = container.querySelector('article.test-card')
		expect(card).toBeTruthy()
		expect(card?.querySelector('.test-card-header')).toBeTruthy()
		expect(card?.querySelector('.test-card-body')).toBeTruthy()
		expect(card?.querySelector('.test-card-footer')).toBeTruthy()
	})

	it('passes el props through', () => {
		render(<Card el={{ id: 'my-card' }}>Content</Card>)
		const card = container.querySelector('#my-card')
		expect(card).toBeTruthy()
		expect(card?.tagName).toBe('ARTICLE')
	})

	it('supports variant via dot-syntax', () => {
		render(<Card.primary>Content</Card.primary>)
		const card = container.querySelector('article')
		expect(card).toBeTruthy()
	})
})
