import { reactive } from 'mutts'
import { describe, expect, it, vi } from 'vitest'
import { type ThemeValue, themeToggleModel } from './theme-toggle'

describe('themeToggleModel', () => {
	it('should report correct currentLabel', () => {
		const settings = reactive({ theme: 'light' as ThemeValue })
		const m = themeToggleModel({ settings, resolvedTheme: 'light' })

		expect(m.currentLabel).toBe('Light')
		expect(m.themeSetting).toBe('light')
		expect(m.isAuto).toBe(false)

		settings.theme = 'auto'
		expect(m.currentLabel).toBe('Auto (Light)')
		expect(m.isAuto).toBe(true)

		settings.theme = 'dark'
		expect(m.currentLabel).toBe('Dark')
	})

	it('toggle() should flip based on resolvedTheme', () => {
		const settings = reactive({ theme: 'auto' as ThemeValue })
		const m = themeToggleModel({ settings, resolvedTheme: 'light' })

		m.toggle()
		expect(settings.theme).toBe('dark')

		// If resolved is dark, toggle to light
		const m2 = themeToggleModel({ settings, resolvedTheme: 'dark' })
		m2.toggle()
		expect(settings.theme).toBe('light')
	})

	it('select() and selectAuto() should update settings and close menu', () => {
		const settings = reactive({ theme: 'light' as ThemeValue })
		const m = themeToggleModel({ settings, resolvedTheme: 'light' })

		m.menuOpen = true
		m.select('dark')
		expect(settings.theme).toBe('dark')
		expect(m.menuOpen).toBe(false)

		m.menuOpen = true
		m.selectAuto()
		expect(settings.theme).toBe('auto')
		expect(m.menuOpen).toBe(false)
	})

	it('should handle custom labels', () => {
		const settings = reactive({ theme: 'light' as ThemeValue })
		const m = themeToggleModel({
			settings,
			resolvedTheme: 'light',
			labels: { light: 'Lumiere', dark: 'Sombre' },
			autoLabel: 'Systeme',
		})

		expect(m.currentLabel).toBe('Lumiere')
		settings.theme = 'auto'
		expect(m.currentLabel).toBe('Systeme (Lumiere)')
	})

	it('clickOutside should close menu', () => {
		const settings = reactive({ theme: 'light' as ThemeValue })
		const m = themeToggleModel({ settings, resolvedTheme: 'light' })
		const el = document.createElement('div')

		const cleanup = m.clickOutside(el)
		m.menuOpen = true

		// Move to "document" click
		const event = new MouseEvent('click', { bubbles: true })
		document.dispatchEvent(event)

		expect(m.menuOpen).toBe(false)
		cleanup()
	})
})
