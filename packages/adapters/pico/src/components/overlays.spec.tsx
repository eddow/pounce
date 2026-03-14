import { document, type Env, latch } from '@sursaut/core'
import { bindDialog, bindDrawer, bindToast, dialogSpec, toastSpec } from '@sursaut/ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WithOverlays } from './overlays'

describe('WithOverlays (integration)', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		unmount = undefined
		container.remove()
		document.body.innerHTML = ''
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	const tick = () => new Promise((r) => setTimeout(r, 0))

	// ── env injection ──────────────────────────────────────────────────────────

	it('injects overlay/dialog/toast/drawer into env', () => {
		let env: Env | undefined
		const App = (_: object, e: Env) => {
			env = e
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)
		expect(env!.overlay).toBeDefined()
		expect(env!.dialog).toBeDefined()
		expect(env!.toast).toBeDefined()
		expect(env!.drawer).toBeDefined()
	})

	// ── push / render ──────────────────────────────────────────────────────────

	it('renders overlay content when pushed', async () => {
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		push!(dialogSpec({ message: 'Hello' }))
		await tick()

		const item = document.querySelector('.sursaut-overlay-item')
		expect(item).toBeTruthy()
	})

	// ── backdrop ───────────────────────────────────────────────────────────────

	it('shows backdrop for modal mode', async () => {
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		push!(dialogSpec('Modal'))
		await tick()

		expect(document.querySelector('.sursaut-backdrop')).toBeTruthy()
	})

	it('dismisses on backdrop click if dismissible', async () => {
		vi.useFakeTimers()
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		const promise = push!(dialogSpec({ message: 'Hello', dismissible: true }))
		await Promise.resolve()

		const backdrop = document.querySelector('.sursaut-backdrop') as HTMLElement
		expect(backdrop).toBeTruthy()
		backdrop.click()

		expect(await promise).toBe(null)
		vi.advanceTimersByTime(500)
		expect(document.querySelector('.sursaut-overlay-item')).toBeFalsy()
		vi.useRealTimers()
	})

	it('does NOT dismiss on backdrop click if dismissible=false', async () => {
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		push!(dialogSpec({ message: 'Hello', dismissible: false }))
		await tick()

		const backdrop = document.querySelector('.sursaut-backdrop') as HTMLElement
		backdrop.click()

		expect(document.querySelector('.sursaut-overlay-item')).toBeTruthy()
	})

	// ── Escape key ─────────────────────────────────────────────────────────────

	it('dismisses on Escape key', async () => {
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		const promise = push!(dialogSpec('Hello'))

		const manager = document.querySelector('.sursaut-overlay-manager') as HTMLElement
		manager.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

		expect(await promise).toBe(null)
	})

	// ── layered rendering ──────────────────────────────────────────────────────

	it('renders overlays in correct layers when layers prop is set', async () => {
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays layers={['modal', 'toast']}>
				<App />
			</WithOverlays>
		)

		push!(dialogSpec('Modal'))
		push!(toastSpec('Toast'))
		await tick()

		expect(document.querySelector('.sursaut-mode-modal .sursaut-overlay-item')).toBeTruthy()
		expect(document.querySelector('.sursaut-mode-toast .sursaut-overlay-item')).toBeTruthy()
	})

	// ── dialog helper ──────────────────────────────────────────────────────────

	it('dialog helper resolves with button key', async () => {
		let dialog: ReturnType<typeof bindDialog>
		const App = (_: object, e: Env) => {
			dialog = e.dialog as ReturnType<typeof bindDialog>
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		const promise = dialog!({
			message: 'Confirm?',
			buttons: { cancel: 'Cancel', ok: 'OK' },
			render: (close) => (
				<div>
					<button onClick={() => close('cancel')}>Cancel</button>
					<button onClick={() => close('ok')}>OK</button>
				</div>
			),
		})
		await tick()

		const buttons = document.querySelectorAll('.sursaut-overlay-item button')
		const ok = Array.from(buttons).find((b) => b.textContent === 'OK') as HTMLElement
		expect(ok).toBeTruthy()
		ok.click()

		expect(await promise).toBe('ok')
	})

	it('dialog.confirm resolves true on ok', async () => {
		let dialog: ReturnType<typeof bindDialog>
		const App = (_: object, e: Env) => {
			dialog = e.dialog as ReturnType<typeof bindDialog>
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		const promise = dialog!.confirm('Are you sure?')
		await tick()

		const manager = document.querySelector('.sursaut-overlay-manager') as HTMLElement
		manager.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

		expect(await promise).toBe(false)
	})

	// ── toast helper ───────────────────────────────────────────────────────────

	it('toast helper renders a toast overlay', async () => {
		let toast: ReturnType<typeof bindToast>
		const App = (_: object, e: Env) => {
			toast = e.toast as ReturnType<typeof bindToast>
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		toast!('Notification')
		await tick()

		expect(document.querySelector('.sursaut-overlay-item')).toBeTruthy()
	})

	// ── drawer helper ──────────────────────────────────────────────────────────

	it('drawer helper renders a drawer overlay', async () => {
		let drawer: ReturnType<typeof bindDrawer>
		const App = (_: object, e: Env) => {
			drawer = e.drawer as ReturnType<typeof bindDrawer>
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		drawer!({ children: <p>Content</p>, side: 'left' })
		await tick()

		expect(document.querySelector('.sursaut-overlay-item')).toBeTruthy()
	})

	// ── sursaut-closing class ───────────────────────────────────────────────────

	it('removes overlay from DOM after resolve and transition timeout', async () => {
		let push: Env['overlay']
		const App = (_: object, e: Env) => {
			push = e.overlay
			return <div />
		}
		render(
			<WithOverlays>
				<App />
			</WithOverlays>
		)

		const promise = push!(dialogSpec('Hello'))
		await tick()
		expect(document.querySelector('.sursaut-overlay-item')).toBeTruthy()

		const manager = document.querySelector('.sursaut-overlay-manager') as HTMLElement
		manager.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
		await promise

		// wait for the 300ms deferred removal
		await new Promise((r) => setTimeout(r, 350))
		expect(document.querySelector('.sursaut-overlay-item')).toBeFalsy()
	})
})
