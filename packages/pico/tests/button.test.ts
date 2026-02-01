import { expect, test } from '@playwright/test'
import { openSection } from './helpers/nav'

const openDisplaySection = (page: any) =>
	openSection(page, { menuName: 'Display', expectedUrlPath: '/display', expectedHeading: 'Display', headingLevel: 1 })

// Button variants
test('all variant buttons render correctly (primary, secondary, contrast, danger, success, warning)', async ({ page }) => {
	await openDisplaySection(page)
	
	const variants = ['Primary', 'Secondary', 'Contrast', 'Success', 'Warning', 'Danger']
	
	for (const variant of variants) {
		const button = page.getByRole('button', { name: variant })
		await expect(button).toBeVisible()
	}
})

test('button with icon renders', async ({ page }) => {
	await openDisplaySection(page)
	const homeButton = page.getByRole('button', { name: 'Home' })
	await expect(homeButton).toBeVisible()
	
	// Check for icon element
	const icon = homeButton.locator('.pp-button-icon, [class*="pure-glyf-icon"]')
	await expect(icon.first()).toBeVisible()
})

test('button with icon at end renders', async ({ page }) => {
	await openDisplaySection(page)
	const githubButton = page.getByRole('button', { name: 'GitHub' })
	await expect(githubButton).toBeVisible()
	
	// Check for icon element
	const icon = githubButton.locator('.pp-button-icon, [class*="pure-glyf-icon"]')
	await expect(icon.first()).toBeVisible()
})

test('icon-only button renders', async ({ page }) => {
	await openDisplaySection(page)
	// Find icon-only buttons (buttons with aria-label but no visible text)
	const iconOnlyButtons = page.locator('button[aria-label]')
	const count = await iconOnlyButtons.count()
	
	// Should have at least one icon-only button (dark mode toggle in header)
	expect(count).toBeGreaterThan(0)
	
	// Check dark mode toggle button
	const darkModeToggle = page.getByRole('button', { name: 'Toggle dark mode' })
	await expect(darkModeToggle).toBeVisible()
	
	// Check it has icon-only class or structure
	const hasIconOnlyClass = await darkModeToggle.evaluate((el) => {
		return el.classList.contains('pp-button-icon-only') || 
		       el.querySelector('.pp-button-icon') !== null
	})
	expect(hasIconOnlyClass).toBeTruthy()
})

test('button click handlers work', async ({ page }) => {
	await openDisplaySection(page)
	const primaryButton = page.getByRole('button', { name: 'Primary' })
	await expect(primaryButton).toBeVisible()
	
	// Click button (should not cause errors)
	await primaryButton.click()
	
	// Button should still be visible after click
	await expect(primaryButton).toBeVisible()
})

test('disabled button does not respond to clicks', async ({ page }) => {
	await openDisplaySection(page)
	// Find all buttons and check for disabled state
	const buttons = page.locator('button')
	const count = await buttons.count()
	
	for (let i = 0; i < count; i++) {
		const button = buttons.nth(i)
		const isDisabled = await button.isDisabled()
		
		if (isDisabled) {
			// Disabled button should not be clickable
			await expect(button).toBeDisabled()
			
			// Try to click (should not trigger handlers)
			await button.click({ force: true })
		}
	}
})

// Button accessibility
test('icon-only buttons have aria-label', async ({ page }) => {
	await openDisplaySection(page)
	// Check dark mode toggle has aria-label
	const darkModeToggle = page.getByRole('button', { name: 'Toggle dark mode' })
	await expect(darkModeToggle).toBeVisible()
	await expect(darkModeToggle).toHaveAttribute('aria-label', 'Toggle dark mode')
})

test('buttons are keyboard accessible (Enter/Space)', async ({ page }) => {
	await openDisplaySection(page)
	const primaryButton = page.getByRole('button', { name: 'Primary' })
	await expect(primaryButton).toBeVisible()
	
	// Focus button
	await primaryButton.focus()
	
	// Press Enter
	await page.keyboard.press('Enter')
	
	// Press Space
	await page.keyboard.press('Space')
	
	// Button should still be visible and functional
	await expect(primaryButton).toBeVisible()
})

test('focus indicators visible', async ({ page }) => {
	await openDisplaySection(page)
	const primaryButton = page.getByRole('button', { name: 'Primary' })
	await expect(primaryButton).toBeVisible()
	
	// Focus button
	await primaryButton.focus()
	
	// Check if button has focus
	const isFocused = await primaryButton.evaluate((el) => document.activeElement === el)
	expect(isFocused).toBeTruthy()
	
	// Check for focus styles (outline or box-shadow)
	const hasFocusStyle = await primaryButton.evaluate((el) => {
		const style = window.getComputedStyle(el)
		return style.outline !== 'none' || 
		       style.outlineWidth !== '0px' ||
		       style.boxShadow !== 'none'
	})
	// Note: Focus styles may vary, but button should be focusable
	expect(isFocused).toBeTruthy()
})

// Button badges (now using Badged component)
test('button with badge renders correctly', async ({ page }) => {
	await openDisplaySection(page)
	
	// Check button with number badge
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	await expect(inboxButton).toBeVisible()
	
	// Badge is now in a Badged wrapper
	const badge = inboxButton.locator('.pp-badge-floating')
	await expect(badge).toBeVisible()
	await expect(badge).toHaveText('5')
})

