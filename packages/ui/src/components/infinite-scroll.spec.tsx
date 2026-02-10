import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { InfiniteScroll } from '../../src/components/infinite-scroll'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'

describe('InfiniteScroll', () => {
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

	it('renders scroll container with adapter base class', () => {
		render(
			<InfiniteScroll items={['a', 'b', 'c']} itemHeight={40}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const scroll = container.querySelector('.test-infinite')
		expect(scroll).toBeTruthy()
	})

	it('renders with default pounce class when no adapter', () => {
		resetAdapter()
		render(
			<InfiniteScroll items={['a', 'b']} itemHeight={40}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const scroll = container.querySelector('.pounce-infinite-scroll')
		expect(scroll).toBeTruthy()
	})

	it('renders content wrapper with adapter class', () => {
		render(
			<InfiniteScroll items={['a', 'b']} itemHeight={40}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const content = container.querySelector('.test-infinite-content')
		expect(content).toBeTruthy()
	})

	it('renders nested content and offset wrappers', () => {
		render(
			<InfiniteScroll items={['a', 'b', 'c']} itemHeight={40}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const scroll = container.querySelector('.test-infinite')
		const content = scroll?.querySelector('.test-infinite-content')
		expect(content).toBeTruthy()
		// Content wrapper contains an offset div for virtualization
		expect(content?.children.length).toBeGreaterThanOrEqual(1)
	})

	it('passes el props through', () => {
		render(
			<InfiniteScroll items={['a']} itemHeight={40} el={{ id: 'my-scroll' }}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const scroll = container.querySelector('#my-scroll')
		expect(scroll).toBeTruthy()
	})
})
