/**
 * Test directive re-rendering behavior
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'mutts'
import { bindApp, document } from '@pounce/core'

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

		const scope = reactive({ myDir })

		const App = () => (
			<div use:myDir={state.arg} />
		)

		bindApp(<App />, container, scope)
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

		const scope = reactive({ myDir })

		const staticChild = <div id="child" use:myDir />

		const App = () => {
			state.parentTrigger // track
			return <div id="parent">{staticChild}</div>
		}

		bindApp(<App />, container, scope)
		expect(callCount).toBe(1)
		const child = document.getElementById('child')
		expect(child?.getAttribute('data-calls')).toBe('1')

		state.parentTrigger++
		expect(callCount).toBe(1)
		expect(document.getElementById('child')?.getAttribute('data-calls')).toBe('1')
	})

	it('should re-call directive when component re-renders (new JSX element)', () => {
		let callCount = 0
		const state = reactive({ trigger: 0 })

		const myDir = (el: HTMLElement) => {
			callCount++
			el.setAttribute('data-calls', String(callCount))
		}

		const scope = reactive({ myDir })

		const Child = () => {
			state.trigger // track
			return <div use:myDir />
		}

		const App = () => <Child />

		bindApp(<App />, container, scope)
		expect(callCount).toBe(1)

		state.trigger++
		// Child re-renders, returns a NEW div JSX element.
		// Old div is removed, new div is added.
		// Since it's a new JSX element, it's a cache miss in render().
		expect(callCount).toBe(2)
	})
})
