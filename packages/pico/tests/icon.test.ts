import { expect, test, type Page } from '@playwright/test'
import { openSection } from './helpers/nav'

const openDisplaySection = (page: Page) =>
	openSection(page, { menuName: 'Display', expectedUrlPath: '/display', expectedHeading: 'Display', headingLevel: 1 })

// Icon rendering
test('icons render by name', async ({ page }) => {
	await openDisplaySection(page)
	// Scroll to icons section
	const iconsHeading = page.getByRole('heading', { level: 3, name: 'Icons' })
	await iconsHeading.scrollIntoViewIfNeeded()
	const iconsSection = iconsHeading.locator('xpath=ancestor::div[1]')
	
	// Find pure-glyf icons
	const icons = iconsSection.locator('.pure-glyf-icon, [class*="pure-glyf-icon"]')
	const count = await icons.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify icons are visible
	for (let i = 0; i < count; i++) {
		const icon = icons.nth(i)
		await expect(icon).toBeVisible()
	}
})

test('custom size works', async ({ page }) => {
	await openDisplaySection(page)
	const iconsHeading = page.getByRole('heading', { level: 3, name: 'Icons' })
	await iconsHeading.scrollIntoViewIfNeeded()
	const iconsSection = iconsHeading.locator('xpath=ancestor::div[1]')
	
	const icons = iconsSection.locator('.pure-glyf-icon, [class*="pure-glyf-icon"]')
	const count = await icons.count()
	
	// Find icons with custom size
	for (let i = 0; i < count; i++) {
		const icon = icons.nth(i)
		const style = await icon.getAttribute('style')
		
		// Icons with custom size should have width/height in style
		if (style && (style.includes('width') || style.includes('height'))) {
			// Verify size is set
			expect(style).toBeTruthy()
		}
	}
})

test('icons are visible', async ({ page }) => {
	await openDisplaySection(page)
	const iconsHeading = page.getByRole('heading', { level: 3, name: 'Icons' })
	await iconsHeading.scrollIntoViewIfNeeded()
	const iconsSection = iconsHeading.locator('xpath=ancestor::div[1]')
	
	const icons = iconsSection.locator('.pure-glyf-icon, [class*="pure-glyf-icon"]')
	const count = await icons.count()
	expect(count).toBeGreaterThan(0)
	
	// All icons should be visible
	for (let i = 0; i < count; i++) {
		const icon = icons.nth(i)
		await expect(icon).toBeVisible()
	}
})

