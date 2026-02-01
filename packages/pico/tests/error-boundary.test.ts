import { test, expect } from '@playwright/test'

test.describe('ErrorBoundary', () => {
	test('should catch and display errors in development', async ({ page }) => {
		await page.goto('/')
		
		// Navigate to a page that throws
		await page.goto('/debug-error')
		
		// Should show the error boundary fallback
		await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
	})

	test('should handle DarkModeButton errors gracefully', async ({ page }) => {
		await page.goto('/')
		
		// Test theme toggle functionality
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		await expect(darkModeButton).toBeVisible()
		
		// Toggle theme multiple times to test stability
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Should not crash and button should still be visible
		await expect(darkModeButton).toBeVisible()
	})

	test('should handle navigation errors', async ({ page }) => {
		await page.goto('/')
		
		// Try to navigate to invalid routes
		await page.goto('/invalid-route')
		await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible()
		
		// Should still be able to navigate back
		await page.goto('/')
		await expect(page.getByRole('navigation')).toBeVisible()
	})

	test('should handle localStorage errors', async ({ page }) => {
		await page.goto('/')
		
		// Clear localStorage to test error handling
		await page.evaluate(() => {
			localStorage.clear()
		})
		
		// Should still load and theme should work
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		await expect(darkModeButton).toBeVisible()
		
		// Toggle theme to test localStorage error handling
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Should not crash
		await expect(darkModeButton).toBeVisible()
	})

	test('should handle dockview initialization errors', async ({ page }) => {
		await page.goto('/dockview-harsh')
		
		// Should handle dockview initialization gracefully
		await expect(page.getByRole('heading', { level: 1, name: 'Dockview Harsh Tests' })).toBeVisible()
		
		// Test that theme toggle still works even with dockview
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		await expect(darkModeButton).toBeVisible()
		
		await darkModeButton.click()
		await page.waitForTimeout(200)
		
		// Should not crash
		await expect(darkModeButton).toBeVisible()
	})
})

test.describe('Error Recovery', () => {
	test('should recover from state errors', async ({ page }) => {
		await page.goto('/')
		
		// Simulate state corruption by manipulating localStorage
		await page.evaluate(() => {
			localStorage.setItem('theme', 'invalid-theme-data')
		})
		
		// Reload page
		await page.reload()
		
		// Should recover and load normally
		await expect(page.getByRole('navigation')).toBeVisible()
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		await expect(darkModeButton).toBeVisible()
	})

	test('should handle rapid theme switching', async ({ page }) => {
		await page.goto('/')
		
		const darkModeButton = page.getByRole('button', { name: /Toggle dark mode/i })
		
		// Rapidly toggle theme multiple times
		for (let i = 0; i < 10; i++) {
			await darkModeButton.click()
			await page.waitForTimeout(50)
		}
		
		// Should still be functional
		await expect(darkModeButton).toBeVisible()
		
		// Theme should be consistent
		const currentTheme = await page.evaluate(() => document.documentElement.dataset.theme)
		expect(currentTheme).toMatch(/^(light|dark)$/)
	})
})
