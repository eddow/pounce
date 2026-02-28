import { test, expect } from '@playwright/test'

test.describe('UI Feature Gaps', () => {
	test('Button model handles clicks and disabled state', async ({ page }) => {
		await page.goto('/#Button')
		await page.waitForSelector('[data-testid="test-button"]')
		
		const button = page.locator('[data-testid="test-button"]')
		const count = page.locator('[data-testid="click-count"]')
		
		await expect(count).toHaveText('0')
		await button.click()
		await expect(count).toHaveText('1')
		
		await page.click('[data-action="toggle-disabled"]')
		await expect(button).toBeDisabled()
		
		// Clicking disabled button shouldn't increment
		await button.click({ force: true })
		await expect(count).toHaveText('1')
		
		await page.click('[data-action="change-label"]')
		await expect(button).toHaveText('Value Changed')
	})

	test('Checkbox model handles checked and indeterminate states', async ({ page }) => {
		await page.goto('/#Checkbox')
		const checkbox = page.locator('[data-testid="test-checkbox"]')
		const status = page.locator('[data-testid="status-text"]')
		
		await expect(status).toHaveText('Unchecked')
		await checkbox.check()
		await expect(status).toHaveText('Checked')
		
		await page.click('[data-action="toggle-indeterminate"]')
		await expect(status).toContainText('(Indeterminate)')
		await expect(checkbox).toHaveJSProperty('indeterminate', true)
		
		await page.click('[data-action="toggle-disabled"]')
		await expect(checkbox).toBeDisabled()
	})

	test('Select model handles value changes', async ({ page }) => {
		await page.goto('/#Select')
		const select = page.locator('[data-testid="test-select"]')
		const display = page.locator('[data-testid="selected-value"]')
		
		await expect(display).toHaveText('a')
		await select.selectOption('c')
		await expect(display).toHaveText('c')
		
		await page.click('[data-action="select-b"]')
		await expect(select).toHaveValue('b')
		await expect(display).toHaveText('b')
	})

	test('Overlay stack and dialog lifecycle', async ({ page }) => {
		await page.goto('/#Overlay')
		const status = page.locator('[data-testid="last-action"]')
		const isOpen = page.locator('[data-testid="is-open"]')
		
		await expect(isOpen).toHaveText('No')
		await page.click('[data-action="open-dialog"]')
		
		await expect(isOpen).toHaveText('Yes')
		await expect(page.locator('[data-testid="test-dialog-content"]')).toBeVisible()
		
		await page.click('[data-action="close-dialog"]')
		await expect(isOpen).toHaveText('No')
		await expect(status).toHaveText('Closed via button')
	})

	test('Dockview widget rendering and state changes', async ({ page }) => {
		page.on('console', msg => console.log('PAGE LOG:', msg.text()))
		page.on('pageerror', err => console.log('PAGE ERROR:', err))
		await page.goto('/#Dockview')
		const initPanelsBtn = page.locator('[data-action="init-panels"]')
		const updateTitleBtn = page.locator('[data-action="update-title"]')
		const dockviewTheme = page.locator('.dockview-theme-light')
		
		await expect(dockviewTheme).toBeVisible()
		
		await initPanelsBtn.click()
		
		const title = page.locator('[data-testid="widget-title"]')
		const content = page.locator('[data-testid="widget-content"]')
		
		await expect(title).toHaveText('Test Panel 1')
		await expect(content).toHaveText('Hello Dockview')
		
		await updateTitleBtn.click()
		
		await expect(title).toHaveText('Updated Title')
	})
})
