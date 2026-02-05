/**
 * Test Menu component functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Menu } from '../../src/components/menu'
import { setAdapter, resetAdapter } from '../../src/adapter/registry'

describe('Menu', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with summary and children', () => {
		render(
			<Menu summary="Options">
				<ul role="menu">
					<li role="none">
						<a href="#" role="menuitem">
							Item 1
						</a>
					</li>
				</ul>
			</Menu>
		)
		const details = container.querySelector('details')
		const summary = container.querySelector('summary')
		expect(details).toBeTruthy()
		expect(summary?.textContent).toContain('Options')
	})

	it('applies dropdown class by default', () => {
		render(<Menu summary="Menu">Content</Menu>)
		const details = container.querySelector('details')
		expect(details?.classList.contains('dropdown')).toBe(true)
	})

	it('applies custom class when provided', () => {
		render(<Menu summary="Menu" class="custom-menu">Content</Menu>)
		const details = container.querySelector('details')
		expect(details?.classList.contains('custom-menu')).toBe(true)
	})

	it('sets aria-haspopup on summary', () => {
		render(<Menu summary="Menu">Content</Menu>)
		const summary = container.querySelector('summary')
		expect(summary?.getAttribute('aria-haspopup')).toBe('menu')
	})

	it('has click handler on details element', () => {
		render(
			<Menu summary="Menu">
				<ul role="menu">
					<li role="none">
						<a href="#test" role="menuitem">
							Link
						</a>
					</li>
				</ul>
			</Menu>
		)
		const details = container.querySelector('details') as HTMLDetailsElement
		expect(details).toBeTruthy()
	})

	it('respects adapter overrides for dropdown class', () => {
		setAdapter({
			components: {
				Menu: {
					classes: {
						dropdown: 'custom-dropdown',
					},
				},
			},
		})

		render(<Menu summary="Menu">Content</Menu>)
		const details = container.querySelector('details')
		expect(details?.classList.contains('custom-dropdown')).toBe(true)
	})
})

describe('Menu.Bar', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default brand', () => {
		render(<Menu.Bar items={[]} />)
		const strong = container.querySelector('strong')
		expect(strong?.textContent).toBe('Pounce UI')
	})

	it('renders with custom brand', () => {
		render(<Menu.Bar brand="My App" items={[]} />)
		const strong = container.querySelector('strong')
		expect(strong?.textContent).toBe('My App')
	})

	it('renders mobile and desktop menu bars', () => {
		render(<Menu.Bar items={[]} />)
		const mobile = container.querySelector('.pounce-menu-bar-mobile')
		const desktop = container.querySelector('.pounce-menu-bar-desktop')
		expect(mobile).toBeTruthy()
		expect(desktop).toBeTruthy()
	})

	it('renders trailing content', () => {
		render(<Menu.Bar items={[]} trailing={<button>Login</button>} />)
		const button = container.querySelector('button')
		expect(button?.textContent).toBe('Login')
	})

	it('respects adapter overrides for bar classes', () => {
		setAdapter({
			components: {
				Menu: {
					classes: {
						barMobile: 'custom-mobile',
						barDesktop: 'custom-desktop',
						dropdown: 'custom-dropdown',
					},
				},
			},
		})

		render(<Menu.Bar items={[]} />)
		const mobile = container.querySelector('.custom-mobile')
		const desktop = container.querySelector('.custom-desktop')
		expect(mobile).toBeTruthy()
		expect(desktop).toBeTruthy()
	})
})
