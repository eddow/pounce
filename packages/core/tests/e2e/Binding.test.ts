import { test, expect } from '@playwright/test'

test.describe('2-Way Binding', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#Binding')
		await page.waitForSelector('#tests [data-testid="binding-display"]')
	})

	test('initial state displays correct value', async ({ page }) => {
		const display = page.locator('[data-testid="binding-display"]')
		await expect(display).toContainText('Current value: initial')
	})

	test('typing in input1 updates display and input2', async ({ page }) => {
		const input1 = page.locator('[data-testid="input1"]')
		const input2 = page.locator('[data-testid="input2"]')
		const display = page.locator('[data-testid="binding-display"]')
		
		await input1.click()
		await input1.fill('test value')
		
		// Check display updates
		await expect(display).toContainText('Current value: test value')
		
		// Check input2 updates
		await expect(input2).toHaveValue('test value')
	})

	test('typing in input2 updates display and input1', async ({ page }) => {
		const input1 = page.locator('[data-testid="input1"]')
		const input2 = page.locator('[data-testid="input2"]')
		const display = page.locator('[data-testid="binding-display"]')
		
		await input2.click()
		await input2.fill('another value')
		
		// Check display updates
		await expect(display).toContainText('Current value: another value')
		
		// Check input1 updates
		await expect(input1).toHaveValue('another value')
	})

	test('programmatic update via fixture controls', async ({ page }) => {
		const input1 = page.locator('[data-testid="input1"]')
		const input2 = page.locator('[data-testid="input2"]')
		const display = page.locator('[data-testid="binding-display"]')
		
		// Update via fixture
		await page.evaluate(() => window.__bindingFixture?.setValue('programmatic'))
		
		// Check all update
		await expect(display).toContainText('Current value: programmatic')
		await expect(input1).toHaveValue('programmatic')
		await expect(input2).toHaveValue('programmatic')
	})

	test('reset restores initial state', async ({ page }) => {
		const input1 = page.locator('[data-testid="input1"]')
		const display = page.locator('[data-testid="binding-display"]')
		
		// Change value
		await input1.click()
		await input1.fill('changed')
		await expect(display).toContainText('Current value: changed')
		
		// Reset
		await page.click('[data-action="reset"]')
		await expect(display).toContainText('Current value: initial')
		await expect(input1).toHaveValue('initial')
	})
})

test.describe('Textarea 2-Way Binding', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#Binding')
		await page.waitForSelector('#tests [data-testid="textarea1"]')
	})

	test('textarea has initial value', async ({ page }) => {
		const textarea = page.locator('[data-testid="textarea1"]')
		const display = page.locator('[data-testid="textarea-display"]')
		await expect(textarea).toHaveValue('initial textarea')
		await expect(display).toContainText('initial textarea')
	})

	test('typing in textarea updates reactive state', async ({ page }) => {
		const textarea = page.locator('[data-testid="textarea1"]')
		const display = page.locator('[data-testid="textarea-display"]')

		await textarea.click()
		await textarea.fill('new textarea content')

		await expect(display).toContainText('new textarea content')
		const stateValue = await page.evaluate(() => window.__bindingFixture?.getTextareaValue())
		expect(stateValue).toBe('new textarea content')
	})

	test('programmatic update reflects in textarea', async ({ page }) => {
		const textarea = page.locator('[data-testid="textarea1"]')

		await page.evaluate(() => {
			window.__bindingFixture?.reset()
		})
		await expect(textarea).toHaveValue('initial textarea')
	})
})

test.describe('Select 2-Way Binding', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#Binding')
		await page.waitForSelector('#tests [data-testid="select1"]')
	})

	test('select has initial value', async ({ page }) => {
		const select = page.locator('[data-testid="select1"]')
		const display = page.locator('[data-testid="select-display"]')
		await expect(select).toHaveValue('b')
		await expect(display).toContainText('b')
	})

	test('changing select updates reactive state', async ({ page }) => {
		const select = page.locator('[data-testid="select1"]')
		const display = page.locator('[data-testid="select-display"]')

		await select.selectOption('c')

		await expect(display).toContainText('c')
		const stateValue = await page.evaluate(() => window.__bindingFixture?.getSelectValue())
		expect(stateValue).toBe('c')
	})

	test('programmatic update reflects in select', async ({ page }) => {
		const select = page.locator('[data-testid="select1"]')

		await page.evaluate(() => {
			window.__bindingFixture?.reset()
		})
		await expect(select).toHaveValue('b')
	})
})
