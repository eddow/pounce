import { document, latch } from '@pounce/core'
import { reactive, reset } from 'mutts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Head, useHead } from '../head'
import { setPlatform } from '../platform/shared'
import { createTestAdapter } from '../platform/test'

describe('head manager', () => {
	let originalHeadHTML: string
	let originalBodyHTML: string

	beforeEach(() => {
		originalHeadHTML = document.head.innerHTML
		originalBodyHTML = document.body.innerHTML
		setPlatform(createTestAdapter())
	})

	afterEach(() => {
		document.head.innerHTML = originalHeadHTML
		document.body.innerHTML = originalBodyHTML
		reset()
	})

	it('mounts Head content into document.head and cleans it up', () => {
		const unlatch = latch(
			document.body,
			<fragment>
				<Head>
					<link rel="test-inject" href="https://example.com" />
				</Head>
				<div data-testid="page">page</div>
			</fragment>
		)
		expect(document.head.querySelector('link[rel="test-inject"]')).not.toBeNull()
		expect(document.head.querySelector('link[rel="test-inject"]')!.getAttribute('href')).toBe(
			'https://example.com'
		)
		expect(document.body.querySelector('[data-testid="page"]')?.textContent).toBe('page')
		unlatch()
		expect(document.head.querySelector('link[rel="test-inject"]')).toBeNull()
	})

	it('adds multiple head entries without replacing existing ones', () => {
		const unlatch = latch(
			document.body,
			<fragment>
				<Head>
					<link rel="canonical" href="https://example.com" />
				</Head>
				<Head>
					<title>kit</title>
				</Head>
			</fragment>
		)
		expect(document.head.querySelector('link[rel="canonical"]')).not.toBeNull()
		expect(document.head.querySelector('title')?.textContent).toBe('kit')
		unlatch()
		expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
		expect(document.head.querySelector('title')).toBeNull()
	})

	it('updates reactive head content through Head', () => {
		const state = reactive({ url: 'https://a.com' })
		const unlatch = latch(
			document.body,
			<Head>
				<link rel="reactive-test" href={state.url} />
			</Head>
		)
		expect(document.head.querySelector('link[rel="reactive-test"]')!.getAttribute('href')).toBe(
			'https://a.com'
		)
		state.url = 'https://b.com'
		expect(document.head.querySelector('link[rel="reactive-test"]')!.getAttribute('href')).toBe(
			'https://b.com'
		)
		unlatch()
	})

	it('supports imperative useHead cleanup', () => {
		const stop = useHead(<link rel="imperative-head" href="https://example.com" />)
		expect(document.head.querySelector('link[rel="imperative-head"]')).not.toBeNull()
		stop()
		expect(document.head.querySelector('link[rel="imperative-head"]')).toBeNull()
	})
})
