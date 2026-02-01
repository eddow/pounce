import { expect, test } from '@playwright/test'
import { openSection } from './helpers/nav'

const openDisplaySection = (page: any) =>
	openSection(page, { menuName: 'Display', expectedUrlPath: '/display', expectedHeading: 'Display', headingLevel: 1 })

test('badge directive applies classes to element correctly', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	// Check the "Starred" button which uses use:badge
	const starredButton = page.getByRole('button', { name: 'Starred' })
	await expect(starredButton).toBeVisible()
	
	// Check that button itself has the p-badged class
	const hasBadgedClass = await starredButton.evaluate((el) => {
		return el.classList.contains('pp-badged')
	})
	expect(hasBadgedClass).toBeTruthy()
	
	// Check badge exists as a child
	const badge = starredButton.locator('.pp-badge-floating')
	await expect(badge).toBeVisible()
})

test('badged element maintains correct dimensions', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	const starredButton = page.getByRole('button', { name: 'Starred' })
	await expect(starredButton).toBeVisible()
	
	const buttonBox = await starredButton.boundingBox()
	
	if (buttonBox) {
		// Button should be visible and have reasonable dimensions
		expect(buttonBox.width).toBeGreaterThan(0)
		expect(buttonBox.height).toBeGreaterThan(0)
	}
})

test('badge is not clipped on labeled buttons', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	const badge = inboxButton.locator('.pp-badge-floating')
	
	await expect(badge).toBeVisible()
	const badgeBox = await badge.boundingBox()
	const buttonBox = await inboxButton.boundingBox()
	
	if (badgeBox && buttonBox) {
		// Badge should have proper dimensions (not clipped)
		expect(badgeBox.width).toBeGreaterThan(15)
		expect(badgeBox.height).toBeGreaterThan(15)
		expect(badgeBox.width).toBeLessThan(70)
		expect(badgeBox.height).toBeLessThan(40)
		
		// Check that badge extends significantly beyond button bounds to avoid border-radius clipping
		const extendsRight = (badgeBox.x + badgeBox.width) - (buttonBox.x + buttonBox.width)
		const extendsTop = buttonBox.y - badgeBox.y
		
		expect(extendsRight).toBeGreaterThan(2)
		expect(extendsTop).toBeGreaterThan(2)
		
		// Check computed styles on the button itself (since badge is internal)
		const overflow = await inboxButton.evaluate((el) => {
			return window.getComputedStyle(el).overflow
		})
		expect(overflow).toBe('visible')
	}
})

test('badge is not clipped on icon-only buttons', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	await page.waitForTimeout(200)
	
	const notificationsButton = page.getByRole('button', { name: 'Notifications' })
	await expect(notificationsButton).toBeVisible({ timeout: 5000 })
	
	const badge = notificationsButton.locator('.pp-badge-floating')
	await expect(badge).toBeVisible({ timeout: 5000 })
	await expect(badge).toHaveText('12')
	
	const badgeBox = await badge.boundingBox()
	const buttonBox = await notificationsButton.boundingBox()
	
	if (badgeBox && buttonBox) {
		expect(badgeBox.width).toBeGreaterThan(15)
		expect(badgeBox.height).toBeGreaterThan(15)
		expect(badgeBox.width).toBeLessThan(70)
		expect(badgeBox.height).toBeLessThan(40)
		
		const extendsRight = (badgeBox.x + badgeBox.width) - (buttonBox.x + buttonBox.width)
		const extendsTop = buttonBox.y - badgeBox.y
		
		expect(extendsRight).toBeGreaterThan(2)
		expect(extendsTop).toBeGreaterThan(2)
	}
})

test('badge positioning is correct for different button types', async ({ page }) => {
	await openDisplaySection(page)
	
	// Scroll to buttons with badges section
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	await page.waitForTimeout(200)
	
	// Test labeled button
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	const inboxBadge = inboxButton.locator('.pp-badge-floating')
	const inboxButtonBox = await inboxButton.boundingBox()
	const inboxBadgeBox = await inboxBadge.boundingBox()
	
	if (inboxButtonBox && inboxBadgeBox) {
		expect((inboxBadgeBox.x + inboxBadgeBox.width)).toBeGreaterThan((inboxButtonBox.x + inboxButtonBox.width) - 5)
		expect(inboxBadgeBox.y).toBeLessThan(inboxButtonBox.y + 5)
	}
	
	// Test icon-only button
	const notificationsButton = page.getByRole('button', { name: 'Notifications' })
	const notificationsBadge = notificationsButton.locator('.pp-badge-floating')
	const notificationsButtonBox = await notificationsButton.boundingBox()
	const notificationsBadgeBox = await notificationsBadge.boundingBox()
	
	if (notificationsButtonBox && notificationsBadgeBox) {
		expect((notificationsBadgeBox.x + notificationsBadgeBox.width)).toBeGreaterThan((notificationsButtonBox.x + notificationsButtonBox.width) - 5)
		expect(notificationsBadgeBox.y).toBeLessThan(notificationsButtonBox.y + 5)
	}
})

