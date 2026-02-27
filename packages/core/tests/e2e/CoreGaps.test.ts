import { test, expect } from '@playwright/test'

test.describe('Core Feature Gaps', () => {
	test('Catch directive handles errors and resets', async ({ page }) => {
		await page.goto('/#Catch')
		await page.waitForSelector('[data-testid="catch-boundary"]')
		
		// Initial state
		await expect(page.locator('[data-testid="ok-content"]')).toBeVisible()
		
		// Trigger error
		await page.click('[data-action="trigger-error"]')
		await expect(page.locator('[data-testid="error-fallback"]')).toBeVisible()
		await expect(page.locator('[data-testid="error-fallback"]')).toContainText('Caught: Test Error')
		await expect(page.locator('[data-testid="error-count"]')).toHaveText('1')
		
		// Reset
		await page.click('[data-action="reset-error"]')
		await expect(page.locator('[data-testid="ok-content"]')).toBeVisible()
		await expect(page.locator('[data-testid="error-fallback"]')).toBeHidden()
	})

	test('Pick directive and Oracle pattern', async ({ page }) => {
		await page.goto('/#Pick')
		await page.waitForSelector('[data-testid="pick-container"]')
		
		// Initial view A
		await expect(page.locator('[data-testid="view-a"]')).toBeVisible()
		await expect(page.locator('[data-testid="view-b"]')).toBeHidden()
		await expect(page.locator('[data-testid="view-c"]')).toBeHidden()
		
		// Switch to B
		await page.click('[data-action="set-view-b"]')
		await expect(page.locator('[data-testid="view-b"]')).toBeVisible()
		await expect(page.locator('[data-testid="view-a"]')).toBeHidden()
		
		// Switch to C (not allowed yet)
		await page.click('[data-action="set-view-c"]')
		await expect(page.locator('[data-testid="view-c"]')).toBeHidden()
		
		// Allow C and switch
		await page.click('[data-action="allow-c"]')
		await page.click('[data-action="set-view-c"]') // Need a reactive re-calculation or re-click
		await expect(page.locator('[data-testid="view-c"]')).toBeVisible()
	})

	test('Lifecycle mount/unmount tracking', async ({ page }) => {
		await page.goto('/#Lifecycle')
		await page.waitForSelector('[data-testid="lifecycle-container"]')
		
		await expect(page.locator('[data-testid="mount-count"]')).toHaveText('1')
		await expect(page.locator('[data-testid="unmount-count"]')).toHaveText('0')
		
		// Toggle off
		await page.click('[data-action="toggle-child"]')
		await expect(page.locator('[data-testid="lifecycle-child"]')).toBeHidden()
		await expect(page.locator('[data-testid="mount-count"]')).toHaveText('1')
		await expect(page.locator('[data-testid="unmount-count"]')).toHaveText('1')
		
		// Toggle on
		await page.click('[data-action="toggle-child"]')
		await expect(page.locator('[data-testid="lifecycle-child"]')).toBeVisible()
		await expect(page.locator('[data-testid="mount-count"]')).toHaveText('2')
		await expect(page.locator('[data-testid="unmount-count"]')).toHaveText('1')
	})

	test('Ref tracking (this=)', async ({ page }) => {
		await page.goto('/#Ref')
		await page.waitForSelector('[data-testid="ref-container"]')
		
		await expect(page.locator('[data-testid="reactive-prop-status"]')).toHaveText('Yes')
		await expect(page.locator('[data-testid="callback-status"]')).toHaveText('Yes')
		
		// Toggle off
		await page.click('[data-action="toggle-refs"]')
		await expect(page.locator('[data-testid="reactive-prop-status"]')).toHaveText('No')
		await expect(page.locator('[data-testid="callback-status"]')).toHaveText('No')
	})

	test('SVG attributes reactivity', async ({ page }) => {
		await page.goto('/#Svg')
		await page.waitForSelector('[data-testid="svg-root"]')
		
		const circle = page.locator('[data-testid="svg-circle"]')
		await expect(circle).toHaveAttribute('r', '20')
		await expect(circle).toHaveAttribute('fill', 'red')
		
		// Update attributes
		await page.click('[data-action="grow"]')
		await expect(circle).toHaveAttribute('r', '25')
		
		await page.click('[data-action="color-blue"]')
		await expect(circle).toHaveAttribute('fill', 'blue')
	})

	test('Boolean and special attributes', async ({ page }) => {
		await page.goto('/#Attribute')
		await page.waitForSelector('[data-testid="target-button"]')
		
		const button = page.locator('[data-testid="target-button"]')
		const checkbox = page.locator('[data-testid="target-checkbox"]')
		
		await expect(button).toBeDisabled()
		await expect(checkbox).not.toBeChecked()
		// Indeterminate is a property, not an attribute usually, but we check standard behavior
		const isIndeterminate = await checkbox.evaluate((el: HTMLInputElement) => el.indeterminate)
		expect(isIndeterminate).toBe(true)
		
		// 1. click on the checkbox (becomes determinate, checked)
		await checkbox.click()
		await expect(checkbox).toBeChecked()
		const isIndeterminateAfterClick = await checkbox.evaluate((el: HTMLInputElement) => el.indeterminate)
		expect(isIndeterminateAfterClick).toBe(false)
		
		// 2. click on button "toggle checked" (becomes unchecked)
		await page.click('[data-action="toggle-checked"]')
		await expect(checkbox).not.toBeChecked()
		
		// 3. click on button "toggle checked" (**stays** unchecked - so toBeChecked() will fail here)
		await page.click('[data-action="toggle-checked"]')
		await expect(checkbox).toBeChecked()
	})
})
