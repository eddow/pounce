import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Env, type EnvSettings } from '@pounce/kit/env'
import { reactive } from 'mutts'
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

	const makeSettings = (overrides: EnvSettings = {}): EnvSettings =>
		reactive<EnvSettings>({ theme: 'auto', ...overrides })

	it('renders inside an Env', () => {
		const settings = makeSettings({ theme: 'light' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const toggle = container.querySelector('.pounce-theme-toggle')
		expect(toggle).toBeTruthy()
	})

	it('renders main toggle button', () => {
		const settings = makeSettings({ theme: 'light' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const main = container.querySelector('.pounce-theme-toggle-main')
		expect(main).toBeTruthy()
		expect(main?.getAttribute('type')).toBe('button')
	})

	it('renders dropdown button when not simple', () => {
		const settings = makeSettings({ theme: 'light' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const dropdown = container.querySelector('.pounce-theme-toggle-dropdown')
		expect(dropdown).toBeTruthy()
	})

	it('hides dropdown button when simple=true', () => {
		const settings = makeSettings({ theme: 'light' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} simple />
			</Env>
		)
		const dropdown = container.querySelector('.pounce-theme-toggle-dropdown')
		expect(dropdown).toBeFalsy()
	})

	it('shows auto badge when theme is auto', () => {
		const settings = makeSettings({ theme: 'auto' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const badge = container.querySelector('.pounce-theme-toggle-auto-badge')
		expect(badge).toBeTruthy()
		expect(badge?.textContent).toBe('A')
	})

	it('hides auto badge when theme is explicit', () => {
		const settings = makeSettings({ theme: 'dark' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const badge = container.querySelector('.pounce-theme-toggle-auto-badge')
		expect(badge).toBeFalsy()
	})

	it('toggles theme on main button click', () => {
		const settings = makeSettings({ theme: 'light' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const main = container.querySelector('.pounce-theme-toggle-main') as HTMLButtonElement
		main.click()
		// In test env prefersDark is false, so scope.theme resolves to 'light' initially.
		// Clicking toggle should switch to 'dark'.
		expect(settings.theme).toBe('dark')
	})

	it('toggles from dark to light', () => {
		const settings = makeSettings({ theme: 'dark' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const main = container.querySelector('.pounce-theme-toggle-main') as HTMLButtonElement
		main.click()
		expect(settings.theme).toBe('light')
	})

	it('has accessible aria-label on main button', () => {
		const settings = makeSettings({ theme: 'dark' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const main = container.querySelector('.pounce-theme-toggle-main')
		const label = main?.getAttribute('aria-label')
		expect(label).toBe('Dark')
	})

	it('shows auto label when theme is auto', () => {
		const settings = makeSettings({ theme: 'auto' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} />
			</Env>
		)
		const main = container.querySelector('.pounce-theme-toggle-main')
		const label = main?.getAttribute('aria-label')
		// Auto resolves to light in test env (prefersDark returns false)
		expect(label).toContain('Auto')
		expect(label).toContain('Light')
	})

	it('passes el props through', () => {
		const settings = makeSettings({ theme: 'light' })
		render(
			<Env settings={settings}>
				<ThemeToggle settings={settings} el={{ id: 'my-toggle' }} />
			</Env>
		)
		const toggle = container.querySelector('#my-toggle')
		expect(toggle).toBeTruthy()
	})
})
