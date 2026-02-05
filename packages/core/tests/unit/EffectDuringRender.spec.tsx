/**
 * Test effect-during-render bug reproduction
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { reactive, onEffectTrigger } from 'mutts'
import { bindApp, type Scope, document } from '@pounce/core'

describe('Effect during render bug', () => {
	let container: HTMLElement

	beforeEach(() => {
		document.body.innerHTML = '<div id="app"></div>'
		container = document.getElementById('app') as HTMLElement
	})

	it('should NOT re-render parent when child modifies shared state', () => {
		const parentRenderCount = { count: 0 }
		const childRenderCount = { count: 0 }

		// Shared state at module level (like in mini.tsx)
		const state = reactive({
			count: 0,
		})

		// Child component
		function ChildCounter(_props: any, _scope: Scope) {
			childRenderCount.count++
			return (
				<button class="add" onClick={() => state.count++}>Increment</button>
			)
		}

		// Parent with PROBLEMATIC pattern: direct reactive read in template
		const ParentApp = () => {
			parentRenderCount.count++
			console.log('Parent rendered:', parentRenderCount.count)
			return (
				<>
					<div>Count: <span>{state.count}</span></div>
					<ChildCounter />
				</>
			)
		}

		// Initial render
		bindApp(<ParentApp />, container)
		expect(parentRenderCount.count).toBe(1)
		expect(childRenderCount.count).toBe(1)

		// Simulate click - find add button and click
		const addButton = container.querySelector('button.add') as HTMLButtonElement
		expect(addButton).toBeTruthy()

		// Click should NOT cause parent to re-render
		addButton.click()

		// After click, child adds to list
		// Check if state actually changed
		console.log('state.count after click:', state.count)

		// Problem: if parent read state.list.join() during render, it will re-render!
		console.log('After click - parent renders:', parentRenderCount.count)
		console.log('After click - child renders:', childRenderCount.count)

		// This is what we EXPECT (no re-render)
		// But the bug causes parentRenderCount to be 2
		expect(parentRenderCount.count).toBe(1) // Should still be 1
	})

	it('detects effect inside render with onEffectTrigger', () => {
		const effectsDuringRender: string[] = []

		const state = reactive({
			count: 0,
		})

		const TestComponent = () => {
			onEffectTrigger((_obj, evolution, prop) => {
				effectsDuringRender.push(`${String(prop)}: ${evolution}`)
			})

			// This reads state.count during render - should trigger onEffectTrigger!
			return <div>Count: {state.count}</div>
		}

		bindApp(<TestComponent />, container)

		// If onEffectTrigger caught the reactive read during render, it would have logged it
		console.log('Effects detected during render:', effectsDuringRender)
	})
})
