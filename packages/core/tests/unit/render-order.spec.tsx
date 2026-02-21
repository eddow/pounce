/**
 * Test effect topology and error propagation
 */
import { afterEach, describe, expect, it } from 'vitest'
import { effect, morph, caught, reactive, reset } from 'mutts'
import '@pounce/core'

describe('Effect topology and error propagation', () => {
	afterEach(reset)

	it('Basic legacy rendering order test', async () => {
		const logs: string[] = []
		function log(msg: string) {
			logs.push(msg)
			return msg
		}
		const X = () => <div>{log('X')}</div>
		const Y: ComponentFunction = (props) => <div>{log('Y1')}{props.children}{log('Y2')}</div>
		const Z: ComponentFunction = (props) => <div>{log('Z1')}{props.children}{log('Z2')}</div>
		const total = <Z><Y><X /></Y></Z>
		log('t1')
		void total.render()
		log('t2')
		expect(logs).toEqual(['t1', 'Z1', 'Z2', 'Y1', 'Y2', 'X', 't2'])
	})

	it('sibling effects (pounce-style) do NOT propagate errors', () => {
		const state = reactive({ triggerError: false })
		let parentCaught = false
		const logs: string[] = []

		// Simulate pounce rendering: component in one morph, children in another
		const m1 = morph([null], () => {
			logs.push('parent-start')

			caught((_err) => {
				parentCaught = true
				logs.push('parent-caught')
			})

			void state.triggerError
			logs.push('parent-end')
			return 'parent-result'
		})
		void m1[0] // Trigger evaluation

		// Children rendered separately (sibling effect)
		const m2 = morph([null], () => {
			logs.push('child-start')
			if (state.triggerError) {
				throw new Error('Child error')
			}
			logs.push('child-end')
			return 'child-result'
		})
		void m2[0] // Trigger evaluation

		expect(logs).toEqual(['parent-start', 'parent-end', 'child-start', 'child-end'])
		expect(parentCaught).toBe(false)

		// Trigger error
		logs.length = 0
		state.triggerError = true
		void m1[0] // Trigger parent re-evaluation first
		expect(() => {
			void m2[0] // Trigger child re-evaluation
		}).toThrow('Child error')

		// Parent did NOT catch the error (sibling effects)
		expect(parentCaught).toBe(false)
		expect(logs).toEqual(['parent-start', 'parent-end', 'child-start'])
	})

	it('nested effects (mutts-style) DO propagate errors', () => {
		const state = reactive({ triggerError: false })
		let parentCaught = false
		const logs: string[] = []

		effect(() => {
			logs.push('parent-start')

			caught((_err) => {
				parentCaught = true
				logs.push('parent-caught')
			})

			// Child created INSIDE parent effect
			effect(() => {
				logs.push('child-start')
				if (state.triggerError) {
					throw new Error('Child error')
				}
				logs.push('child-end')
			})

			logs.push('parent-end')
		})

		expect(logs).toEqual(['parent-start', 'child-start', 'child-end', 'parent-end'])
		expect(parentCaught).toBe(false)

		// Trigger error
		logs.length = 0
		state.triggerError = true

		// Parent DID catch the error (nested effects)
		expect(parentCaught).toBe(true)
		expect(logs).toContain('parent-caught')
	})

	it('demonstrates children getter evaluation timing', () => {
		const logs: string[] = []

		const Child = () => {
			logs.push('child-evaluated')
			return <div>Child</div>
		}

		const Parent: ComponentFunction = (props) => {
			logs.push('parent-start')
			// Accessing props.children triggers evaluation
			const children = props.children
			logs.push('parent-after-children-access')
			return <div>{children}</div>
		}

		const tree = <Parent><Child /></Parent>
		logs.push('before-render')
		tree.render()
		logs.push('after-render')

		// Children are evaluated when props.children is accessed in parent
		expect(logs).toContain('parent-start')
		expect(logs).toContain('child-evaluated')
		expect(logs).toContain('parent-after-children-access')
	})

	it('ErrorBoundary catches child errors during initial render', () => {
		let parentCaught = false
		const logs: string[] = []

		const ErrorBoundary: ComponentFunction = (props) => {
			logs.push('boundary-start')

			caught((err) => {
				parentCaught = true
				logs.push(`caught: ${err.message}`)
			})

			logs.push('boundary-end')
			return <div>{props.children}</div>
		}

		const ThrowingChild = () => {
			logs.push('child-start')
			throw new Error('Child error')
		}

		const tree = <ErrorBoundary><ThrowingChild /></ErrorBoundary>
		try {
			tree.render()
		} catch {
			// DynamicRenderingError escapes because the child produced no content —
			// fallback rendering is a separate concern
		}

		expect(parentCaught).toBe(true)
		expect(logs).toContain('caught: Child error')
	})
})
