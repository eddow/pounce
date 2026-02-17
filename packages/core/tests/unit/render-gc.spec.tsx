/**
 * Test that render effects are not prematurely garbage-collected.
 * Root effects (no parent) register with FinalizationRegistry — if the cleanup
 * function is not anchored, GC collects it and destroys all child effects
 * (including event listeners).
 *
 * Requires --expose-gc (NODE_OPTIONS='--expose-gc' in package.json test:unit).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'mutts'
import { latch, document } from '@pounce/core'

const gc = typeof globalThis.gc === 'function' ? globalThis.gc : undefined
const itGC = gc ? it : it.skip

function tick(ms = 100) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function collectGarbages() {
	await tick()
	gc?.()
	await tick()
}

describe('Render effect GC safety', () => {
	let container: HTMLElement

	beforeEach(() => {
		document.body.innerHTML = '<div id="app"></div>'
		container = document.getElementById('app') as HTMLElement
	})

	itGC('event handlers survive garbage collection', async () => {
		const state = reactive({ clicks: 0 })

		const App = () => (
			<button onClick={() => { state.clicks++ }}>click</button>
		)

		latch(container, <App />)

		const button = container.querySelector('button')!
		expect(button).toBeTruthy()

		// Events work before GC
		button.click()
		expect(state.clicks).toBe(1)

		// Force GC — if the render effect cleanup is not anchored, this kills event effects
		await collectGarbages()

		// Events must still work after GC
		button.click()
		expect(state.clicks).toBe(2)
	})

	itGC('nested component event handlers survive garbage collection', async () => {
		const state = reactive({ count: 0 })

		const Child = (props: { onClick: () => void }) => (
			<button onClick={props.onClick}>nested</button>
		)

		const App = () => (
			<div>
				<Child onClick={() => { state.count++ }} />
			</div>
		)

		latch(container, <App />)

		const button = container.querySelector('button')!
		button.click()
		expect(state.count).toBe(1)

		await collectGarbages()

		button.click()
		expect(state.count).toBe(2)
	})
})
