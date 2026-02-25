/**
 * Test directive re-rendering behavior
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'mutts'
import { latch, document, pounceOptions } from '@pounce/core'

describe('Directive Re-rendering', () => {
	let container: HTMLElement

	beforeEach(() => {
		document.body.innerHTML = '<div id="app"></div>'
		container = document.getElementById('app') as HTMLElement
	})

	it('should re-call directive when its argument changes', () => {
		let callCount = 0
		const state = reactive({ arg: 1 })

		const myDir = (el: HTMLElement, arg: number) => {
			callCount++
			el.setAttribute('data-arg', String(arg))
		}

		const env = reactive({ myDir })

		const App = () => (
			<div use:myDir={state.arg} />
		)

		latch(container, <App />, env)
		expect(callCount).toBe(1)
		expect(container.querySelector('div')?.getAttribute('data-arg')).toBe('1')

		state.arg = 2
		expect(callCount).toBe(2)
		expect(container.querySelector('div')?.getAttribute('data-arg')).toBe('2')
	})

	it('should NOT re-call directive when parent re-renders if JSX is the same (cache hit)', () => {
		let callCount = 0
		const state = reactive({ parentTrigger: 0 })

		const myDir = (el: HTMLElement) => {
			callCount++
			el.setAttribute('data-calls', String(callCount))
		}

		const env = reactive({ myDir })

		const staticChild = <div id="child" use:myDir />

		const App = () => {
			state.parentTrigger // track
			return <div id="parent">{staticChild}</div>
		}

		latch(container, <App />, env)
		expect(callCount).toBe(1)
		const child = document.getElementById('child')
		expect(child?.getAttribute('data-calls')).toBe('1')

		const original = pounceOptions.checkReactivity
		pounceOptions.checkReactivity = 'warn'
		try {
			state.parentTrigger++
			expect(callCount).toBe(1)
		} finally {
			pounceOptions.checkReactivity = original
		}
		expect(document.getElementById('child')?.getAttribute('data-calls')).toBe('1')
	})

	it('should NOT re-render component on bare reactive read (rebuild fence)', () => {
		let callCount = 0
		const state = reactive({ trigger: 0 })

		const myDir = (el: HTMLElement) => {
			callCount++
			el.setAttribute('data-calls', String(callCount))
		}

		const env = reactive({ myDir })

		const Child = () => {
			state.trigger // bare reactive read — rebuild fence should prevent re-rendering
			return <div use:myDir />
		}

		const App = () => <Child />

		latch(container, <App />, env)
		expect(callCount).toBe(1)

		// Rebuild fence prevents re-rendering: directive is NOT re-called
		// When checkReactivity is 'error', this would throw.
		// We can either catch it or temporarily downgrade to 'warn'.
		// Let's test that it DOES NOT throw if we are in 'warn' mode (normal dev behavior)
		const original = pounceOptions.checkReactivity
		pounceOptions.checkReactivity = 'warn'
		try {
			state.trigger++
			expect(callCount).toBe(1)
		} finally {
			pounceOptions.checkReactivity = original
		}
	})
})
