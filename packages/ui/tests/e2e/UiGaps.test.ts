import { type Page, test, expect } from '@playwright/test'

const dt = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)

test.describe('Button', () => {
	test('clicks increment counter and disabled blocks them', async ({ page }) => {
		await page.goto('/')

		const btn = dt(page, 'model-button')
		const toggle = dt(page, 'toggle-disabled')
		const count = dt(page, 'click-count')

		await expect(count).toContainText('0')
		await btn.click()
		await expect(count).toContainText('1')

		await toggle.click()
		await expect(btn).toBeDisabled()

		await btn.click({ force: true })
		await expect(count).toContainText('1')
	})
})

test.describe('Checkbox', () => {
	test('check, indeterminate, and disabled states', async ({ page }) => {
		await page.goto('/checkbox')

		const input = dt(page, 'checkbox-input')
		const status = dt(page, 'checkbox-status')
		const toggleDisabled = dt(page, 'toggle-disabled')
		const toggleIndeterminate = dt(page, 'toggle-indeterminate')

		await expect(status).toContainText('Unchecked')
		await input.check()
		await expect(status).toContainText('Checked')

		await toggleIndeterminate.click()
		await expect(status).toContainText('(Indeterminate)')
		await expect(input).toHaveJSProperty('indeterminate', true)

		await toggleDisabled.click()
		await expect(input).toBeDisabled()
	})
})

test.describe('Select', () => {
	test('value changes on selection', async ({ page }) => {
		await page.goto('/select')

		const select = dt(page, 'select-input')
		const value = dt(page, 'select-value')

		await expect(value).toHaveText('blue')
		await select.selectOption('green')
		await expect(value).toHaveText('green')
	})
})

test.describe('Overlay', () => {
	test('open and dismiss dialog', async ({ page }) => {
		await page.goto('/overlay')

		const open = dt(page, 'open-overlay')
		const dialog = dt(page, 'overlay-dialog')
		const dismiss = dt(page, 'dismiss-overlay')

		await open.click()
		await expect(dialog).toBeVisible()

		await dismiss.click()
		await expect(dialog).not.toBeVisible()
	})
})
