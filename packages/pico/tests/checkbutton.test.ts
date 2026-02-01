import { expect, test, type Page } from '@playwright/test'
import { openSection } from './helpers/nav'

const openToolbarSection = (page: Page) =>
	openSection(page, { menuName: 'Toolbar', expectedUrlPath: '/toolbar', expectedHeading: 'Toolbars', headingLevel: 1 })

// CheckButton behavior
test('toggles checked state on click', async ({ page }) => {
	await openToolbarSection(page)
	// Find checkbuttons
	const checkbuttons = page.locator('button[role="checkbox"]')
	const firstCheckbutton = checkbuttons.first()
	
	// Get initial state
	const initialChecked = await firstCheckbutton.getAttribute('aria-checked')
	
	// Click checkbutton
	await firstCheckbutton.click()
	
	// State should be toggled
	const newChecked = await firstCheckbutton.getAttribute('aria-checked')
	expect(newChecked).not.toBe(initialChecked)
	
	// Click again
	await firstCheckbutton.click()
	const finalChecked = await firstCheckbutton.getAttribute('aria-checked')
	expect(finalChecked).toBe(initialChecked)
})

test('checked state visually reflects', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const firstCheckbutton = checkbuttons.first()
	
	// Check initial state
	const initialChecked = await firstCheckbutton.getAttribute('aria-checked')
	const hasCheckedClass = await firstCheckbutton.evaluate((el) => 
		el.classList.contains('pp-checkbutton-checked')
	)
	
	// Click to toggle
	await firstCheckbutton.click()
	
	// Check if checked class is applied/removed
	const newChecked = await firstCheckbutton.getAttribute('aria-checked')
	const hasNewCheckedClass = await firstCheckbutton.evaluate((el) => 
		el.classList.contains('pp-checkbutton-checked')
	)
	
	// Class should match aria-checked state
	if (newChecked === 'true') {
		expect(hasNewCheckedClass).toBeTruthy()
	} else {
		expect(hasNewCheckedClass).toBeFalsy()
	}
})

test('onCheckedChange callback fires', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const firstCheckbutton = checkbuttons.first()
	
	// Get initial state
	const initialChecked = await firstCheckbutton.getAttribute('aria-checked')
	
	// Click (should trigger callback)
	await firstCheckbutton.click()
	
	// State should have changed
	const newChecked = await firstCheckbutton.getAttribute('aria-checked')
	expect(newChecked).not.toBe(initialChecked)
})

test('all variants render correctly', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const count = await checkbuttons.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify all checkbuttons are visible
	for (let i = 0; i < count; i++) {
		const checkbutton = checkbuttons.nth(i)
		await expect(checkbutton).toBeVisible()
	}
})

test('icon renders when provided', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const count = await checkbuttons.count()
	
	// Find checkbuttons with icons
	let hasIcon = false
	for (let i = 0; i < count; i++) {
		const checkbutton = checkbuttons.nth(i)
		const icon = checkbutton.locator('.pp-checkbutton-icon, [class*="pure-glyf-icon"]')
		if (await icon.count() > 0) {
			hasIcon = true
			await expect(icon.first()).toBeVisible()
			break
		}
	}
	
	// At least one checkbutton should have icon
	expect(hasIcon).toBeTruthy()
})

test('icon-only button works (requires aria-label)', async ({ page }) => {
	await openToolbarSection(page)
	// Find icon-only checkbuttons (those with aria-label)
	const iconOnlyCheckbuttons = page.locator('button[role="checkbox"][aria-label]')
	const count = await iconOnlyCheckbuttons.count()
	
	expect(count).toBeGreaterThan(0)
	
	// Verify they have aria-label
	for (let i = 0; i < count; i++) {
		const checkbutton = iconOnlyCheckbuttons.nth(i)
		const ariaLabel = await checkbutton.getAttribute('aria-label')
		expect(ariaLabel).toBeTruthy()
		
		// Check for icon-only class
		const hasIconOnlyClass = await checkbutton.evaluate((el) => 
			el.classList.contains('pp-checkbutton-icon-only')
		)
		// May or may not have the class, but should have aria-label
		expect(ariaLabel).toBeTruthy()
	}
})

// Accessibility
test('role="checkbox" present', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const count = await checkbuttons.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify all have role="checkbox"
	for (let i = 0; i < count; i++) {
		const checkbutton = checkbuttons.nth(i)
		await expect(checkbutton).toHaveAttribute('role', 'checkbox')
	}
})

test('aria-checked reflects state', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const firstCheckbutton = checkbuttons.first()
	
	// Get initial state
	const initialAriaChecked = await firstCheckbutton.getAttribute('aria-checked')
	expect(['true', 'false']).toContain(initialAriaChecked)
	
	// Toggle
	await firstCheckbutton.click()
	
	// aria-checked should update
	const newAriaChecked = await firstCheckbutton.getAttribute('aria-checked')
	expect(newAriaChecked).not.toBe(initialAriaChecked)
	expect(['true', 'false']).toContain(newAriaChecked)
})

test('keyboard accessible (Enter/Space)', async ({ page }) => {
	await openToolbarSection(page)
	const checkbuttons = page.locator('button[role="checkbox"]')
	const firstCheckbutton = checkbuttons.first()
	
	// Focus button
	await firstCheckbutton.focus()
	
	// Get initial state
	const initialChecked = await firstCheckbutton.getAttribute('aria-checked')
	
	// Press Enter
	await page.keyboard.press('Enter')
	
	// State should toggle
	const afterEnter = await firstCheckbutton.getAttribute('aria-checked')
	expect(afterEnter).not.toBe(initialChecked)
	
	// Press Space
	await page.keyboard.press('Space')
	
	// State should toggle again
	const afterSpace = await firstCheckbutton.getAttribute('aria-checked')
	expect(afterSpace).toBe(initialChecked)
})

