import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
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
		unmount = latch(container, element)
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

	it('content height reflects fixed itemHeight × count', () => {
		render(
			<InfiniteScroll items={['a', 'b', 'c']} itemHeight={40}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const content = container.querySelector('.test-infinite-content') as HTMLElement
		expect(content).toBeTruthy()
		expect(content.style.height).toBe('120px')
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

	it('accepts function itemHeight (variable mode)', () => {
		render(
			<InfiniteScroll items={['short', 'tall']} itemHeight={() => 60}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const scroll = container.querySelector('.test-infinite')
		expect(scroll).toBeTruthy()
	})

	it('content height reflects variable-height estimates', () => {
		render(
			<InfiniteScroll items={['a', 'b', 'c']} itemHeight={() => 100} estimatedItemHeight={100}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const content = container.querySelector('.test-infinite-content') as HTMLElement
		expect(content).toBeTruthy()
		// 3 items × 100px estimate = 300px
		expect(content.style.height).toBe('300px')
	})

	it('content height uses estimator function per item', () => {
		const items = ['short', 'tall', 'short']
		const heights = (item: string) => item === 'tall' ? 200 : 50
		render(
			<InfiniteScroll items={items} itemHeight={heights}>
				{(item: string) => <div>{item}</div>}
			</InfiniteScroll>
		)
		const content = container.querySelector('.test-infinite-content') as HTMLElement
		expect(content).toBeTruthy()
		// 50 + 200 + 50 = 300
		expect(content.style.height).toBe('300px')
	})
})
