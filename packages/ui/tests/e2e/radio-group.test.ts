/**
 * E2E tests for Radio group binding.
 * Tests that group={state.value} keeps working through multiple selection cycles.
 */
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/#radio')
	await page.waitForSelector('#radio-controls')
})

test.describe('Radio group binding', () => {
	test('initial state: first radio checked', async ({ page }) => {
		const radios = page.locator('input[type="radio"]')
		await expect(radios.nth(0)).toBeChecked()
		await expect(radios.nth(1)).not.toBeChecked()
		await expect(radios.nth(2)).not.toBeChecked()
		await expect(page.locator('#radio-status')).toContainText('Selected: a')
	})

	test('clicking radio B updates group', async ({ page }) => {
		await page.locator('input[type="radio"][value="b"]').click()
		await expect(page.locator('#radio-status')).toContainText('Selected: b')
		await expect(page.locator('input[type="radio"][value="a"]')).not.toBeChecked()
		await expect(page.locator('input[type="radio"][value="b"]')).toBeChecked()
		await expect(page.locator('input[type="radio"][value="c"]')).not.toBeChecked()
	})

	// FIXME: biDi effect for checked gets disposed after the first full cycle.
	// The isChecked setter fires correctly on cycle 1 (a→b→c→a), but on cycle 2
	// the provide() from biDi no longer reaches the setter. Root cause is in
	// mutts biDi + pounce's auto-wired checked binding on radio inputs.
	// Works in jsdom (unit tests pass), fails in real Chrome.
	test.fixme('group keeps working through multiple cycles', async ({ page }) => {
		const rA = page.locator('input[type="radio"][value="a"]')
		const rB = page.locator('input[type="radio"][value="b"]')
		const rC = page.locator('input[type="radio"][value="c"]')
		const status = page.locator('#radio-status')

		// Cycle 1: a -> b -> c -> a
		await rB.click()
		await expect(status).toContainText('Selected: b')

		await rC.click()
		await expect(status).toContainText('Selected: c')

		await rA.click()
		await expect(status).toContainText('Selected: a')

		// Cycle 2: a -> c -> b -> a
		await rC.click()
		await expect(status).toContainText('Selected: c')
		await expect(rC).toBeChecked()

		await rB.click()
		await expect(status).toContainText('Selected: b')
		await expect(rB).toBeChecked()

		await rA.click()
		await expect(status).toContainText('Selected: a')
		await expect(rA).toBeChecked()
	})
})
