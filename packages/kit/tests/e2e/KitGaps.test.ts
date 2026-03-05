import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	page.on('console', (msg) => {
		const type = msg.type()
		if (type === 'error' || type === 'warning' || type === 'log') {
			console.log(`BROWSER [${type}]:`, msg.text())
		}
	})
})

test.describe('Kit Feature Gaps', () => {
	test('Reactive storage (stored) persistence and reactivity', async ({ page }) => {
		// Clear persisted state from previous runs
		await page.goto('/storage')
		await page.evaluate(() => localStorage.clear())
		await page.reload()
		await page.waitForSelector('[data-testid="storage-view"]')

		const theme = page.locator('[data-testid="storage-theme"]')
		const count = page.locator('[data-testid="storage-count"]')

		await expect(theme).toHaveText('light')
		await expect(count).toHaveText('0')

		await page.click('[data-action="toggle-theme"]')
		await expect(theme).toHaveText('dark')

		await page.click('[data-action="inc-count"]')
		await expect(count).toHaveText('1')

		// Reload and check persistence
		await page.reload()
		await page.waitForSelector('[data-testid="storage-view"]')
		await expect(theme).toHaveText('dark')
		await expect(count).toHaveText('1')
	})

	test('Intl components (Number, Date, Plural)', async ({ page }) => {
		await page.goto('/intl')
		await page.waitForSelector('[data-testid="intl-view"]')

		await expect(page.locator('[data-testid="intl-number"]')).toContainText('$1,234.56')
		await expect(page.locator('[data-testid="intl-date"]')).toContainText('Feb 25, 2024')
		await expect(page.locator('[data-testid="intl-plural"]')).toHaveText('0 items')

		await page.click('[data-action="inc-count"]')
		await expect(page.locator('[data-testid="intl-plural"]')).toHaveText('1 item')

		await page.click('[data-action="inc-count"]')
		await expect(page.locator('[data-testid="intl-plural"]')).toHaveText('2 items')
	})

	test('Resource stays connected after multiple ID changes', async ({ page }) => {
		// Mock jsonplaceholder at the browser level
		await page.route('**/jsonplaceholder.typicode.com/posts/*', async (route) => {
			const url = new URL(route.request().url())
			const id = url.pathname.split('/').pop()
			await route.fulfill({
				contentType: 'application/json',
				body: JSON.stringify({ id: Number(id), title: `Post title ${id}`, body: `Body ${id}`, userId: 1 }),
			})
		})

		await page.goto('/api')
		await page.waitForSelector('[data-testid="api-view"]')

		// Wait for initial post load (id=1)
		await expect(page.locator('[data-testid="api-post-title"]')).toContainText('Post title 1')

		// First change: id 1 → 2
		await page.click('[data-action="next-post"]')
		await expect(page.locator('[data-testid="api-post-id"]')).toHaveText('2')
		await expect(page.locator('[data-testid="api-post-title"]')).toContainText('Post title 2')

		// Second change: id 2 → 3
		await page.click('[data-action="next-post"]')
		await expect(page.locator('[data-testid="api-post-id"]')).toHaveText('3')
		await expect(page.locator('[data-testid="api-post-title"]')).toContainText('Post title 3')
	})
})
