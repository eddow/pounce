import { test, expect } from '@playwright/test'

test.describe('DarkModeButton', () => {
	test('should render with correct initial theme', async ({ page }) => {
		await page.goto('/')
		
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		await expect(darkModeButton).toBeVisible()
		
		// Check initial theme (could be light or dark based on system preference)
		const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme)
		expect(['light', 'dark']).toContain(initialTheme)
	})

	test('should toggle theme when clicked', async ({ page }) => {
		await page.goto('/')
		
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		
		// Get initial theme
		const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme)
		
		// Click to toggle
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Theme should have changed
		const newTheme = await page.evaluate(() => document.documentElement.dataset.theme)
		expect(newTheme).not.toBe(initialTheme)
		expect(['light', 'dark']).toContain(newTheme)
	})

	test('should update button text and icon based on theme', async ({ page }) => {
		await page.goto('/')
		
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		
		// Get initial button content (icon)
		const initialHTML = await darkModeButton.innerHTML()
		
		// Toggle theme
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Icon should have changed (HTML change)
		const newHTML = await darkModeButton.innerHTML()
		expect(newHTML).not.toBe(initialHTML)
	})

	test('should persist theme to localStorage', async ({ page }) => {
		await page.goto('/')
		
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		
		// Toggle to dark mode
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Check localStorage
		const storedTheme = await page.evaluate(() => {
			const val = localStorage.getItem('theme')
			try { return JSON.parse(val || '') } catch { return val }
		})
		expect(storedTheme).toBe('dark')
		
		// Toggle to light mode
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Check localStorage again
		const storedTheme2 = await page.evaluate(() => {
			const val = localStorage.getItem('theme')
			try { return JSON.parse(val || '') } catch { return val }
		})
		expect(storedTheme2).toBe('light')
	})

	test('should respect system preference on first load', async ({ page }) => {
		// Set system preference to dark mode
		await page.emulateMedia({ colorScheme: 'dark' })
		await page.goto('/')
		
		const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme)
		expect(initialTheme).toBe('dark')
		
		// Set system preference to light mode
		await page.emulateMedia({ colorScheme: 'light' })
		await page.goto('/')
		
		const initialTheme2 = await page.evaluate(() => document.documentElement.dataset.theme)
		expect(initialTheme2).toBe('light')
	})

	test('should handle rapid theme changes without errors', async ({ page }) => {
		await page.goto('/')
		
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		
		// Rapidly toggle theme
		for (let i = 0; i < 5; i++) {
			await darkModeButton.click()
			await page.waitForTimeout(100)
		}
		
		// Should still be functional
		await expect(darkModeButton).toBeVisible()
		
		// Theme should be consistent
		const finalTheme = await page.evaluate(() => document.documentElement.dataset.theme)
		expect(['light', 'dark']).toContain(finalTheme)
	})

	test('should work correctly across different routes', async ({ page }) => {
		const routes = ['/', '/display', '/forms', '/dockview']
		
		for (const route of routes) {
			await page.goto(route)
			
			const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
			await expect(darkModeButton).toBeVisible()
			
			// Test toggle works
			const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme)
			await darkModeButton.click()
			await page.waitForTimeout(200)
			
			const newTheme = await page.evaluate(() => document.documentElement.dataset.theme)
			expect(newTheme).not.toBe(initialTheme)
		}
	})
})
