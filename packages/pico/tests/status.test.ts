import { expect, test, type Page } from '@playwright/test'
import { openSection } from './helpers/nav'

const openDisplaySection = (page: Page) =>
	openSection(page, { menuName: 'Display', expectedUrlPath: '/display', expectedHeading: 'Display', headingLevel: 1 })

// Status components (Badge, Chip, Pill)
test('all variants render', async ({ page }) => {
	await openDisplaySection(page)
	
	// Badges
	await page.getByRole('heading', { level: 3, name: 'Badges', exact: true }).scrollIntoViewIfNeeded()
	const badges = page.locator('.pp-badge')
	const badgeCount = await badges.count()
	expect(badgeCount).toBeGreaterThan(0)
	
	// Chips
	await page.getByRole('heading', { level: 3, name: 'Chips' }).scrollIntoViewIfNeeded()
	const chips = page.locator('.pp-chip')
	const chipCount = await chips.count()
	expect(chipCount).toBeGreaterThan(0)
	
	// Pills
	await page.getByRole('heading', { level: 3, name: 'Pills' }).scrollIntoViewIfNeeded()
	const pills = page.locator('.pp-pill')
	const pillCount = await pills.count()
	expect(pillCount).toBeGreaterThan(0)
	
	// Verify all are visible
	for (let i = 0; i < badgeCount; i++) {
		await expect(badges.nth(i)).toBeVisible()
	}
	for (let i = 0; i < chipCount; i++) {
		await expect(chips.nth(i)).toBeVisible()
	}
	for (let i = 0; i < pillCount; i++) {
		await expect(pills.nth(i)).toBeVisible()
	}
})

test('status content displays', async ({ page }) => {
	await openDisplaySection(page)
	
	// Badges
	await page.getByRole('heading', { level: 3, name: 'Badges', exact: true }).scrollIntoViewIfNeeded()
	const badges = page.locator('.pp-badge')
	const badgeCount = await badges.count()
	
	for (let i = 0; i < badgeCount; i++) {
		const badge = badges.nth(i)
		const label = badge.locator('.pp-token-label')
		if (await label.count() > 0) {
			await expect(label.first()).toBeVisible()
		}
	}
	
	// Chips
	await page.getByRole('heading', { level: 3, name: 'Chips' }).scrollIntoViewIfNeeded()
	const chips = page.locator('.pp-chip')
	const chipCount = await chips.count()
	
	for (let i = 0; i < chipCount; i++) {
		const chip = chips.nth(i)
		const label = chip.locator('.pp-token-label')
		if (await label.count() > 0) {
			await expect(label.first()).toBeVisible()
		}
	}
	
	// Pills
	await page.getByRole('heading', { level: 3, name: 'Pills' }).scrollIntoViewIfNeeded()
	const pills = page.locator('.pp-pill')
	const pillCount = await pills.count()
	
	for (let i = 0; i < pillCount; i++) {
		const pill = pills.nth(i)
		const label = pill.locator('.pp-token-label')
		if (await label.count() > 0) {
			await expect(label.first()).toBeVisible()
		}
	}
})

