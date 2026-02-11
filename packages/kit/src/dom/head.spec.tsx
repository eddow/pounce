import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { reactive, reset } from 'mutts'
import '@pounce/core'
import { setPlatform } from '../platform/shared'
import { createTestAdapter } from '../platform/test'
import { head } from '../platform/shared'

describe('head()', () => {
	let originalHeadHTML: string

	beforeEach(() => {
		setPlatform(createTestAdapter())
		originalHeadHTML = document.head.innerHTML
	})

	afterEach(() => {
		document.head.innerHTML = originalHeadHTML
		reset()
	})

	it('injects elements into document.head', () => {
		const cleanup = head(<link rel="test-inject" href="https://example.com" />)
		expect(document.head.querySelector('link[rel="test-inject"]')).not.toBeNull()
		expect(document.head.querySelector('link[rel="test-inject"]')!.getAttribute('href')).toBe('https://example.com')
		cleanup()
	})

	it('removes injected elements on cleanup', () => {
		const cleanup = head(<link rel="canonical" href="https://example.com" />)
		expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull()
		cleanup()
		expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
	})

	it('injects multiple elements via fragment', () => {
		const cleanup = head(
			<fragment>
				<link rel="multi-a" href="/a" />
				<link rel="multi-b" href="/b" />
			</fragment>
		)
		expect(document.head.querySelector('link[rel="multi-a"]')).not.toBeNull()
		expect(document.head.querySelector('link[rel="multi-b"]')).not.toBeNull()
		cleanup()
		expect(document.head.querySelector('link[rel="multi-a"]')).toBeNull()
		expect(document.head.querySelector('link[rel="multi-b"]')).toBeNull()
	})

	it('supports reactive content', () => {
		const state = reactive({ url: 'https://a.com' })
		const cleanup = head(<link rel="reactive-test" href={state.url} />)
		expect(document.head.querySelector('link[rel="reactive-test"]')!.getAttribute('href')).toBe('https://a.com')
		state.url = 'https://b.com'
		expect(document.head.querySelector('link[rel="reactive-test"]')!.getAttribute('href')).toBe('https://b.com')
		cleanup()
	})
})
