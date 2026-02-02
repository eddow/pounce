import { test, expect } from '@playwright/test'

test.describe('Mini demo', () => {
	test.beforeEach(async ({ page }) => {
		page.on('console', (msg) => {
			console.log(`[BROWSER LOG]: ${msg.text()}`)
		})
		await page.goto('/')
	})

	test('mini counter adds and clears items', async ({ page }) => {
		const miniRoot = page.locator('#mini')
		await expect(miniRoot).toBeVisible()

		const miniInput = miniRoot.locator('input[type="text"]')
		await expect(miniInput).toBeVisible()

		const firstValue = await miniInput.inputValue()
		await miniRoot.locator('button.add').click()

		// List items are rendered as buttons with class "remove"
		const listItems = miniRoot.locator('button.remove')
		await expect(listItems).toHaveCount(1)
		await expect(listItems.first()).toContainText(firstValue)

		await miniInput.fill('Custom entry')
		await miniRoot.locator('button.add').click()
		await expect(listItems).toHaveCount(2)
		await expect(listItems.nth(1)).toContainText('Custom entry')

		const removeAllButton = miniRoot.locator('button.remove-all')
		await expect(removeAllButton).toBeVisible()
		await removeAllButton.click()
		// Wait a moment for reactivity to process
		await page.waitForTimeout(100)
		// After clearing, the display updates and button hides
		await expect(removeAllButton).toBeHidden()
		// All list items should be removed
		await expect(listItems).toHaveCount(0)
	})

	test('mini counter handles middle and last removal', async ({ page }) => {
		const miniRoot = page.locator('#mini')
		const miniInput = miniRoot.locator('input[type="text"]')
		const addButton = miniRoot.locator('button.add')
		const listItems = miniRoot.locator('button.remove')

		// Add 3 items
		await miniInput.fill('Item 1')
		await addButton.click()
		await miniInput.fill('Item 2')
		await addButton.click()
		await miniInput.fill('Item 3')
		await addButton.click()

		await expect(listItems).toHaveCount(3)
		await expect(listItems.nth(0)).toContainText('Item 1')
		await expect(listItems.nth(1)).toContainText('Item 2')
		await expect(listItems.nth(2)).toContainText('Item 3')

		// Remove middle item (Item 2)
		await listItems.nth(1).click()
		await expect(listItems).toHaveCount(2)
		await expect(listItems.nth(0)).toContainText('Item 1')
		await expect(listItems.nth(1)).toContainText('Item 3')

		// Remove last item (Item 3)
		await listItems.nth(1).click()
		await expect(listItems).toHaveCount(1)
		await expect(listItems.nth(0)).toContainText('Item 1')

		// Remove remaining item
		await listItems.nth(0).click()
		await expect(listItems).toHaveCount(0)
	})

	test('resize sandbox renders helper copy', async ({ page }) => {
		const resizeSection = page.locator('#mini').locator('text=Resize me')
		await expect(resizeSection).toBeVisible()
		await expect(page.locator('#mini')).toContainText('Resize Sandbox')
	})
})


