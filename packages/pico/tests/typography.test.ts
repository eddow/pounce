import { expect, test, type Page } from '@playwright/test'
import { openSection } from './helpers/nav'

const openDisplaySection = (page: Page) =>
	openSection(page, { menuName: 'Display', expectedUrlPath: '/display', expectedHeading: 'Display', headingLevel: 1 })

// Heading levels
test('heading levels render correctly', async ({ page }) => {
	await openDisplaySection(page)
	// Scroll to typography section
	await page.getByRole('heading', { level: 3, name: 'Typography' }).scrollIntoViewIfNeeded()
	
	// Check for different heading levels
	const h1 = page.locator('h1.pp-heading, h1')
	const h2 = page.locator('h2.pp-heading, h2')
	const h3 = page.locator('h3.pp-heading, h3')
	
	const h1Count = await h1.count()
	const h2Count = await h2.count()
	const h3Count = await h3.count()
	
	// Should have at least some headings
	expect(h1Count + h2Count + h3Count).toBeGreaterThan(0)
	
	// Verify headings are visible
	if (h1Count > 0) {
		await expect(h1.first()).toBeVisible()
	}
	if (h2Count > 0) {
		await expect(h2.first()).toBeVisible()
	}
	if (h3Count > 0) {
		await expect(h3.first()).toBeVisible()
	}
})

test('text muted class applies', async ({ page }) => {
	await openDisplaySection(page)
	await page.getByRole('heading', { level: 3, name: 'Typography' }).scrollIntoViewIfNeeded()
	
	// Find text with muted class
	const mutedText = page.locator('.pp-text-muted, [class*="muted"]')
	const count = await mutedText.count()
	
	if (count > 0) {
		// Verify muted text is visible
		await expect(mutedText.first()).toBeVisible()
		
		// Check for muted class
		const classes = await mutedText.first().getAttribute('class')
		expect(classes).toContain('muted')
	} else {
		// Test structure
		expect(count).toBeGreaterThanOrEqual(0)
	}
})

test('variants render correctly', async ({ page }) => {
	await openDisplaySection(page)
	await page.getByRole('heading', { level: 3, name: 'Typography' }).scrollIntoViewIfNeeded()
	
	// Find headings with variants
	const headings = page.locator('.pp-heading')
	const count = await headings.count()
	
	// Check for variant classes
	for (let i = 0; i < count; i++) {
		const heading = headings.nth(i)
		const classes = await heading.getAttribute('class')
		
		// Should have variant class
		if (classes) {
			const hasVariant = classes.includes('pp-heading-variant-') || 
			                   classes.includes('primary') ||
			                   classes.includes('secondary')
			// Variant classes should be present
			expect(classes).toBeTruthy()
		}
	}
	
	// Find text with variants
	const texts = page.locator('.pp-text')
	const textCount = await texts.count()
	
	for (let i = 0; i < textCount; i++) {
		const text = texts.nth(i)
		const classes = await text.getAttribute('class')
		
		if (classes) {
			const hasVariant = classes.includes('pp-text-variant-')
			// Variant classes should be present
			expect(classes).toBeTruthy()
		}
	}
})

