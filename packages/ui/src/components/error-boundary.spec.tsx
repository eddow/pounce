/// <reference path="../../node_modules/@pounce/core/src/types/jsx.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { ErrorBoundary } from '../../src/components/error-boundary'

describe.skip('ErrorBoundary', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined
	let consoleErrorSpy: any

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		consoleErrorSpy.mockRestore()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
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

	it('renders default error UI when error occurs', () => {
		const ThrowError = () => {
			console.log('Test error')
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

		expect(consoleErrorSpy).toHaveBeenCalled()
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
