import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { reactive, reset } from 'mutts'

describe('latch()', () => {
	let container: HTMLElement
	let target: HTMLElement
	let unlatch: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		target = document.createElement('div')
		target.id = 'latch-target'
		document.body.appendChild(container)
		document.body.appendChild(target)
	})

	afterEach(() => {
		unlatch?.()
		container.remove()
		target.remove()
		reset()
	})

	it('latches JSX children into a target element (string selector)', () => {
		unlatch = latch('#latch-target', <span class="teleported">hello</span>)
		expect(target.querySelector('.teleported')).not.toBeNull()
		expect(target.querySelector('.teleported')!.textContent).toBe('hello')
	})

	it('latches JSX children into a target element (element ref)', () => {
		unlatch = latch(target, <span class="direct-ref">content</span>)
		expect(target.querySelector('.direct-ref')).not.toBeNull()
	})

	it('cleans up children from target on unlatch', () => {
		unlatch = latch('#latch-target', <span class="cleanup-test">bye</span>)
		expect(target.querySelector('.cleanup-test')).not.toBeNull()
		unlatch!()
		unlatch = undefined
		expect(target.querySelector('.cleanup-test')).toBeNull()
	})

	it('works with reactive content', () => {
		const state = reactive({ text: 'initial' })
		unlatch = latch('#latch-target', <span class="reactive-test">{state.text}</span>)
		expect(target.querySelector('.reactive-test')!.textContent).toBe('initial')
		state.text = 'updated'
		expect(target.querySelector('.reactive-test')!.textContent).toBe('updated')
	})

	it('conditionally renders children with if=', () => {
		const state = reactive({ show: true })
		unlatch = latch(
			'#latch-target',
			[
				<span if={state.show} class="conditional">visible</span>,
			]
		)
		expect(target.querySelector('.conditional')).not.toBeNull()
		state.show = false
		expect(target.querySelector('.conditional')).toBeNull()
	})

	it('warns on conflict when two latches target the same element', () => {
		const warnings: string[] = []
		const originalWarn = console.warn
		console.warn = (...args: unknown[]) => warnings.push(String(args[0]))

		unlatch = latch(target, <span>first</span>)
		const unlatch2 = latch(target, <span>second</span>)

		expect(warnings.length).toBe(1)
		expect(warnings[0]).toContain('latch conflict')

		unlatch2()
		console.warn = originalWarn
	})

	it('latches into document.head (replaces kit head())', () => {
		const originalHeadHTML = document.head.innerHTML
		unlatch = latch(document.head, <link rel="test-latch" href="https://example.com" />)
		expect(document.head.querySelector('link[rel="test-latch"]')).not.toBeNull()
		unlatch!()
		unlatch = undefined
		expect(document.head.querySelector('link[rel="test-latch"]')).toBeNull()
		document.head.innerHTML = originalHeadHTML
	})

	it('supports reactive head content', () => {
		const originalHeadHTML = document.head.innerHTML
		const state = reactive({ url: 'https://a.com' })
		unlatch = latch(document.head, <link rel="reactive-head" href={state.url} />)
		expect(document.head.querySelector('link[rel="reactive-head"]')!.getAttribute('href')).toBe('https://a.com')
		state.url = 'https://b.com'
		expect(document.head.querySelector('link[rel="reactive-head"]')!.getAttribute('href')).toBe('https://b.com')
		unlatch!()
		unlatch = undefined
		document.head.innerHTML = originalHeadHTML
	})
})
