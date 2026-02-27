import { expect, test } from '@playwright/test'

test.describe('Dynamic tag', () => {
	test.beforeEach(async ({ page }) => {
		page.on('console', msg => console.log(`[PAGE] ${msg.text()}`))
		await page.goto('/#Dynamic')
		await page.waitForSelector('#dynamic-test-root', { timeout: 10000 })
	})

	test('should maintain node stability when props change', async ({ page }) => {
		const target = page.locator('#test-target')
		
		// Capture initial marker
		await target.evaluate((el: any) => el.__marker = Math.random())
		const initialMarker = await target.evaluate((el: any) => el.__marker)
		expect(initialMarker).toBeDefined()

		// Change class
		await page.click('#change-class')
		await expect(target).toHaveClass(/red|blue/)
		
		// Change data-count via increment
		await page.click('#increment-count')
		await expect(target).toHaveAttribute('data-count', '1')
		
		// Change children text
		await page.click('#change-text')
		await expect(page.locator('#target-label')).toContainText('Updated Text')

		// Verify node is the same
		const finalMarker = await target.evaluate((el: any) => el.__marker)
		expect(finalMarker).toBe(initialMarker)
	})

	test('should replace node when tag changes', async ({ page }) => {
		const target = page.locator('#test-target')
		
		// Initial tag should be button
		expect(await target.evaluate(el => el.tagName)).toBe('BUTTON')
		await target.evaluate((el: any) => el.__marker = Math.random())

		// Switch tag to div
		await page.click('#toggle-tag')
		// Use auto-retrying assertions to wait for the DOM to update
		await expect(target).toHaveJSProperty('tagName', 'DIV')
		
		// Marker should be different (new node)
		const nextMarker = await target.evaluate((el: any) => el.__marker)
		expect(nextMarker).toBeUndefined()
		
		// Set marker on DIV
		await target.evaluate((el: any) => el.__marker = Math.random())
		
		// Switch tag back to button
		await page.click('#toggle-tag')
		await expect(target).toHaveJSProperty('tagName', 'BUTTON')
		
		const lastMarker = await target.evaluate((el: any) => el.__marker)
		expect(lastMarker).toBeUndefined()
	})

	test('should support two-way reactivity', async ({ page }) => {
		const input = page.locator('#test-input')
		const display = page.locator('#input-display')

		// Initial value
		await expect(input).toHaveValue('Initial Value')
		await expect(display).toHaveText('Initial Value')

		// UI update -> State
		await input.fill('New UI Value')
		await expect(display).toHaveText('New UI Value')

		// State update -> UI
		await page.click('#reset-input')
		await expect(input).toHaveValue('Reset')
		await expect(display).toHaveText('Reset')
	})

	test('should support function props (event handlers)', async ({ page }) => {
		const targetCount = page.locator('#target-count')
		const clicker = page.locator('#test-click')

		// Initial count
		await expect(targetCount).toHaveText('0')

		// Click should increment by 10
		await clicker.click()
		await expect(targetCount).toHaveText('10')
		
		// Another click
		await clicker.click()
		await expect(targetCount).toHaveText('20')
	})
})
