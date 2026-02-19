import { document, latch } from '@pounce/core'
import { reactive, reset } from 'mutts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// TODO: we shouldn't latch in <head> ! latching override the whole content!! We should make an additive version of latch or make latch always additive - to analyze
describe('latch(document.head, ...) — head injection', () => {
	let originalHeadHTML: string

	beforeEach(() => {
		originalHeadHTML = document.head.innerHTML
	})

	afterEach(() => {
		document.head.innerHTML = originalHeadHTML
		reset()
	})

	it('injects elements into document.head', () => {
		const unlatch = latch(document.head, <link rel="test-inject" href="https://example.com" />)
		expect(document.head.querySelector('link[rel="test-inject"]')).not.toBeNull()
		expect(document.head.querySelector('link[rel="test-inject"]')!.getAttribute('href')).toBe('https://example.com')
		unlatch()
	})

	it('removes injected elements on cleanup', () => {
		const unlatch = latch(document.head, <link rel="canonical" href="https://example.com" />)
		expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull()
		unlatch()
		expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
	})

	it('injects multiple elements via fragment', () => {
		const unlatch = latch(
			document.head,
			<fragment>
				<link rel="multi-a" href="/a" />
				<link rel="multi-b" href="/b" />
			</fragment>
		)
		expect(document.head.querySelector('link[rel="multi-a"]')).not.toBeNull()
		expect(document.head.querySelector('link[rel="multi-b"]')).not.toBeNull()
		unlatch()
		expect(document.head.querySelector('link[rel="multi-a"]')).toBeNull()
		expect(document.head.querySelector('link[rel="multi-b"]')).toBeNull()
	})

	it('supports reactive content', () => {
		const state = reactive({ url: 'https://a.com' })
		const unlatch = latch(document.head, <link rel="reactive-test" href={state.url} />)
		expect(document.head.querySelector('link[rel="reactive-test"]')!.getAttribute('href')).toBe('https://a.com')
		state.url = 'https://b.com'
		expect(document.head.querySelector('link[rel="reactive-test"]')!.getAttribute('href')).toBe('https://b.com')
		unlatch()
	})
})
