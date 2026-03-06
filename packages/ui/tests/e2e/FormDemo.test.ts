import { type Page, test, expect } from '@playwright/test'

const dt = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)

test.describe('Form Demo', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('button clicks and disabled state', async ({ page }) => {
		await expect(dt(page, 'btn-count')).toContainText('0')
		await dt(page, 'btn').click()
		await dt(page, 'btn').click()
		await expect(dt(page, 'btn-count')).toContainText('2')
		await expect(dt(page, 's-clicks')).toContainText('2')

		// Disable
		await dt(page, 'btn-toggle').click()
		await expect(dt(page, 'btn')).toBeDisabled()
		await expect(dt(page, 'btn')).toHaveCSS('opacity', '0.5')
		await expect(dt(page, 'btn')).toHaveCSS('cursor', 'not-allowed')
		await dt(page, 'btn').click({ force: true })
		await expect(dt(page, 'btn-count')).toContainText('2')

		// Re-enable
		await dt(page, 'btn-toggle').click()
		await expect(dt(page, 'btn')).not.toBeDisabled()
		await expect(dt(page, 'btn')).toHaveCSS('opacity', '1')
		await dt(page, 'btn').click()
		await expect(dt(page, 'btn-count')).toContainText('3')
	})

	test('checkbutton toggles update shared state', async ({ page }) => {
		await expect(dt(page, 's-wifi')).toContainText('on')
		await expect(dt(page, 's-notifications')).toContainText('off')

		await expect(dt(page, 'checkbtn-wifi')).toHaveAttribute('aria-checked', 'true')
		await expect(dt(page, 'checkbtn-notifications')).toHaveAttribute('aria-checked', 'false')

		await dt(page, 'checkbtn-wifi').click()
		await expect(dt(page, 'checkbtn-wifi')).toHaveAttribute('aria-checked', 'false')
		await expect(dt(page, 's-wifi')).toContainText('off')

		await dt(page, 'checkbtn-notifications').click()
		await expect(dt(page, 'checkbtn-notifications')).toHaveAttribute('aria-checked', 'true')
		await expect(dt(page, 's-notifications')).toContainText('on')
	})

	test('checkbox group with master/indeterminate', async ({ page }) => {
		const master = dt(page, 'master')
		const status = dt(page, 'toppings-status')
		await expect(dt(page, 'toppings-group')).toHaveAttribute('role', 'group')
		await expect(dt(page, 'toppings-group')).toHaveAttribute('aria-label', 'Pizza toppings')

		// Initially: none selected, master unchecked
		await expect(master).not.toBeChecked()
		await expect(status).toContainText('0/3')

		// Select one → master becomes indeterminate
		await dt(page, 'topping-cheese').click()
		await expect(status).toContainText('1/3')
		const indet1 = await master.evaluate((el: HTMLInputElement) => el.indeterminate)
		expect(indet1).toBe(true)

		// Select all → master checked, not indeterminate
		await dt(page, 'topping-pepperoni').click()
		await dt(page, 'topping-mushrooms').click()
		await expect(status).toContainText('3/3')
		await expect(master).toBeChecked()
		const indet2 = await master.evaluate((el: HTMLInputElement) => el.indeterminate)
		expect(indet2).toBe(false)

		// Master uncheck → clears all
		await master.click()
		await expect(status).toContainText('0/3')
		await expect(dt(page, 'topping-cheese')).not.toBeChecked()
		await expect(dt(page, 'topping-pepperoni')).not.toBeChecked()
		await expect(dt(page, 'topping-mushrooms')).not.toBeChecked()
		await expect(dt(page, 's-toppings')).toContainText('none')

		// Master check → selects all
		await master.click()
		await expect(status).toContainText('3/3')
		await expect(dt(page, 'topping-cheese')).toBeChecked()
		await expect(dt(page, 's-toppings')).toContainText('cheese, pepperoni, mushrooms')
	})

	test('radio and select share the same color value', async ({ page }) => {
		await expect(dt(page, 'color-radiogroup')).toHaveAttribute('role', 'radiogroup')
		await expect(dt(page, 'color-radiogroup')).toHaveAttribute('aria-label', 'Theme color')
		// Initially red
		await expect(dt(page, 'radio-red')).toHaveAttribute('aria-checked', 'true')
		await expect(dt(page, 'input-radio-red')).toBeChecked()
		await expect(dt(page, 'color-select')).toHaveValue('red')
		await expect(dt(page, 's-color')).toContainText('red')

		// Click radio → select follows
		await dt(page, 'radio-green').click()
		await expect(dt(page, 'radio-green')).toHaveAttribute('aria-checked', 'true')
		await expect(dt(page, 'radio-red')).toHaveAttribute('aria-checked', 'false')
		await expect(dt(page, 'input-radio-green')).toBeChecked()
		await expect(dt(page, 'color-select')).toHaveValue('green')
		await expect(dt(page, 's-color')).toContainText('green')

		// Change select → radio follows
		await dt(page, 'color-select').selectOption('blue')
		await expect(dt(page, 'radio-blue')).toHaveAttribute('aria-checked', 'true')
		await expect(dt(page, 'radio-green')).toHaveAttribute('aria-checked', 'false')
		await expect(dt(page, 'input-radio-blue')).toBeChecked()
		await expect(dt(page, 's-color')).toContainText('blue')

		// Change input radio → radio button + select follow
		await dt(page, 'input-radio-red').click()
		await expect(dt(page, 'radio-red')).toHaveAttribute('aria-checked', 'true')
		await expect(dt(page, 'color-select')).toHaveValue('red')
		await expect(dt(page, 's-color')).toContainText('red')
	})
})
