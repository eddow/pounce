import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { reset } from 'mutts'
import { latch, document } from '@pounce/core'
import { ErrorBoundary, ProductionErrorBoundary } from '../../src/components/error-boundary'

describe('ErrorBoundary', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		reset()
		vi.restoreAllMocks()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	it('renders children when no error occurs', () => {
		render(
			<ErrorBoundary>
				<div class="test-content">Working content</div>
			</ErrorBoundary>
		)

		const boundary = container.querySelector('.pounce-error-boundary')
		expect(boundary).toBeTruthy()
		expect(boundary?.querySelector('.test-content')).toBeTruthy()
		expect(boundary?.textContent).toContain('Working content')
	})

	it('renders default error UI when child throws', () => {
		const ThrowError = () => {
			throw new Error('Test error')
		}

		render(
			<ErrorBoundary>
				<ThrowError />
			</ErrorBoundary>
		)

		const boundary = container.querySelector('.pounce-error-boundary')
		expect(boundary).toBeTruthy()
		expect(boundary?.textContent).toContain('Something went wrong')
		expect(boundary?.querySelector('details')).toBeTruthy()
		expect(boundary?.querySelector('summary')).toBeTruthy()
	})

	it('renders custom fallback when provided', () => {
		const ThrowError = () => {
			throw new Error('Custom error')
		}

		const customFallback = (error: Error) => (
			<div class="custom-error">Custom error: {error.message}</div>
		)

		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError />
			</ErrorBoundary>
		)

		const boundary = container.querySelector('.pounce-error-boundary')
		expect(boundary?.querySelector('.custom-error')).toBeTruthy()
		expect(boundary?.textContent).toContain('Custom error: Custom error')
	})

	it('calls onError callback when error occurs', () => {
		const onError = vi.fn()
		const ThrowError = () => {
			throw new Error('Callback test')
		}

		render(
			<ErrorBoundary onError={onError}>
				<ThrowError />
			</ErrorBoundary>
		)

		expect(onError).toHaveBeenCalledOnce()
		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
		expect(onError.mock.calls[0][0].message).toBe('Callback test')
	})

	it('handles multiple children', () => {
		render(
			<ErrorBoundary>
				<div>Child 1</div>
				<div>Child 2</div>
			</ErrorBoundary>
		)

		const boundary = container.querySelector('.pounce-error-boundary')
		expect(boundary?.textContent).toContain('Child 1')
		expect(boundary?.textContent).toContain('Child 2')
	})
})


describe('ProductionErrorBoundary', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		reset()
		vi.restoreAllMocks()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	it('renders children when no error occurs', () => {
		render(
			<ProductionErrorBoundary>
				<div class="prod-content">OK</div>
			</ProductionErrorBoundary>
		)

		const boundary = container.querySelector('.pounce-error-boundary-prod')
		expect(boundary).toBeTruthy()
		expect(boundary?.querySelector('.prod-content')).toBeTruthy()
	})

	it('renders generic error message when child throws', () => {
		const ThrowError = () => { throw new Error('boom') }

		render(
			<ProductionErrorBoundary>
				<ThrowError />
			</ProductionErrorBoundary>
		)

		const boundary = container.querySelector('.pounce-error-boundary-prod')
		expect(boundary?.textContent).toContain('Something went wrong')
		expect(boundary?.textContent).toContain('refresh the page')
	})
})
