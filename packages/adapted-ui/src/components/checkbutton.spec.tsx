import { document, latch } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetAdapter } from '../adapter/registry'
import { CheckButton } from './checkbutton'

describe('CheckButton', () => {
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

	it('renders with default props', () => {
		render(<CheckButton>Toggle</CheckButton>)
		const btn = container.querySelector('.pounce-checkbutton')
		expect(btn).toBeTruthy()
		expect(btn?.getAttribute('role')).toBe('checkbox')
		expect(btn?.getAttribute('aria-checked')).toBe('false')
		expect(btn?.textContent).toContain('Toggle')
	})

	it('renders checked state', () => {
		render(<CheckButton checked={true}>On</CheckButton>)
		const btn = container.querySelector('.pounce-checkbutton')
		expect(btn?.getAttribute('aria-checked')).toBe('true')
		expect(btn?.classList.contains('pounce-checkbutton-checked')).toBe(true)
	})

	it('renders with icon', () => {
		render(<CheckButton icon="check">Done</CheckButton>)
		const iconEl = container.querySelector('.pounce-checkbutton-icon')
		expect(iconEl).toBeTruthy()
	})

	it('renders icon-only with aria-label', () => {
		render(<CheckButton icon="star" aria-label="Favorite" />)
		const btn = container.querySelector('.pounce-checkbutton')
		expect(btn?.getAttribute('aria-label')).toBe('Favorite')
	})
})
