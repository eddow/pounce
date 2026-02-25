import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { reactive } from 'mutts'

describe('Lifecycle Tracking Propagation', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
	})

	afterEach(() => {
		unmount?.()
		container.remove()
	})

	it('should NOT track reactive dependencies accessed in lifecycle hooks', () => {
		const state = reactive({ count: 0 })
		let renderCount = 0

		const Comp = () => {
			renderCount++
			const onMount = (_el: HTMLElement) => {
				// Reading reactive state here should NOT cause the component to depend on it
				const _v = state.count
			}
			return <div use={onMount}>Static Content</div>
		}

		unmount = latch(container, <Comp />)

		expect(renderCount).toBe(1)

		// Incrementing count should NOT trigger a re-render because it was only read in untracked onMount
		state.count++
		expect(renderCount).toBe(1)
	})

	it('should NOT cause infinite loop if state is changed in a microtask after mount access', async () => {
		const state = reactive({ count: 0 })
		let renderCount = 0

		const Comp = () => {
			renderCount++
			const onMount = (_el: HTMLElement) => {
				// Reading state
				const current = state.count
				// Writing state in next tick (similar to dockview initialization)
				queueMicrotask(() => {
					state.count = current + 1
				})
			}
			return <div use={onMount}>Stable UI</div>
		}

		unmount = latch(container, <Comp />)

		// Wait for microtasks
		await new Promise(r => setTimeout(r, 10))

		// If it tracks the read in onMount, the write in microtask will trigger a REBUILD.
		// If it doesn't track, it stays at 1.
		// Currently (without fix), it might rebuild.
		expect(renderCount).toBe(1)
	})
})
