import { test, expect } from '@playwright/test'

test.describe('isMounted utility', () => {
	test.beforeEach(async ({ page }) => {
		page.on('console', (msg) => {
			console.log(`[BROWSER LOG]: ${msg.text()}`)
		})
		// Load the IsMounted fixture
		await page.goto('/#IsMounted')
		// Wait for the fixture to load
		await expect(page.locator('#tests h2')).toContainText('isMounted Test')

	})

	test('tracks mounting and unmounting reactively', async ({ page }) => {
		const mountedCount = page.locator('#mounted-count')
		const unmountedCount = page.locator('#unmounted-count')
		const status = page.locator('#is-mounted-status')
		const toggleBtn = page.locator('#toggle-mount')
		const container = page.locator('#mount-container')

		// Initial state (unmounted)
		// Note: effect runs once on start, so unmountedCount should be 1
		await expect(status).toHaveText('No')
		await expect(mountedCount).toHaveText('0')
		await expect(unmountedCount).toHaveText('1')
		await expect(container.locator('#tracked-element')).toHaveCount(0)

		// Mount it
		await toggleBtn.click()
		
		// Wait for MutationObserver to pick it up and trigger effect
		await expect(status).toHaveText('Yes')
		await expect(mountedCount).toHaveText('1')
		await expect(unmountedCount).toHaveText('1')
		await expect(container.locator('#tracked-element')).toBeVisible()

		// Unmount it
		await toggleBtn.click()
		
		await expect(status).toHaveText('No')
		await expect(mountedCount).toHaveText('1')
		await expect(unmountedCount).toHaveText('2')
		await expect(container.locator('#tracked-element')).toHaveCount(0)

		// Mount again
		await toggleBtn.click()
		
		await expect(status).toHaveText('Yes')
		await expect(mountedCount).toHaveText('2')
		await expect(unmountedCount).toHaveText('2')
	})
})
