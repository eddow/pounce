/**
 * E2E tests for the overlay system.
 * Tests real browser behavior: animations, focus, accessibility, user interactions.
 */
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	await page.goto('/#overlay')
	await page.waitForSelector('#overlay-controls')
})

test.describe('Dialog', () => {
	test('opens and displays content', async ({ page }) => {
		await page.click('#btn-dialog')
		const dialog = page.locator('.pounce-dialog')
		await expect(dialog).toBeVisible()
		await expect(dialog).toContainText('Test Dialog')
		await expect(dialog).toContainText('Dialog content for e2e')
	})

	test('closes on OK button click and resolves', async ({ page }) => {
		await page.click('#btn-dialog')
		await expect(page.locator('.pounce-dialog')).toBeVisible()

		await page.locator('.pounce-dialog footer button', { hasText: 'OK' }).click()

		await expect(page.locator('.pounce-dialog')).not.toBeVisible({ timeout: 2000 })
	})

	test('closes on Cancel button click', async ({ page }) => {
		await page.click('#btn-dialog')
		await expect(page.locator('.pounce-dialog')).toBeVisible()

		await page.locator('.pounce-dialog footer button', { hasText: 'Cancel' }).click()

		await expect(page.locator('.pounce-dialog')).not.toBeVisible({ timeout: 2000 })
	})

	test('closes on backdrop click when dismissible', async ({ page }) => {
		await page.click('#btn-dialog')
		await expect(page.locator('.pounce-dialog')).toBeVisible()

		await page.locator('.pounce-backdrop').click({ force: true })

		await expect(page.locator('.pounce-dialog')).not.toBeVisible({ timeout: 2000 })
	})

	test('does NOT close on backdrop click when not dismissible', async ({ page }) => {
		await page.click('#btn-confirm')
		await expect(page.locator('.pounce-dialog')).toBeVisible()

		await page.locator('.pounce-backdrop').click({ force: true })

		// Dialog should still be visible
		await expect(page.locator('.pounce-dialog')).toBeVisible()
	})

	test('closes on Escape key when dismissible', async ({ page }) => {
		await page.click('#btn-dialog')
		await expect(page.locator('.pounce-dialog')).toBeVisible()

		await page.keyboard.press('Escape')

		await expect(page.locator('.pounce-dialog')).not.toBeVisible({ timeout: 2000 })
	})

	test('does NOT close on Escape when not dismissible', async ({ page }) => {
		await page.click('#btn-confirm')
		await expect(page.locator('.pounce-dialog')).toBeVisible()

		await page.keyboard.press('Escape')

		await expect(page.locator('.pounce-dialog')).toBeVisible()
	})

	test('has correct ARIA attributes', async ({ page }) => {
		await page.click('#btn-dialog')
		const overlayItem = page.locator('.pounce-overlay-item')
		await expect(overlayItem).toHaveAttribute('role', 'dialog')
		await expect(overlayItem).toHaveAttribute('aria-modal', 'true')
	})

	test('shows backdrop', async ({ page }) => {
		await page.click('#btn-dialog')
		await expect(page.locator('.pounce-backdrop')).toBeVisible()
	})
})

test.describe('Drawer', () => {
	test('opens left drawer with title and body', async ({ page }) => {
		await page.click('#btn-drawer')
		const drawer = page.locator('.pounce-drawer')
		await expect(drawer).toBeVisible()
		await expect(drawer).toContainText('Test Drawer')
		await expect(page.locator('.drawer-content')).toContainText('Drawer body content')
	})

	test('renders footer when provided', async ({ page }) => {
		await page.click('#btn-drawer')
		const footer = page.locator('.pounce-drawer-footer')
		await expect(footer).toBeVisible()
		await expect(footer.locator('.drawer-save')).toContainText('Save')
	})

	test('opens right drawer with correct class', async ({ page }) => {
		await page.click('#btn-drawer-right')
		await expect(page.locator('.pounce-drawer-right')).toBeVisible()
	})

	test('closes on close button click', async ({ page }) => {
		await page.click('#btn-drawer')
		await expect(page.locator('.pounce-drawer')).toBeVisible()

		await page.locator('.pounce-drawer-close').click()

		await expect(page.locator('.pounce-drawer')).not.toBeVisible({ timeout: 2000 })
	})

	test('closes on Escape key', async ({ page }) => {
		await page.click('#btn-drawer')
		await expect(page.locator('.pounce-drawer')).toBeVisible()

		await page.keyboard.press('Escape')

		await expect(page.locator('.pounce-drawer')).not.toBeVisible({ timeout: 2000 })
	})
})

test.describe('Toast', () => {
	test('shows toast notification', async ({ page }) => {
		await page.click('#btn-toast')
		const toast = page.locator('.pounce-toast')
		await expect(toast).toBeVisible()
		await expect(toast).toContainText('Test notification')
	})

	test('toast has close button', async ({ page }) => {
		await page.click('#btn-toast')
		const closeBtn = page.locator('.pounce-toast-close')
		await expect(closeBtn).toBeVisible()

		await closeBtn.click()
		await expect(page.locator('.pounce-toast')).not.toBeVisible({ timeout: 2000 })
	})

	test('success toast has variant attribute', async ({ page }) => {
		await page.click('#btn-toast-success')
		const toast = page.locator('.pounce-toast')
		await expect(toast).toBeVisible()
		await expect(toast).toHaveAttribute('data-variant', 'success')
	})

	test('danger toast has correct ARIA role', async ({ page }) => {
		await page.click('#btn-toast-danger')
		const toast = page.locator('.pounce-toast')
		await expect(toast).toBeVisible()
		await expect(toast).toHaveAttribute('role', 'alert')
	})

	test('toast renders in toast layer', async ({ page }) => {
		await page.click('#btn-toast')
		const toastLayer = page.locator('.pounce-mode-toast')
		await expect(toastLayer).toBeVisible()
		await expect(toastLayer.locator('.pounce-toast')).toBeVisible()
	})
})

test.describe('Layered Rendering', () => {
	test('dialog and toast render in separate layers', async ({ page }) => {
		await page.click('#btn-dialog')
		await page.click('#btn-toast')

		await expect(page.locator('.pounce-mode-modal .pounce-dialog')).toBeVisible()
		await expect(page.locator('.pounce-mode-toast .pounce-toast')).toBeVisible()
	})

	test('multiple overlays stack correctly', async ({ page }) => {
		await page.click('#btn-dialog')
		await page.click('#btn-toast-success')
		await page.click('#btn-toast-danger')

		const toasts = page.locator('.pounce-toast')
		await expect(toasts).toHaveCount(2)
		await expect(page.locator('.pounce-dialog')).toBeVisible()
	})
})
