import { test, expect } from '@playwright/test'

test.describe('For component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#For')
		await page.waitForSelector('#tests [data-testid="child-list"]')
	})

	test('initial render displays 3 items', async ({ page }) => {
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		await expect(items).toHaveCount(3)
		await expect(items.nth(0)).toHaveText('alpha')
		await expect(items.nth(1)).toHaveText('beta')
		await expect(items.nth(2)).toHaveText('gamma')
	})

	test('adding items to start', async ({ page }) => {
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		
		await page.click('[data-action="add-start"]')
		await expect(items).toHaveCount(4)
		await expect(items.nth(0)).toHaveAttribute('data-node-id', '4')
		
		await page.click('[data-action="add-start"]')
		await expect(items).toHaveCount(5)
		await expect(items.nth(0)).toHaveAttribute('data-node-id', '5')
	})

	test('adding items to end', async ({ page }) => {
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		
		await page.click('[data-action="add-end"]')
		await expect(items).toHaveCount(4)
		await expect(items.nth(3)).toHaveAttribute('data-node-id', '4')
		
		await page.click('[data-action="add-end"]')
		await expect(items).toHaveCount(5)
		await expect(items.nth(4)).toHaveAttribute('data-node-id', '5')
	})

	test('removing first item', async ({ page }) => {
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		
		await page.click('[data-action="remove-first"]')
		await expect(items).toHaveCount(2)
		await expect(items.nth(0)).toHaveText('beta')
		await expect(items.nth(1)).toHaveText('gamma')
	})

	test('removing last item', async ({ page }) => {
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		
		await page.click('[data-action="remove-last"]')
		await expect(items).toHaveCount(2)
		await expect(items.nth(0)).toHaveText('alpha')
		await expect(items.nth(1)).toHaveText('beta')
	})

	test('reset restores initial state', async ({ page }) => {
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		
		// Add some items
		await page.click('[data-action="add-start"]')
		await page.click('[data-action="add-end"]')
		await expect(items).toHaveCount(5)
		
		// Reset
		await page.click('[data-action="reset"]')
		await expect(items).toHaveCount(3)
		await expect(items.nth(0)).toHaveText('alpha')
		await expect(items.nth(1)).toHaveText('beta')
		await expect(items.nth(2)).toHaveText('gamma')
	})

	test('rendering events are captured', async ({ page }) => {
		// Reset events
		await page.evaluate(() => window.__pounceEvents?.reset())
		
		const list = page.locator('[data-testid="child-list"]')
		const items = list.locator('li')
		await expect(items).toHaveCount(3)
		
		// Add item and check events
		await page.click('[data-action="add-start"]')
		
		const events = await page.evaluate(() => window.__pounceEvents?.renderingEvents || [])
		const eventTypes = events.map(e => e.event)
		
		// Should have reconciliation events
		expect(eventTypes.some(e => e.includes('reconcileChildren'))).toBeTruthy()
	})
})