test('badge does not affect button clickability', async ({ page }) => {
	await openDisplaySection(page)
	
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	const inboxButton = page.getByRole('button', { name: 'Inbox' })
	const badge = inboxButton.locator('.pp-badge-floating')
	
	const pointerEvents = await badge.evaluate((el) => {
		return window.getComputedStyle(el).pointerEvents
	})
	expect(pointerEvents).toBe('none')
	await expect(inboxButton).toBeEnabled()
})

test('badge renders different content types correctly', async ({ page }) => {
	await openDisplaySection(page)
	
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	const notificationsButton = page.getByRole('button', { name: 'Notifications' })
	await expect(notificationsButton.locator('.pp-badge-floating')).toHaveText('12')
	
	const messagesButton = page.getByRole('button', { name: 'Messages' })
	await expect(messagesButton.locator('.pp-badge-floating')).toHaveText('99+')
	
	const profileButton = page.getByRole('button', { name: 'Profile' })
	await expect(profileButton.locator('.pp-badge-floating')).toHaveText('New')
})

test('badge accepts JSX.Element as content', async ({ page }) => {
	await openDisplaySection(page)
	
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	// Starred button uses use:badge
	const starredButton = page.getByRole('button', { name: 'Starred' })
	const badge = starredButton.locator('.pp-badge-floating')
	
	await expect(badge).toBeVisible()
	const hasIcon = await badge.locator('.pure-glyf-icon, svg').count()
	expect(hasIcon).toBeGreaterThan(0)
})

test('badge sizing and cropping - comprehensive check', async ({ page }) => {
	await openDisplaySection(page)
	
	await page.getByRole('heading', { level: 3, name: 'Buttons with Badges' }).scrollIntoViewIfNeeded()
	
	const buttons = [
		{ name: 'Inbox', expectedText: '5' },
		{ name: 'Notifications', expectedText: '12' },
		{ name: 'Messages', expectedText: '99+' },
		{ name: 'Shopping cart', expectedText: '3' },
		{ name: 'Profile', expectedText: 'New' },
	]
	
	for (const { name, expectedText } of buttons) {
		const button = page.getByRole('button', { name })
		await expect(button).toBeVisible({ timeout: 5000 })
		const badge = button.locator('.pp-badge-floating')
		
		await expect(badge).toBeVisible()
		await expect(badge).toHaveText(expectedText)
		
		const badgeBox = await badge.boundingBox()
		const buttonBox = await button.boundingBox()
		
		if (badgeBox && buttonBox) {
			expect(badgeBox.width).toBeGreaterThan(15)
			expect(badgeBox.height).toBeGreaterThan(15)
			expect(badgeBox.width).toBeLessThan(70)
			expect(badgeBox.height).toBeLessThan(40)
			
			const extendsRight = (badgeBox.x + badgeBox.width) - (buttonBox.x + buttonBox.width)
			const extendsTop = buttonBox.y - badgeBox.y
			
			if (extendsRight > 0 && extendsTop > 0) {
				expect(extendsRight).toBeGreaterThan(2)
				expect(extendsTop).toBeGreaterThan(2)
			}
			
			const buttonOverflow = await button.evaluate((el) => {
				return window.getComputedStyle(el).overflow
			})
			expect(buttonOverflow).toBe('visible')
			
			const badgeVisibility = await badge.evaluate((el) => {
				const style = window.getComputedStyle(el)
				return {
					visibility: style.visibility,
					opacity: parseFloat(style.opacity),
					clip: style.clip,
				}
			})
			expect(badgeVisibility.visibility).toBe('visible')
			expect(badgeVisibility.opacity).toBeGreaterThan(0)
			expect(badgeVisibility.clip).toBe('auto')
		}
	}
})
