import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Stars } from '../../src/components/stars'
import { resetAdapter } from '../../src/adapter/registry'

describe('Stars', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	it('renders 5 stars by default', () => {
		render(<Stars value={3} />)
		const stars = container.querySelector('.pounce-stars')
		expect(stars).toBeTruthy()
		const items = stars?.querySelectorAll('.pounce-stars-item')
		expect(items?.length).toBe(5)
	})

	it('renders custom number of stars', () => {
		render(<Stars value={2} maximum={10} />)
		const items = container.querySelectorAll('.pounce-stars-item')
		expect(items.length).toBe(10)
	})

	it('renders readonly stars', () => {
		render(<Stars value={4} readonly={true} />)
		const stars = container.querySelector('.pounce-stars')
		expect(stars?.classList.contains('pounce-readonly')).toBe(true)
	})
})
