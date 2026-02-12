import { test, expect } from '@playwright/test'

test.describe('Main demo components', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')
	})

	test('counter component renders shared state snapshot', async ({ page }) => {
		await expect(page.locator('#app')).toContainText('Counter Component (JSX)')

		const counterText = page.locator('#app .counter-text')
		await expect(counterText).toHaveText('5')

		const sharedInput = page.locator('#app input[type="number"]').first()
		await expect(sharedInput).toHaveValue('5')

		const slider = page.locator('#app .slider')
		await expect(slider).toBeVisible()
	})

	test('todo workflow adds items', async ({ page }) => {
		const todoInput = page.locator('#app .todo-input')
		await todoInput.fill('Write Playwright tests')
		await expect(todoInput).toHaveValue('Write Playwright tests')
		await page.locator('#app .add-button').click()
		await expect(todoInput).toHaveValue('')

		const todoItems = page.locator('#app .todo-item')
		await expect(todoItems).toHaveCount(1)
		await expect(todoItems.first().locator('.todo-text')).toHaveText('Write Playwright tests')
	})

	test('todo checkbox tick and untick', async ({ page }) => {
		const todoInput = page.locator('#app .todo-input')
		await todoInput.fill('Test checkbox')
		await page.locator('#app .add-button').click()

		const todoItem = page.locator('#app .todo-item').first()
		const checkbox = todoItem.locator('input[type="checkbox"]')
		const todoText = todoItem.locator('.todo-text')

		// Initial: unchecked
		await expect(checkbox).not.toBeChecked()
		await expect(todoText).not.toHaveClass(/completed/)

		// Tick
		await checkbox.click()
		await expect(checkbox).toBeChecked()
		await expect(todoText).toHaveClass(/completed/)

		// Untick
		await checkbox.click()
		await expect(checkbox).not.toBeChecked()
		await expect(todoText).not.toHaveClass(/completed/)
	})

	test('mini counter Remove All appears after adding item', async ({ page }) => {
		const removeAll = page.locator('#mini button.remove-all')
		await expect(removeAll).not.toBeVisible()

		await page.locator('#mini button.add').click()
		await expect(removeAll).toBeVisible()
		await expect(removeAll).toHaveText('Remove All')
	})

	test('todo adding second item updates the list', async ({ page }) => {
		const todoInput = page.locator('#app .todo-input')
		const addButton = page.locator('#app .add-button')
		const todoItems = page.locator('#app .todo-item')

		await todoInput.fill('First')
		await addButton.click()
		await expect(todoItems).toHaveCount(1)

		await todoInput.fill('Second')
		await addButton.click()
		await expect(todoItems).toHaveCount(2)
		await expect(todoItems.nth(1).locator('.todo-text')).toHaveText('Second')
	})

	test('todo remove then re-add shows new value', async ({ page }) => {
		const todoInput = page.locator('#app .todo-input')
		const addButton = page.locator('#app .add-button')
		const todoItems = page.locator('#app .todo-item')

		await todoInput.fill('a')
		await addButton.click()
		await expect(todoItems).toHaveCount(1)
		await expect(todoItems.first().locator('.todo-text')).toHaveText('a')

		// Delete it
		await todoItems.first().locator('.delete-button').click()
		await expect(todoItems).toHaveCount(0)

		// Add a different one
		await todoInput.fill('b')
		await addButton.click()
		await expect(todoItems).toHaveCount(1)
		await expect(todoItems.first().locator('.todo-text')).toHaveText('b')
	})

	test('clear completed button appears and works', async ({ page }) => {
		const todoInput = page.locator('#app .todo-input')
		const addButton = page.locator('#app .add-button')
		const clearSection = page.locator('#app .clear-section')

		// No clear button initially
		await expect(clearSection).not.toBeVisible()

		// Add and complete a todo
		await todoInput.fill('Complete me')
		await addButton.click()
		const checkbox = page.locator('#app .todo-item').first().locator('input[type="checkbox"]')
		await checkbox.click()

		// Clear section should appear
		await expect(clearSection).toBeVisible()
		await expect(clearSection.locator('.clear-button')).toContainText('Clear 1 completed')

		// Click clear
		await clearSection.locator('.clear-button').click()
		await expect(page.locator('#app .todo-item')).toHaveCount(0)
		await expect(clearSection).not.toBeVisible()
	})
})

