import { document, latch } from '@pounce/core'
import { reactive } from 'mutts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = reactive({
	'aria-current': 'page' as 'page' | undefined,
	style: { textDecoration: 'none' } as JSX.IntrinsicElements['a']['style'],
	onClick: vi.fn(),
})

vi.mock('@pounce/kit', () => ({
	linkModel: () => ({
		get 'aria-current'() {
			return state['aria-current']
		},
		get style() {
			return state.style
		},
		onClick: state.onClick,
	}),
}))

import { A } from './link'

describe('A', () => {
	let container: HTMLElement
	let stop: (() => void) | undefined

	beforeEach(() => {
		state['aria-current'] = 'page'
		state.style = { textDecoration: 'none' }
		state.onClick = vi.fn()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		stop?.()
		stop = undefined
		container.remove()
		document.body.innerHTML = ''
	})

	it('prefers model-driven attributes over raw props and keeps them reactive', async () => {
		stop = latch(
			container,
			<A href="/" aria-current="false" style={{ textDecoration: 'underline' }} data-testid="link">
				Home
			</A>
		)

		const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement
		expect(link.getAttribute('aria-current')).toBe('page')
		expect(link.style.textDecoration).toBe('none')

		state['aria-current'] = undefined
		state.style = { textDecoration: 'line-through' }
		await Promise.resolve()

		expect(link.getAttribute('aria-current')).toBeNull()
		expect(link.style.textDecoration).toBe('line-through')
	})

	it('uses the model click handler instead of a raw props override', () => {
		stop = latch(
			container,
			<A href="/" onClick={() => undefined} data-testid="link">
				Home
			</A>
		)

		const link = container.querySelector('[data-testid="link"]') as HTMLAnchorElement
		link.click()
		expect(state.onClick).toHaveBeenCalledTimes(1)
	})
})
