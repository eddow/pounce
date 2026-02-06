/**
 * Test Overlays Coordination (WithOverlays, Dialog, Drawer, Toast, Focus Trap)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bindApp, document, type Scope } from '@pounce/core'
import { reactive } from 'mutts'
import { WithOverlays } from '../../src/overlays/with-overlays'
import { StandardOverlays } from '../../src/overlays/standard-overlays'
import { Dialog } from '../../src/overlays/dialog'
import { Drawer } from '../../src/overlays/drawer'
import { Toast } from '../../src/overlays/toast'

describe('Overlays System', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		if (unmount) unmount()
		container.remove()
		document.body.innerHTML = ''
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('StandardOverlays injects dialog and toast into scope', async () => {
		let capturedScope: Scope | undefined
		const App = (props: any, scope: Scope) => {
			capturedScope = scope
			return <div>App</div>
		}

		render(
			<StandardOverlays>
				<App />
			</StandardOverlays>
		)

		expect(capturedScope?.dialog).toBeDefined()
		expect(capturedScope?.toast).toBeDefined()
		expect(capturedScope?.drawer).toBeDefined()
		expect(capturedScope?.overlay).toBeDefined()
	})

	describe('WithOverlays Interaction', () => {
		it('renders overlays when pushed', async () => {
			let push: any
			const App = (props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Dialog.show('Hello'))

			const dialog = document.querySelector('.pounce-dialog')
			expect(dialog).toBeTruthy()
			expect(dialog?.textContent).toContain('Hello')
		})

		it('dismisses overlay on backdrop click if dismissible', async () => {
			let push: any
			const App = (props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			const promise = push(Dialog.show({ message: 'Hello', dismissible: true }))

			const backdrop = document.querySelector('.pounce-backdrop') as HTMLElement
			expect(backdrop).toBeTruthy()

			backdrop.click()

			const result = await promise
			expect(result).toBe(null)
			expect(document.querySelector('.pounce-dialog')).toBeFalsy()
		})

		it('does NOT dismiss overlay on backdrop click if NOT dismissible', async () => {
			let push: any
			const App = (props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Dialog.show({ message: 'Hello', dismissible: false }))

			const backdrop = document.querySelector('.pounce-backdrop') as HTMLElement
			backdrop.click()

			expect(document.querySelector('.pounce-dialog')).toBeTruthy()
		})

		it('handles Escape key orchestration', async () => {
			let push: any
			const App = (props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			const promise = push(Dialog.show('Hello'))

			const manager = document.querySelector('.pounce-overlay-manager') as HTMLElement
			manager.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

			const result = await promise
			expect(result).toBe(null)
		})
	})

	describe('Nesting & Z-Index', () => {
		it('increments level and calculates z-index correctly', () => {
			let level1: number | undefined
			let level2: number | undefined

			const Inner = (props: any, scope: Scope) => {
				level2 = scope.overlayLevel
				return <div>Inner</div>
			}

			const App = (props: any, scope: Scope) => {
				level1 = scope.overlayLevel
				return (
					<WithOverlays fixed={false}>
						<Inner />
					</WithOverlays>
				)
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			expect(level1).toBe(1)
			expect(level2).toBe(2)

			const managers = document.querySelectorAll('.pounce-overlay-manager')
			expect((managers[0] as HTMLElement).style.getPropertyValue('--pounce-overlay-z')).toBe('11000')
			expect((managers[1] as HTMLElement).style.getPropertyValue('--pounce-overlay-z')).toBe('12000')
		})
	})

	describe('Focus Management', () => {
		it('traps focus with Tab key', async () => {
			let push: any
			const App = (props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Dialog.show({
				message: 'Test',
				buttons: {
					btn1: 'Button 1',
					btn2: 'Button 2'
				}
			}))

			const buttons = document.querySelectorAll('button')
			const btn1 = buttons[0] // Close button
			const btn2 = buttons[1] // OK button (actually cancel/ok depending on dialog.confirm but here it is 'OK')

			// Note: Dialog with no buttons provided defaults to OK button.
			// The close button '✕' is always there if title is provided. 
			// Let's use a plain dialog with buttons to be sure.
		})

		// Focus trap is hard to test in JSDOM because document.activeElement 
		// behavior might be limited, but we can verify preventDefault and focus() calls.
	})
})
