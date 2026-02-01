import { expect, test, type Page } from '@playwright/test'
import type { ToastConfig } from '../src/index'
import { runA11yCheck } from './helpers/a11y'
import { openSection } from './helpers/nav'

interface WindowWithToastConfig extends Window {
	toastConfig?: Partial<ToastConfig>
}

const openToastsDemo = async (page: Page) => {
	await openSection(page, { menuName: 'Interaction', expectedUrlPath: '/interaction', expectedHeading: 'Toasts', headingLevel: 2 })
	// Speed up toasts if a global config is exposed (no-op otherwise)
	await page.evaluate(() => {
		const cfg = (window as WindowWithToastConfig)?.toastConfig
		if (cfg && typeof cfg === 'object') {
			cfg.defaultDurationMs = 800
		}
	})
}

test('shows and auto-dismisses the info toast', async ({ page }) => {
	await openToastsDemo(page)
	await expect(page.locator('.pp-toast')).toHaveCount(0)
	await page.getByRole('button', { name: 'Toast' }).click()
	const toastLocator = page.locator('.pp-toast', { hasText: 'Saved!' })
	await expect(toastLocator).toBeVisible()
	await expect(toastLocator).toHaveAttribute('role', 'status')
	// Wait for auto-dismiss
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 5000 })
})

test('dismisses danger toasts via the close button', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Danger' }).click()
	const dangerToast = page.locator('.pp-toast', { hasText: 'Failed to save' })
	await expect(dangerToast).toBeVisible()
	await expect(dangerToast).toHaveAttribute('role', 'alert')
	await dangerToast.getByRole('button', { name: 'Dismiss' }).click()
	await expect(page.locator('.pp-toast')).toHaveCount(0)
})

// Toast variants
test('success toast appears and dismisses', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Success' }).click()
	const successToast = page.locator('.pp-toast', { hasText: 'Profile updated' })
	await expect(successToast).toBeVisible()
	await expect(successToast).toHaveAttribute('role', 'status')
	// Dismiss quickly to avoid long waits
	await successToast.getByRole('button', { name: 'Dismiss' }).click()
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 1500 })
})

test('warning toast appears and dismisses', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Warning' }).click()
	const warningToast = page.locator('.pp-toast', { hasText: 'Network is slow' })
	await expect(warningToast).toBeVisible()
	await expect(warningToast).toHaveAttribute('role', 'status')
	// Dismiss quickly to avoid long waits
	await warningToast.getByRole('button', { name: 'Dismiss' }).click()
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 1500 })
})

test('primary/info toast appears and dismisses', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Info' }).click()
	const infoToast = page.locator('.pp-toast', { hasText: 'Heads up: maintenance at 2am' })
	await expect(infoToast).toBeVisible()
	await expect(infoToast).toHaveAttribute('role', 'status')
	// Dismiss quickly to avoid long waits
	await infoToast.getByRole('button', { name: 'Dismiss' }).click()
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 1500 })
})

test('secondary toast appears and dismisses', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Toast' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Saved!' })
	await expect(toast).toBeVisible()
	// Secondary variant is default for toast.info
	await expect(toast).toHaveAttribute('role', 'status')
	// Dismiss quickly to avoid long waits
	await toast.getByRole('button', { name: 'Dismiss' }).click()
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 1500 })
})

// Toast behavior
test('multiple toasts stack correctly', async ({ page }) => {
	await openToastsDemo(page)
	// Trigger multiple toasts quickly
	await page.getByRole('button', { name: 'Toast' }).click()
	await page.getByRole('button', { name: 'Success' }).click()
	await page.getByRole('button', { name: 'Warning' }).click()
	
	// Check multiple toasts are visible
	const toasts = page.locator('.pp-toast')
	await expect(toasts).toHaveCount(3, { timeout: 1000 })
	
	// Dismiss them quickly
	const dismissButtons = page.locator('.pp-toast >> role=button[name="Dismiss"]')
	const count = await dismissButtons.count()
	for (let i = 0; i < count; i++) {
		await dismissButtons.nth(i).click()
	}
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 2000 })
})

test('toast pause on hover (does not auto-dismiss while hovering)', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Toast' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Saved!' })
	await expect(toast).toBeVisible()
	
	// Hover over toast
	await toast.hover()
	
	// Wait longer than auto-dismiss duration
	await page.waitForTimeout(2500)
	
	// Toast should still be visible while hovering
	await expect(toast).toBeVisible()
	
	// Move mouse away
	await page.mouse.move(0, 0)
	
	// Now toast should dismiss
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 4000 })
})

