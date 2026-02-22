import { beforeEach, describe, expect, it } from 'vitest'
import { tooltip } from './tooltip'

describe('tooltip directive', () => {
	let el: HTMLElement

	beforeEach(() => {
		el = document.createElement('button')
	})

	it('sets data-tooltip from string input', () => {
		tooltip(el, 'Save')
		expect(el.getAttribute('data-tooltip')).toBe('Save')
	})

	it('does not set data-placement for default (top)', () => {
		tooltip(el, 'Save')
		expect(el.hasAttribute('data-placement')).toBe(false)
	})

	it('sets data-placement from options', () => {
		tooltip(el, { text: 'Save', placement: 'bottom' })
		expect(el.getAttribute('data-tooltip')).toBe('Save')
		expect(el.getAttribute('data-placement')).toBe('bottom')
	})

	it('does not set data-placement when placement is top (Pico default)', () => {
		tooltip(el, { text: 'Save', placement: 'top' })
		expect(el.hasAttribute('data-placement')).toBe(false)
	})

	it('sets left/right placements', () => {
		tooltip(el, { text: 'Info', placement: 'left' })
		expect(el.getAttribute('data-placement')).toBe('left')

		tooltip(el, { text: 'Info', placement: 'right' })
		expect(el.getAttribute('data-placement')).toBe('right')
	})

	it('cleanup removes attributes', () => {
		const cleanup = tooltip(el, { text: 'Save', placement: 'bottom' })
		expect(el.hasAttribute('data-tooltip')).toBe(true)
		expect(el.hasAttribute('data-placement')).toBe(true)

		cleanup!()
		expect(el.hasAttribute('data-tooltip')).toBe(false)
		expect(el.hasAttribute('data-placement')).toBe(false)
	})

	it('returns undefined for non-HTMLElement', () => {
		const textNode = document.createTextNode('hello')
		const result = tooltip(textNode, 'Save')
		expect(result).toBeUndefined()
	})

	it('handles array target (takes first element)', () => {
		tooltip([el], 'Save')
		expect(el.getAttribute('data-tooltip')).toBe('Save')
	})
})
