/**
 * Test onEffectThrow functionality
 */
import { describe, it, expect } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { effect, onEffectThrow, reactive, project } from 'mutts'

describe('onEffectThrow basic', () => {
	it('should catch errors in effects', () => {
		const container = document.createElement('div')
		const caughtErrors: Error[] = []

		const state = reactive({ shouldThrow: false })

		effect(() => {
			onEffectThrow((error) => {
				caughtErrors.push(error as Error)
				console.log('Caught error:', error)
			})

			if (state.shouldThrow) {
				throw new Error('Test error')
			}
		})

		// Initially no error
		expect(caughtErrors.length).toBe(0)

		// Trigger error
		state.shouldThrow = true

		// Error should be caught
		expect(caughtErrors.length).toBe(1)
		expect(caughtErrors[0].message).toBe('Test error')
	})

	it('should catch errors when children are passed as props (like ErrorBoundary)', () => {
		const caughtErrors: Error[] = []

		// Mimic ErrorBoundary structure
		const ErrorBoundaryLike = (props: { children: () => any }) => {
			onEffectThrow((error) => {
				caughtErrors.push(error as Error)
				console.log('Caught in ErrorBoundaryLike:', error)
			})
			return props.children()
		}

		const ThrowError = () => {
			throw new Error('Child throwing')
		}

		// Render using project.array like pounce does
		const result = project.array([null], () => {
			return ErrorBoundaryLike({ children: () => ThrowError() })
		})

		expect(caughtErrors.length).toBe(1)
		expect(caughtErrors[0].message).toBe('Child throwing')
	})

	it('should catch errors from child components', () => {
		const container = document.createElement('div')
		const caughtErrors: Error[] = []

		const ThrowError = () => {
			throw new Error('Child error')
		}

		effect(() => {
			onEffectThrow((error) => {
				caughtErrors.push(error as Error)
				console.log('Caught child error:', error)
			})

			// Simulate rendering child
			bindApp(<ThrowError />, container)
		})

		expect(caughtErrors.length).toBe(1)
		expect(caughtErrors[0].message).toBe('Child error')
	})

	it('should catch errors in project.array (like pounce components)', () => {
		const caughtErrors: Error[] = []

		// This mimics how pounce/core renders components
		const result = project.array([null], () => {
			onEffectThrow((error) => {
				caughtErrors.push(error as Error)
				console.log('Caught in project.array:', error)
			})

			// Simulate child throwing
			throw new Error('Error in project.array')
		})

		expect(caughtErrors.length).toBe(1)
		expect(caughtErrors[0].message).toBe('Error in project.array')
	})
})
