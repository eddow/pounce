import { document } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetAdapter, setAdapter } from '../../src/adapter/registry'
import { vanillaAdapter } from '../../src/adapter/vanilla'
import { loading } from '../../src/directives/loading'

describe('loading directive', () => {
	let element: HTMLElement
	let cleanup: (() => void) | undefined

	beforeEach(() => {
		setAdapter(vanillaAdapter)
		element = document.createElement('button')
		document.body.appendChild(element)
	})

	afterEach(() => {
		cleanup?.()
		element.remove()
		resetAdapter()
	})

	it('should set aria-busy and loading class when true', () => {
		cleanup = loading(element, true)
		expect(element.getAttribute('aria-busy')).toBe('true')
		expect(element.classList.contains('pounce-loading')).toBe(true)
	})

	it('should not set aria-busy when false', () => {
		cleanup = loading(element, false)
		expect(element.hasAttribute('aria-busy')).toBe(false)
		expect(element.classList.contains('pounce-loading')).toBe(false)
	})

	it('should disable form elements when true', () => {
		cleanup = loading(element, true)
		expect((element as HTMLButtonElement).disabled).toBe(true)
	})

	it('should re-enable form elements when false', () => {
		loading(element, true)
		cleanup = loading(element, false)
		expect((element as HTMLButtonElement).disabled).toBe(false)
	})

	it('should not set disabled on non-form elements', () => {
		const div = document.createElement('div')
		document.body.appendChild(div)
		cleanup = loading(div, true)
		expect(div.hasAttribute('disabled')).toBe(false)
		expect(div.getAttribute('aria-busy')).toBe('true')
		expect(div.classList.contains('pounce-loading')).toBe(true)
		div.remove()
	})

	it('should work on input elements', () => {
		const input = document.createElement('input')
		document.body.appendChild(input)
		const c = loading(input, true)
		expect((input as HTMLInputElement).disabled).toBe(true)
		expect(input.getAttribute('aria-busy')).toBe('true')
		c?.()
		input.remove()
	})

	it('should work on select elements', () => {
		const select = document.createElement('select')
		document.body.appendChild(select)
		const c = loading(select, true)
		expect((select as HTMLSelectElement).disabled).toBe(true)
		expect(select.getAttribute('aria-busy')).toBe('true')
		c?.()
		select.remove()
	})

	it('should work on textarea elements', () => {
		const textarea = document.createElement('textarea')
		document.body.appendChild(textarea)
		const c = loading(textarea, true)
		expect((textarea as HTMLTextAreaElement).disabled).toBe(true)
		expect(textarea.getAttribute('aria-busy')).toBe('true')
		c?.()
		textarea.remove()
	})

	it('should work on fieldset elements', () => {
		const fieldset = document.createElement('fieldset')
		document.body.appendChild(fieldset)
		const c = loading(fieldset, true)
		expect((fieldset as HTMLFieldSetElement).disabled).toBe(true)
		expect(fieldset.getAttribute('aria-busy')).toBe('true')
		c?.()
		fieldset.remove()
	})

	it('should use adapter class override', () => {
		setAdapter({
			components: {
				Loading: { classes: { base: 'custom-loading' } }
			}
		})
		cleanup = loading(element, true)
		expect(element.classList.contains('custom-loading')).toBe(true)
		expect(element.classList.contains('pounce-loading')).toBe(false)
	})

	it('should clean up on unmount', () => {
		cleanup = loading(element, true)
		expect(element.getAttribute('aria-busy')).toBe('true')
		expect((element as HTMLButtonElement).disabled).toBe(true)

		cleanup?.()
		cleanup = undefined

		expect(element.hasAttribute('aria-busy')).toBe(false)
		expect(element.classList.contains('pounce-loading')).toBe(false)
		expect((element as HTMLButtonElement).disabled).toBe(false)
	})

	it('should handle non-HTMLElement target', () => {
		const textNode = document.createTextNode('text')
		const result = loading(textNode, true)
		expect(result).toBeUndefined()
	})

	it('should handle array target', () => {
		cleanup = loading([element], true)
		expect(element.getAttribute('aria-busy')).toBe('true')
	})
})
