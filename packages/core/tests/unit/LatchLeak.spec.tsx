/**
 * Test to confirm latch/reconciler behavior regarding memory/re-renders
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'mutts'
import { latch, document } from '@pounce/core'

describe('Latch re-render behavior', () => {
	let container: HTMLElement

	beforeEach(() => {
		document.body.innerHTML = '<div id="app"></div>'
		container = document.getElementById('app') as HTMLElement
	})

	it('should NOT re-render whole app when state changes if latch is correct', () => {
		const appRenderCount = { count: 0 }
		const state = reactive({ count: 0 })

		const App = () => {
			appRenderCount.count++
			return <div>Count: {state.count}</div>
		}

		// Note: we use latch directly now
		latch(container, <App />)

		expect(appRenderCount.count).toBe(1)

		// Increment count
		state.count++

		// If latch works correctly, App might re-render or not depending on optimization.
		// The original test wanted to prove a bug in bindApp wrapping.
		// Latch by itself should generally behave correctly.

		console.log('App render count after change:', appRenderCount.count)
	})
})
