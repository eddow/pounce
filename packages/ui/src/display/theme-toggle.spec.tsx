import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { DisplayProvider } from './display-context'
import { ThemeToggle } from './theme-toggle'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'

describe('ThemeToggle', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		installTestAdapter()
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders inside a DisplayProvider', () => {
		render(
			<DisplayProvider theme="light">
				<ThemeToggle />
			</DisplayProvider>
		)
		const toggle = container.querySelector('.pounce-theme-toggle')
		expect(toggle).toBeTruthy()
	})

	it('renders main toggle button', () => {
		render(
			<DisplayProvider theme="light">
				<ThemeToggle />
			</DisplayProvider>
		)
		const main = container.querySelector('.pounce-theme-toggle-main')
		expect(main).toBeTruthy()
		expect(main?.getAttribute('type')).toBe('button')
	})

	it('renders dropdown button when not simple', () => {
		render(
			<DisplayProvider theme="light">
				<ThemeToggle />
			</DisplayProvider>
		)
		const dropdown = container.querySelector('.pounce-theme-toggle-dropdown')
		expect(dropdown).toBeTruthy()
	})

	it('hides dropdown button when simple=true', () => {
		render(
			<DisplayProvider theme="light">
				<ThemeToggle simple />
			</DisplayProvider>
		)
		const dropdown = container.querySelector('.pounce-theme-toggle-dropdown')
		expect(dropdown).toBeFalsy()
	})

	it('shows auto badge when theme is auto', () => {
		render(
			<DisplayProvider theme="auto">
				<ThemeToggle />
			</DisplayProvider>
		)
		const badge = container.querySelector('.pounce-theme-toggle-auto-badge')
		expect(badge).toBeTruthy()
		expect(badge?.textContent).toBe('A')
	})

	it('hides auto badge when theme is explicit', () => {
		render(
			<DisplayProvider theme="dark">
				<ThemeToggle />
			</DisplayProvider>
		)
		const badge = container.querySelector('.pounce-theme-toggle-auto-badge')
		expect(badge).toBeFalsy()
	})

	it('toggles theme on main button click', () => {
		const changes: string[] = []
		render(
			<DisplayProvider theme="light" onThemeChange={(t) => changes.push(t)}>
				<ThemeToggle />
			</DisplayProvider>
		)
		const main = container.querySelector('.pounce-theme-toggle-main') as HTMLButtonElement
		main.click()
		expect(changes).toEqual(['dark'])
	})

	it('toggles from dark to light', () => {
		const changes: string[] = []
		render(
			<DisplayProvider theme="dark" onThemeChange={(t) => changes.push(t)}>
				<ThemeToggle />
			</DisplayProvider>
		)
		const main = container.querySelector('.pounce-theme-toggle-main') as HTMLButtonElement
		main.click()
		expect(changes).toEqual(['light'])
	})

	it('has accessible aria-label on main button', () => {
		render(
			<DisplayProvider theme="dark">
				<ThemeToggle />
			</DisplayProvider>
		)
		const main = container.querySelector('.pounce-theme-toggle-main')
		const label = main?.getAttribute('aria-label')
		expect(label).toBe('Dark')
	})

	it('shows auto label when theme is auto', () => {
		render(
			<DisplayProvider theme="auto">
				<ThemeToggle />
			</DisplayProvider>
		)
		const main = container.querySelector('.pounce-theme-toggle-main')
		const label = main?.getAttribute('aria-label')
		// Auto resolves to light in test env (prefersDark returns false)
		expect(label).toContain('Auto')
		expect(label).toContain('Light')
	})

	it('passes el props through', () => {
		render(
			<DisplayProvider theme="light">
				<ThemeToggle el={{ id: 'my-toggle' }} />
			</DisplayProvider>
		)
		const toggle = container.querySelector('#my-toggle')
		expect(toggle).toBeTruthy()
	})
})
