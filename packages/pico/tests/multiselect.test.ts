import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } })

const openFormsPage = async (page: Page) => {
	await page.goto('/forms')
}

test('multiselect opens and closes', async ({ page }) => {
	await openFormsPage(page)
	
	const summary = page.locator('summary', { hasText: /Select Fruits/ })
	const details = page.locator('details.pp-multiselect')
	
	// Initially closed
	await expect(details).not.toHaveAttribute('open')
	
	// Click to open
	await summary.click()
	await expect(details).toHaveAttribute('open', '')
	
	// Click summary again to close
	await summary.click()
	await expect(details).not.toHaveAttribute('open')
})

test('multiselect toggles items', async ({ page }) => {
	await openFormsPage(page)
	
	const summary = page.locator('summary', { hasText: /Select Fruits/ })
	await summary.click()
	
	const menu = page.locator('ul[role="listbox"]')
	const apple = menu.getByText('Apple')
	
	// Initial state: not checked
	const appleCheckIcon = apple.getByText('✓')
	await expect(appleCheckIcon).not.toBeVisible()
	
	// Click Apple
	await apple.click()
	
	// Should update button text (reactivity check)
	await expect(summary).toContainText('Select Fruits (1)')
	
	// Should show checkmark icon
	await expect(appleCheckIcon).toBeVisible()
	
	// Stays open by default (closeOnSelect=true default, but demo might use different state?)
	// In demo: `closeOnSelect: false` init state. So it stays open.
	const details = page.locator('details.pp-multiselect')
	await expect(details).toHaveAttribute('open', '')
	
	// Click again to deselect
	await apple.click()
	await expect(appleCheckIcon).not.toBeVisible()
	await expect(summary).toContainText('Select Fruits (0)')
})

test('multiselect closeOnSelect behavior', async ({ page }) => {
	await openFormsPage(page)
	
	const summary = page.locator('summary', { hasText: /Select Fruits/ })
	const details = page.locator('details.pp-multiselect')
	
	// Enable "Close on select" via checkbox
	const closeOnSelectCheckbox = page.getByLabel('Close on select')
	// Check if already checked? Demo starts with false.
	await closeOnSelectCheckbox.check() // Force check (should set state=true)
	
	// Open multiselect
	await summary.click()
	
	// Select "Banana"
	const banana = page.getByText('Banana')
	await banana.click()
	
	// Should validly select
	await expect(summary).toContainText('Select Fruits (1)')
	
	// Should have closed
	await expect(details).not.toHaveAttribute('open')
})