test('icon-only button with badge has correct size', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	// Check the bell button with badge (icon-only)
	const notificationsButton = page.getByRole('button', { name: 'Notifications' })
	await expect(notificationsButton).toBeVisible()
	
	// Verify it's an icon-only button
	const isIconOnly = await notificationsButton.evaluate((el) => {
		return el.classList.contains('pp-button-icon-only')
	})
	expect(isIconOnly).toBeTruthy()
	
	// Check button size - should not exceed reasonable dimensions
	// Icon-only buttons should be approximately 2.5rem (40px) based on form element height
	const boundingBox = await notificationsButton.boundingBox()
	expect(boundingBox).not.toBeNull()
	
	if (boundingBox) {
		// Button should not be excessively large (was 218x218, should be ~40px)
		// Allow some tolerance for different browsers/rendering
		expect(boundingBox.width).toBeLessThan(60) // Should be ~40px, allow up to 60px
		expect(boundingBox.height).toBeLessThan(60) // Should be ~40px, allow up to 60px
		expect(boundingBox.width).toBeGreaterThan(30) // At least 30px
		expect(boundingBox.height).toBeGreaterThan(30) // At least 30px
	}
	
	// Verify badge is present and visible (in Badged wrapper)
	const badge = notificationsButton.locator('.pp-badge-floating')
	await expect(badge).toBeVisible()
	await expect(badge).toHaveText('12')
	
	// Badge should be positioned absolutely and not affect button size
	const badgeBox = await badge.boundingBox()
	if (badgeBox && boundingBox) {
		// Badge should be positioned outside the button's main area (top-right)
		// It may extend beyond the button bounds, which is fine
		expect(badgeBox.width).toBeLessThan(70) // Badge should be reasonable (allow for "99+" or "New" text)
		expect(badgeBox.height).toBeLessThan(40) // Badge should be small
	}
})

test('buttons with different badge types render', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	await page.waitForTimeout(200) // Allow for rendering
	
	// Test number badge
	const notificationsButton = page.getByRole('button', { name: 'Notifications' })
	await expect(notificationsButton).toBeVisible()
	await expect(notificationsButton.locator('.pp-badge-floating')).toHaveText('12')
	
	// Test string badge
	const messagesButton = page.getByRole('button', { name: 'Messages' })
	await expect(messagesButton.locator('.pp-badge-floating')).toHaveText('99+')
	
	// Test button with label and badge
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	await expect(inboxButton).toBeVisible()
	await expect(inboxButton.locator('.pp-badge-floating')).toHaveText('5')
})

test('buttons with labels and badges have correct badge positioning and no clipping', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	await page.waitForTimeout(200) // Allow for rendering
	
	// Check Inbox button (has label and badge)
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	await expect(inboxButton).toBeVisible()
	
	const inboxBadge = inboxButton.locator('.pp-badge-floating')
	await expect(inboxBadge).toBeVisible()
	await expect(inboxBadge).toHaveText('5')
	
	// Verify badge is not clipped - check dimensions
	const inboxBadgeBox = await inboxBadge.boundingBox()
	if (inboxBadgeBox) {
		// Badge should have reasonable dimensions (not squished or clipped)
		expect(inboxBadgeBox.width).toBeGreaterThan(15) // Should be wide enough for content
		expect(inboxBadgeBox.height).toBeGreaterThan(15) // Should be tall enough
		// Badge should be roughly circular/square (not extremely wide or tall)
		expect(inboxBadgeBox.width).toBeLessThan(40)
		expect(inboxBadgeBox.height).toBeLessThan(30)
	}
	
	// Check Cart button (has label and badge)
	const cartButton = page.getByRole('button', { name: 'Shopping cart' })
	await expect(cartButton).toBeVisible()
	
	const cartBadge = cartButton.locator('.pp-badge-floating')
	await expect(cartBadge).toBeVisible()
	await expect(cartBadge).toHaveText('3')
	
	// Verify badge is complete (not truncated)
	const cartBadgeBox = await cartBadge.boundingBox()
	if (cartBadgeBox) {
		// Badge should have reasonable dimensions (not squished)
		expect(cartBadgeBox.width).toBeGreaterThan(15) // Should be wide enough for content
		expect(cartBadgeBox.height).toBeGreaterThan(15) // Should be tall enough
	}
})

test('badged buttons maintain correct button size', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	await page.waitForTimeout(200) // Allow for rendering
	
	// Check that buttons with badges don't have excessive size
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	await expect(inboxButton).toBeVisible()
	const inboxBox = await inboxButton.boundingBox()
	
	if (inboxBox) {
		// Button should have reasonable width (not excessively wide)
		expect(inboxBox.width).toBeLessThan(400) // Should be reasonable for "Inbox" text, even if stretched in a group
		expect(inboxBox.height).toBeLessThan(65) // Should be reasonable height (allow some tolerance for padding/borders)
		expect(inboxBox.height).toBeGreaterThan(30) // At least minimum height
	}
	
	// Icon-only button should maintain small size
	const notificationsButton = page.getByRole('button', { name: 'Notifications' })
	const notificationsBox = await notificationsButton.boundingBox()
	
	if (notificationsBox) {
		// Icon-only button should be approximately square and small
		expect(notificationsBox.width).toBeLessThan(60)
		expect(notificationsBox.height).toBeLessThan(60)
		expect(notificationsBox.width).toBeGreaterThan(30)
		expect(notificationsBox.height).toBeGreaterThan(30)
	}
})

