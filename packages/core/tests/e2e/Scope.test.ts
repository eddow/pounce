import { test, expect } from '@playwright/test'

test.describe('Scope component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#Scope')
		await page.waitForSelector('#tests [data-testid="visible-content"]')
	})

	test('initial render shows visible content', async ({ page }) => {
		const visibleContent = page.locator('[data-testid="visible-content"]')
		const visibleText = visibleContent.locator('p.visible')
		const hiddenText = visibleContent.locator('p.hidden')
		
		await expect(visibleText).toBeVisible()
		await expect(hiddenText).toBeHidden()
		await expect(visibleText).toContainText('Content is visible')
	})

	test('toggle visibility', async ({ page }) => {
		const visibleContent = page.locator('[data-testid="visible-content"]')
		const visibleText = visibleContent.locator('p.visible')
		const hiddenText = visibleContent.locator('p.hidden')
		
		// Toggle to hidden
		await page.click('[data-action="toggle"]')
		await expect(visibleText).toBeHidden()
		await expect(hiddenText).toBeVisible()
		
		// Toggle back to visible
		await page.click('[data-action="toggle"]')
		await expect(visibleText).toBeVisible()
		await expect(hiddenText).toBeHidden()
	})

	test('conditional list with items', async ({ page }) => {
		const conditionalList = page.locator('[data-testid="conditional-list"]')
		const hasItems = conditionalList.locator('div.has-items')
		const noItems = conditionalList.locator('div.no-items')
		
		await expect(hasItems).toBeVisible()
		await expect(noItems).toBeHidden()
		
		const listItems = hasItems.locator('ul li')
		await expect(listItems).toHaveCount(3)
	})

	test('count display updates', async ({ page }) => {
		const countDisplay = page.locator('[data-testid="count-display"]')
		const highCount = countDisplay.locator('p.high')
		const lowCount = countDisplay.locator('p.low')
		
		// Initial state: low
		await expect(lowCount).toBeVisible()
		await expect(highCount).toBeHidden()
		await expect(lowCount).toContainText('Count is low: 0')
		
		// Increment to 5
		await page.click('[data-action="increment"]')
		await page.click('[data-action="increment"]')
		await page.click('[data-action="increment"]')
		await page.click('[data-action="increment"]')
		await page.click('[data-action="increment"]')
		
		await expect(lowCount).toBeHidden()
		await expect(highCount).toBeVisible()
		await expect(highCount).toContainText('Count is high: 5')
	})

	test('reset restores initial state', async ({ page }) => {
		// Toggle some state
		await page.click('[data-action="toggle"]')
		await page.click('[data-action="increment"]')
		await page.click('[data-action="increment"]')
		
		// Reset
		await page.click('[data-action="reset"]')
		
		// Verify initial state restored
		const visibleContent = page.locator('[data-testid="visible-content"]')
		await expect(visibleContent.locator('p.visible')).toBeVisible()
		
		const countDisplay = page.locator('[data-testid="count-display"]')
		await expect(countDisplay.locator('p.low')).toContainText('Count is low: 0')
	})

	test('rendering events captured on toggle', async ({ page }) => {
		await page.evaluate(() => window.__pounceEvents?.reset())
		
		const visibleContent = page.locator('[data-testid="visible-content"]')
		await expect(visibleContent.locator('p.visible')).toBeVisible()
		
		await page.click('[data-action="toggle"]')
		
		const events = await page.evaluate(() => window.__pounceEvents?.renderingEvents || [])
		const eventTypes = events.map(e => e.event)
		
		expect(eventTypes.some(e => e.includes('reconcileChildren'))).toBeTruthy()
	})
})
