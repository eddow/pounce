import { test, expect } from '@playwright/test'

test.describe('Kit Feature Gaps', () => {
	test('Reactive storage (stored) persistence and reactivity', async ({ page }) => {
		await page.goto('/storage')
		await page.waitForSelector('[data-testid="storage-view"]')
		
		const theme = page.locator('[data-testid="storage-theme"]')
		const count = page.locator('[data-testid="storage-count"]')
		
		await expect(theme).toHaveText('light')
		await expect(count).toHaveText('0')
		
		// Update and check
		await page.click('[data-action="toggle-theme"]')
		await expect(theme).toHaveText('dark')
		
		await page.click('[data-action="inc-count"]')
		await expect(count).toHaveText('1')
		
		// Reload and check persistence
		await page.reload()
		await expect(theme).toHaveText('dark')
		await expect(count).toHaveText('1')
	})

	test('Intl components (Number, Date, Plural)', async ({ page }) => {
		await page.goto('/intl')
		await page.waitForSelector('[data-testid="intl-view"]')
		
		// Number formatting (USD)
		await expect(page.locator('[data-testid="intl-number"]')).toContainText('$1,234.56')
		
		// Date formatting (medium)
		await expect(page.locator('[data-testid="intl-date"]')).toContainText('Feb 25, 2024')
		
		// Plural formatting
		await expect(page.locator('[data-testid="intl-plural"]')).toHaveText('0 items')
		
		await page.click('[data-action="inc-count"]')
		await expect(page.locator('[data-testid="intl-plural"]')).toHaveText('1 item')
		
		await page.click('[data-action="inc-count"]')
		await expect(page.locator('[data-testid="intl-plural"]')).toHaveText('2 items')
	})

	test('API client and resource lifecycle', async ({ page }) => {
		await page.goto('/api')
		await page.waitForSelector('[data-testid="api-view"]')
		
		// Wait for data load
		await expect(page.locator('[data-testid="api-user-name"]')).toHaveText('E2E User')
		await expect(page.locator('[data-testid="api-fetch-count"]')).toHaveText('1')
		
		// Refetch
		await page.click('[data-action="refetch"]')
		await expect(page.locator('[data-testid="api-loading"]')).toBeVisible()
		await expect(page.locator('[data-testid="api-user-name"]')).toHaveText('E2E User')
		await expect(page.locator('[data-testid="api-fetch-count"]')).toHaveText('2')
	})
})
