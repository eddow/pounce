/**
 * Test Overlays Coordination (WithOverlays, Dialog, Drawer, Toast, Focus Trap)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bindApp, document, type Scope } from '@pounce/core'
import { WithOverlays } from '../../src/overlays/with-overlays'
import { StandardOverlays } from '../../src/overlays/standard-overlays'
import { Dialog } from '../../src/overlays/dialog'
import { Drawer } from '../../src/overlays/drawer'
import { Toast } from '../../src/overlays/toast'
import { installTestAdapter, resetAdapter } from '../test-adapter'

describe('Overlays System', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		installTestAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		if (unmount) unmount()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	const tick = () => new Promise(r => setTimeout(r, 0))

	it('StandardOverlays injects dialog and toast into scope', async () => {
		let capturedScope: Scope | undefined
		const App = (_props: any, scope: Scope) => {
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
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Dialog.show('Hello'))
			await tick()

			const dialog = document.querySelector('.test-dialog')
			expect(dialog).toBeTruthy()
			expect(dialog?.textContent).toContain('Hello')
		})

		it('dismisses overlay on backdrop click if dismissible', async () => {
			vi.useFakeTimers()
			let push: any
			const App = (_props: any, scope: Scope) => {
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
			// Advance past transition fallback timeout (duration * 1.5)
			vi.advanceTimersByTime(500)
			expect(document.querySelector('.test-dialog')).toBeFalsy()
			vi.useRealTimers()
		})

		it('does NOT dismiss overlay on backdrop click if NOT dismissible', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Dialog.show({ message: 'Hello', dismissible: false }))
			await tick()

			const backdrop = document.querySelector('.pounce-backdrop') as HTMLElement
			backdrop.click()

			expect(document.querySelector('.test-dialog')).toBeTruthy()
		})

		it('handles Escape key orchestration', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
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

			const Inner = (_props: any, scope: Scope) => {
				level2 = scope.overlayLevel
				return <div>Inner</div>
			}

			const App = (_props: any, scope: Scope) => {
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
			expect(managers.length).toBe(2)
			// Inner (level 2) renders first in DOM: fragment outputs children before overlay-manager div
			expect(managers[0].id).toBe('pounce-overlay-manager-2')
			expect(managers[1].id).toBe('pounce-overlay-manager-1')
		})
	})

	describe('Toast', () => {
		it('renders toast with message', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Toast.show('Notification'))
			await tick()

			const toast = document.querySelector('.test-toast')
			expect(toast).toBeTruthy()
			expect(toast?.textContent).toContain('Notification')
		})

		it('applies variant trait from adapter', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Toast.show({ message: 'Success!', variant: 'success' }))
			await tick()

			const toast = document.querySelector('.test-toast')
			expect(toast).toBeTruthy()
			expect(toast?.getAttribute('data-variant')).toBe('success')
		})
	})

	describe('Drawer', () => {
		it('renders drawer with title and body', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Drawer.show({ title: 'Settings', children: <p>Content</p> }))
			await tick()

			const drawer = document.querySelector('.test-drawer')
			expect(drawer).toBeTruthy()
			expect(drawer?.textContent).toContain('Settings')
			expect(drawer?.textContent).toContain('Content')
		})

		it('renders drawer-right with correct class', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Drawer.show({ children: <p>Right</p>, side: 'right' }))
			await tick()

			const drawer = document.querySelector('.pounce-drawer-right')
			expect(drawer).toBeTruthy()
		})

		it('conditionally renders footer', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Drawer.show({ children: <p>Body</p>, footer: <button>Save</button> }))
			await tick()

			const footer = document.querySelector('.pounce-drawer-footer')
			expect(footer).toBeTruthy()
			expect(footer?.textContent).toContain('Save')
		})
	})

	describe('Layered Rendering', () => {
		it('renders overlays in correct layers with StandardOverlays', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<StandardOverlays>
					<App />
				</StandardOverlays>
			)

			push(Dialog.show('Modal'))
			push(Toast.show('Toast'))
			await tick()

			const modalLayer = document.querySelector('.pounce-mode-modal')
			const toastLayer = document.querySelector('.pounce-mode-toast')
			expect(modalLayer).toBeTruthy()
			expect(toastLayer).toBeTruthy()
			expect(modalLayer?.querySelector('.test-dialog')).toBeTruthy()
			expect(toastLayer?.querySelector('.test-toast')).toBeTruthy()
		})
	})

	describe('Dialog Features', () => {
		it('resolves with button key when clicked', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			const promise = push(Dialog.show({
				message: 'Confirm?',
				buttons: { cancel: 'Cancel', ok: 'OK' }
			}))
			await tick()

			// Find the OK button and click it
			const buttons = document.querySelectorAll('.test-dialog footer button')
			const okButton = Array.from(buttons).find(b => b.textContent?.includes('OK'))
			expect(okButton).toBeTruthy()
			;(okButton as HTMLElement).click()

			const result = await promise
			expect(result).toBe('ok')
		})

		it('applies size class', async () => {
			let push: any
			const App = (_props: any, scope: Scope) => {
				push = scope.overlay
				return <div>App</div>
			}

			render(
				<WithOverlays>
					<App />
				</WithOverlays>
			)

			push(Dialog.show({ message: 'Small', size: 'sm' }))
			await tick()

			const dialog = document.querySelector('.test-dialog.pounce-size-sm')
			expect(dialog).toBeTruthy()
		})
	})
})
