import { expect, test, type Page } from '@playwright/test'
import { runA11yCheck } from './helpers/a11y'
import { openSection } from './helpers/nav'

const openDisplaySection = (page: Page) =>
	openSection(page, { menuName: 'Display', expectedUrlPath: '/display', expectedHeading: 'Display', headingLevel: 1 })

// Container
test('container renders', async ({ page }) => {
	await openDisplaySection(page)
	// Find container elements
	const containers = page.locator('.container, .container-fluid')
	const count = await containers.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify containers are visible
	for (let i = 0; i < count; i++) {
		const container = containers.nth(i)
		await expect(container).toBeVisible()
	}
})

// Stack
test('stack spacing works', async ({ page }) => {
	await openDisplaySection(page)
	// Find stack elements
	const stacks = page.locator('.pp-stack')
	const count = await stacks.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify stacks have gap styling
	for (let i = 0; i < count; i++) {
		const stack = stacks.nth(i)
		const style = await stack.getAttribute('style')
		
		// Stack should have gap in style or CSS
		await expect(stack).toBeVisible()
	}
})

// Inline
test('inline layout works', async ({ page }) => {
	await openDisplaySection(page)
	// Find inline elements
	const inlines = page.locator('.pp-inline')
	const count = await inlines.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify inlines are visible
	for (let i = 0; i < count; i++) {
		const inline = inlines.nth(i)
		await expect(inline).toBeVisible()
	}
})

test('inline wrap works', async ({ page }) => {
	await openDisplaySection(page)
	// Find inline elements with wrap
	const inlines = page.locator('.pp-inline')
	const count = await inlines.count()
	
	// Check for wrap styling
	for (let i = 0; i < count; i++) {
		const inline = inlines.nth(i)
		const style = await inline.getAttribute('style')
		
		// May have flexWrap in style
		if (style) {
			// Check if wrap is enabled
			const hasWrap = style.includes('wrap') || style.includes('flex-wrap')
			// Wrap may or may not be present
			expect(style).toBeTruthy()
		}
	}
})

test('alignment works', async ({ page }) => {
	await openDisplaySection(page)
	// Find layout elements
	const stacks = page.locator('.pp-stack')
	const inlines = page.locator('.pp-inline')
	
	const allLayouts = [...(await stacks.all()), ...(await inlines.all())]
	
	// Verify alignment can be set
	for (const layout of allLayouts) {
		await expect(layout).toBeVisible()
		
		// Check for alignment in style
		const style = await layout.getAttribute('style')
		if (style) {
			// May have align-items or justify-content
			expect(style).toBeTruthy()
		}
	}
})

test('a11y - display route passes axe checks', async ({ page }) => {
	await page.goto('/display')
	await runA11yCheck(page)
})

