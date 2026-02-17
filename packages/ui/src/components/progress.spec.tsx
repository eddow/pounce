import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Progress } from '../../src/components/progress'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'

describe('Progress', () => {
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

	it('renders <progress> with adapter base class', () => {
		render(<Progress value={50} />)
		const progress = container.querySelector('progress.test-progress')
		expect(progress).toBeTruthy()
	})

	it('renders with default pounce class when no adapter', () => {
		resetAdapter()
		render(<Progress value={50} />)
		const progress = container.querySelector('progress.pounce-progress')
		expect(progress).toBeTruthy()
	})

	it('sets value and max attributes', () => {
		render(<Progress value={30} max={200} />)
		const progress = container.querySelector('progress') as HTMLProgressElement
		expect(progress).toBeTruthy()
		expect(progress.value).toBe(30)
		expect(progress.max).toBe(200)
	})

	it('defaults max to 100', () => {
		render(<Progress value={75} />)
		const progress = container.querySelector('progress') as HTMLProgressElement
		expect(progress.max).toBe(100)
	})

	it('renders indeterminate when value is omitted', () => {
		render(<Progress />)
		const progress = container.querySelector('progress') as HTMLProgressElement
		expect(progress).toBeTruthy()
		expect(progress.hasAttribute('aria-valuenow')).toBe(false)
	})

	it('sets ARIA attributes for determinate mode', () => {
		render(<Progress value={60} max={100} />)
		const progress = container.querySelector('progress')
		expect(progress?.getAttribute('role')).toBe('progressbar')
		expect(progress?.getAttribute('aria-valuenow')).toBe('60')
		expect(progress?.getAttribute('aria-valuemin')).toBe('0')
		expect(progress?.getAttribute('aria-valuemax')).toBe('100')
	})

	it('omits aria-valuenow for indeterminate mode', () => {
		render(<Progress />)
		const progress = container.querySelector('progress')
		expect(progress?.getAttribute('role')).toBe('progressbar')
		expect(progress?.hasAttribute('aria-valuenow')).toBe(false)
	})

	it('passes el props through', () => {
		render(<Progress value={50} el={{ id: 'my-progress' }} />)
		const progress = container.querySelector('#my-progress')
		expect(progress).toBeTruthy()
		expect(progress?.tagName).toBe('PROGRESS')
	})

	it('supports variant via dot-syntax', () => {
		render(<Progress.danger value={25} />)
		const progress = container.querySelector('progress')
		expect(progress).toBeTruthy()
	})
})