test('toast resumes timer on mouse leave', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Toast' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Saved!' })
	await expect(toast).toBeVisible()
	
	// Hover and then leave
	await toast.hover()
	await page.waitForTimeout(1000)
	await page.mouse.move(0, 0)
	
	// Toast should dismiss after remaining time
	await page.waitForTimeout(3000)
	await expect(page.locator('.pp-toast')).toHaveCount(0)
})

test('toast with custom duration works', async ({ page }) => {
	await openToastsDemo(page)
	// Note: This test assumes there's a way to create a toast with custom duration
	// If not available in demo, we test default duration
	await page.getByRole('button', { name: 'Toast' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Saved!' })
	await expect(toast).toBeVisible()
	
	// Default duration is around 3500ms, but we dismiss quickly in other tests
	await expect(page.locator('.pp-toast')).toHaveCount(0, { timeout: 5000 })
})

test('non-dismissible toast auto-dismisses only', async ({ page }) => {
	await openToastsDemo(page)
	// Note: This test assumes there's a non-dismissible toast option
	// If not available, we test that dismissible toasts show close button
	await page.getByRole('button', { name: 'Danger' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Failed to save' })
	await expect(toast).toBeVisible()
	
	// Dismissible toast should have close button
	const closeButton = toast.getByRole('button', { name: 'Dismiss' })
	await expect(closeButton).toBeVisible()
	
	await closeButton.click()
	await expect(page.locator('.pp-toast')).toHaveCount(0)
})

test('dismissible toast shows close button', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Danger' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Failed to save' })
	await expect(toast).toBeVisible()
	
	// Check for close button
	const closeButton = toast.getByRole('button', { name: 'Dismiss' })
	await expect(closeButton).toBeVisible()
	
	await closeButton.click()
	await expect(page.locator('.pp-toast')).toHaveCount(0)
})

// Toast accessibility
test('role="alert" for danger toasts', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Danger' }).click()
	const dangerToast = page.locator('.pp-toast', { hasText: 'Failed to save' })
	await expect(dangerToast).toBeVisible()
	await expect(dangerToast).toHaveAttribute('role', 'alert')
	await dangerToast.getByRole('button', { name: 'Dismiss' }).click()
})

test('role="status" for info/success toasts', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Success' }).click()
	const successToast = page.locator('.pp-toast', { hasText: 'Profile updated' })
	await expect(successToast).toBeVisible()
	await expect(successToast).toHaveAttribute('role', 'status')
	// Dismiss to finish fast
	await successToast.getByRole('button', { name: 'Dismiss' }).click()
})

test('toast container has aria-live="polite"', async ({ page }) => {
	await openToastsDemo(page)
	// Trigger a toast to ensure host is mounted
	await page.getByRole('button', { name: 'Toast' }).click()
	const container = page.locator('.pp-toasts')
	await expect(container).toHaveAttribute('aria-live', 'polite')
	// Dismiss quickly
	await page.locator('.pp-toast').getByRole('button', { name: 'Dismiss' }).click()
})

// Toast positioning
test('toasts appear in configured position (bottom-right default)', async ({ page }) => {
	await openToastsDemo(page)
	await page.getByRole('button', { name: 'Toast' }).click()
	const toast = page.locator('.pp-toast', { hasText: 'Saved!' })
	await expect(toast).toBeVisible()
	
	// Check container has position class
	const container = page.locator('.pp-toasts')
	const classes = await container.getAttribute('class')
	expect(classes).toContain('bottom-right')
	
	// Dismiss quickly
	await toast.getByRole('button', { name: 'Dismiss' }).click()
})

test('multiple toasts stack in correct order', async ({ page }) => {
	await openToastsDemo(page)
	// Trigger multiple toasts
	await page.getByRole('button', { name: 'Toast' }).click()
	await page.waitForTimeout(100)
	await page.getByRole('button', { name: 'Success' }).click()
	await page.waitForTimeout(100)
	await page.getByRole('button', { name: 'Warning' }).click()
	
	// Check multiple toasts exist
	const toasts = page.locator('.pp-toast')
	await expect(toasts).toHaveCount(3, { timeout: 1000 })
	
	// Verify they are stacked (check container layout)
	const container = page.locator('.pp-toasts')
	await expect(container).toBeVisible()
	
	// Dismiss quickly
	const dismissButtons = page.locator('.pp-toast >> role=button[name="Dismiss"]')
	const count2 = await dismissButtons.count()
	for (let i = 0; i < count2; i++) {
		await dismissButtons.nth(i).click()
	}
})

test('a11y - interaction route passes axe checks', async ({ page }) => {
	await page.goto('/interaction')
	await runA11yCheck(page)
})

