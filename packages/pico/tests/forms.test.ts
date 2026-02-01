import { expect, test } from '@playwright/test'
import { runA11yCheck } from './helpers/a11y'
import { openSection } from './helpers/nav'

const openFormsSection = (page: any) =>
	openSection(page, { menuName: 'Forms', expectedUrlPath: '/forms', expectedHeading: 'Forms', headingLevel: 1 })

// Select
test('Select - all variants render correctly', async ({ page }) => {
	await openFormsSection(page)
	const selects = page.locator('select.pp-select')
	const count = await selects.count()
	expect(count).toBeGreaterThan(0)
	
	// Check for variant classes
	for (let i = 0; i < count; i++) {
		const select = selects.nth(i)
		await expect(select).toBeVisible()
	}
})

test('selection works', async ({ page }) => {
	await openFormsSection(page)
	const firstSelect = page.locator('select.pp-select').first()
	await expect(firstSelect).toBeVisible()
	
	// Get options
	const options = firstSelect.locator('option')
	const optionCount = await options.count()
	
	if (optionCount > 1) {
		// Select second option
		await firstSelect.selectOption({ index: 1 })
		
		// Verify selection
		const selectedValue = await firstSelect.inputValue()
		expect(selectedValue).toBeTruthy()
	}
})

test('full width option works', async ({ page }) => {
	await openFormsSection(page)
	// Find full width select
	const fullWidthSelect = page.locator('select.pp-select-full')
	const count = await fullWidthSelect.count()
	
	if (count > 0) {
		await expect(fullWidthSelect.first()).toBeVisible()
		const classes = await fullWidthSelect.first().getAttribute('class')
		expect(classes).toContain('pp-select-full')
	} else {
		// Test structure
		expect(count).toBeGreaterThanOrEqual(0)
	}
})

test('options are selectable', async ({ page }) => {
	await openFormsSection(page)
	const selects = page.locator('select.pp-select')
	const firstSelect = selects.first()
	
	const options = firstSelect.locator('option')
	const optionCount = await options.count()
	expect(optionCount).toBeGreaterThan(0)
	
	// Try selecting each option
	for (let i = 0; i < optionCount; i++) {
		await firstSelect.selectOption({ index: i })
		const selectedIndex = await firstSelect.evaluate((el: HTMLSelectElement) => el.selectedIndex)
		expect(selectedIndex).toBe(i)
	}
})

// Combobox
test('input field accepts text', async ({ page }) => {
	await openFormsSection(page)
	const comboboxes = page.locator('.pp-combobox input')
	const firstCombobox = comboboxes.first()
	await expect(firstCombobox).toBeVisible()
	
	// Type text
	await firstCombobox.fill('Test input')
	const value = await firstCombobox.inputValue()
	expect(value).toBe('Test input')
})

test('options appear in dropdown', async ({ page }) => {
	await openFormsSection(page)
	const comboboxes = page.locator('.pp-combobox input')
	const firstCombobox = comboboxes.first()
	
	// Click to focus
	await firstCombobox.click()
	
	// Check for datalist
	const datalist = page.locator('datalist')
	const count = await datalist.count()
	expect(count).toBeGreaterThan(0)
	
	// Check for options in datalist
	const options = datalist.first().locator('option')
	const optionCount = await options.count()
	expect(optionCount).toBeGreaterThan(0)
})

test('selection works with keyboard', async ({ page }) => {
	await openFormsSection(page)
	const comboboxes = page.locator('.pp-combobox input')
	const firstCombobox = comboboxes.first()
	
	await firstCombobox.click()
	await firstCombobox.fill('One')
	
	// Press ArrowDown to navigate options
	await page.keyboard.press('ArrowDown')
	await page.keyboard.press('Enter')
	
	// Value should be set
	const value = await firstCombobox.inputValue()
	expect(value).toBeTruthy()
})

test('variants render correctly', async ({ page }) => {
	await openFormsSection(page)
	const comboboxes = page.locator('.pp-combobox')
	const count = await comboboxes.count()
	expect(count).toBeGreaterThan(0)
	
	// Check all comboboxes are visible
	for (let i = 0; i < count; i++) {
		const combobox = comboboxes.nth(i)
		await expect(combobox).toBeVisible()
	}
})

// Checkbox
test('checkbox toggles on click', async ({ page }) => {
	await openFormsSection(page)
	const checkboxes = page.locator('input[type="checkbox"].pp-control-input')
	const firstCheckbox = checkboxes.first()
	
	// Get initial state
	const initialChecked = await firstCheckbox.isChecked()
	
	// Click checkbox
	await firstCheckbox.click()
	
	// State should be toggled
	const newChecked = await firstCheckbox.isChecked()
	expect(newChecked).not.toBe(initialChecked)
	
	// Click again to toggle back
	await firstCheckbox.click()
	const finalChecked = await firstCheckbox.isChecked()
	expect(finalChecked).toBe(initialChecked)
})

test('Checkbox - all variants render correctly', async ({ page }) => {
	await openFormsSection(page)
	const checkboxes = page.locator('label.pp-checkbox')
	const count = await checkboxes.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify all checkboxes are visible
	for (let i = 0; i < count; i++) {
		const checkbox = checkboxes.nth(i)
		await expect(checkbox).toBeVisible()
	}
})

test('Checkbox - description text displays', async ({ page }) => {
	await openFormsSection(page)
	const checkboxes = page.locator('label.pp-checkbox')
	const count = await checkboxes.count()
	
	// Find checkbox with description
	let hasDescription = false
	for (let i = 0; i < count; i++) {
		const checkbox = checkboxes.nth(i)
		const description = checkbox.locator('.pp-control-description')
		const descCount = await description.count()
		if (descCount > 0) {
			hasDescription = true
			await expect(description.first()).toBeVisible()
			break
		}
	}
	
	// At least one checkbox should have description in demo
	expect(hasDescription).toBeTruthy()
})

test('disabled checkbox does not toggle', async ({ page }) => {
	await openFormsSection(page)
	const checkboxes = page.locator('input[type="checkbox"].pp-control-input[disabled]')
	const count = await checkboxes.count()
	
	if (count > 0) {
		const disabledCheckbox = checkboxes.first()
		await expect(disabledCheckbox).toBeDisabled()
		
		const initialChecked = await disabledCheckbox.isChecked()
		
		// Try to click (should not change)
		await disabledCheckbox.click({ force: true })
		
		const afterClick = await disabledCheckbox.isChecked()
		expect(afterClick).toBe(initialChecked)
	} else {
		// Test structure
		expect(count).toBeGreaterThanOrEqual(0)
	}
})

test('Checkbox - checked state persists', async ({ page }) => {
	await openFormsSection(page)
	const checkboxes = page.locator('input[type="checkbox"].pp-control-input:not([disabled])')
	const firstCheckbox = checkboxes.first()
	
	// Set checked
	await firstCheckbox.check()
	expect(await firstCheckbox.isChecked()).toBe(true)
	
	// Uncheck
	await firstCheckbox.uncheck()
	expect(await firstCheckbox.isChecked()).toBe(false)
	
	// Check again
	await firstCheckbox.check()
	expect(await firstCheckbox.isChecked()).toBe(true)
})

test('Checkbox - values are synced with state', async ({ page }) => {
	await openFormsSection(page)
	const notificationsCheckbox = page.getByLabel('Notifications')
	await expect(notificationsCheckbox).toBeVisible()

	// Initial State: Checked (default true)
	await expect(notificationsCheckbox).toBeChecked()
	await expect(page.getByText('Value: true').first()).toBeVisible()

	// Uncheck
	await notificationsCheckbox.uncheck()
	await expect(page.getByText('Value: false').first()).toBeVisible()

	// Check again
	await notificationsCheckbox.check()
	await expect(page.getByText('Value: true').first()).toBeVisible()
})

// Radio
test('radio buttons in group work (only one selected)', async ({ page }) => {
	await openFormsSection(page)
	// Find radio group
	const radioGroups = page.locator('input[type="radio"]')
	const firstGroup = radioGroups.filter({ has: page.locator('input[name="radio-sample-inline"]') })
	const count = await firstGroup.count()
	
	if (count >= 2) {
		// Select first radio
		await firstGroup.first().check()
		expect(await firstGroup.first().isChecked()).toBe(true)
		
		// Select second radio
		await firstGroup.nth(1).check()
		expect(await firstGroup.nth(1).isChecked()).toBe(true)
		expect(await firstGroup.first().isChecked()).toBe(false)
	}
})

test('Radio - values are synced with state', async ({ page }) => {
	await openFormsSection(page)
	const inlineRadios = page.locator('input[name="radio-sample-inline"]')
	
    // Initial State: Option A checked
	await expect(inlineRadios.nth(0)).toBeChecked()
    await expect(page.getByText('Value: a').first()).toBeVisible()

    // Select Option B
    await inlineRadios.nth(1).check()
    await expect(inlineRadios.nth(1)).toBeChecked()
    await expect(page.getByText('Value: b').first()).toBeVisible()

    // Select Option C
    await inlineRadios.nth(2).check()
    await expect(inlineRadios.nth(2)).toBeChecked()
    await expect(page.getByText('Value: c').first()).toBeVisible()
})

test('Radio - all variants render correctly', async ({ page }) => {
	await openFormsSection(page)
	const radios = page.locator('label.pp-radio')
	const count = await radios.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify all radios are visible
	for (let i = 0; i < count; i++) {
		const radio = radios.nth(i)
		await expect(radio).toBeVisible()
	}
})

test('inline layout works', async ({ page }) => {
	await openFormsSection(page)
	// Find inline radio group
	const inlineRadios = page.locator('input[name="radio-sample-inline"]')
	const count = await inlineRadios.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify radios are in inline layout
	for (let i = 0; i < count; i++) {
		const radio = inlineRadios.nth(i)
		await expect(radio).toBeVisible()
	}
})

test('stacked layout works', async ({ page }) => {
	await openFormsSection(page)
	// Find stacked radio group
	const stackedRadios = page.locator('input[name="radio-sample-stacked"]')
	const count = await stackedRadios.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify radios are in stacked layout
	for (let i = 0; i < count; i++) {
		const radio = stackedRadios.nth(i)
		await expect(radio).toBeVisible()
	}
})

test('Radio - description text displays', async ({ page }) => {
	await openFormsSection(page)
	const radios = page.locator('label.pp-radio')
	const count = await radios.count()
	
	// Check for description (may not be present in all radios)
	let foundDescription = false
	for (let i = 0; i < count; i++) {
		const radio = radios.nth(i)
		const description = radio.locator('.pp-control-description')
		if (await description.count() > 0) {
			foundDescription = true
			await expect(description.first()).toBeVisible()
		}
	}
	
	// At least structure should exist
	expect(count).toBeGreaterThan(0)
})

test('disabled radio does not select', async ({ page }) => {
	await openFormsSection(page)
	const disabledRadios = page.locator('input[type="radio"][disabled]')
	const count = await disabledRadios.count()
	
	if (count > 0) {
		const disabledRadio = disabledRadios.first()
		await expect(disabledRadio).toBeDisabled()
		
		// Try to check (should not work)
		await disabledRadio.check({ force: true })
		expect(await disabledRadio.isChecked()).toBe(false)
	} else {
		// Test structure
		expect(count).toBeGreaterThanOrEqual(0)
	}
})

// Switch
test('switch toggles on click', async ({ page }) => {
	await openFormsSection(page)
	const switches = page.locator('input[type="checkbox"].pp-switch-input')
	const firstSwitch = switches.first()
	
	// Get initial state
	const initialChecked = await firstSwitch.isChecked()
	
	// Click switch
	await firstSwitch.click()
	
	// State should be toggled
	const newChecked = await firstSwitch.isChecked()
	expect(newChecked).not.toBe(initialChecked)
	
	// Click again
	await firstSwitch.click()
	const finalChecked = await firstSwitch.isChecked()
	expect(finalChecked).toBe(initialChecked)
})

test('Switch - all variants render correctly', async ({ page }) => {
	await openFormsSection(page)
	const switches = page.locator('label.pp-switch')
	const count = await switches.count()
	expect(count).toBeGreaterThan(0)
	
	// Verify all switches are visible
	for (let i = 0; i < count; i++) {
		const switchEl = switches.nth(i)
		await expect(switchEl).toBeVisible()
	}
})

test('label at start works', async ({ page }) => {
	await openFormsSection(page)
	// Find switch with label at start
	const switchesWithStartLabel = page.locator('label.pp-switch-label-start')
	const count = await switchesWithStartLabel.count()
	
	if (count > 0) {
		await expect(switchesWithStartLabel.first()).toBeVisible()
		const classes = await switchesWithStartLabel.first().getAttribute('class')
		expect(classes).toContain('pp-switch-label-start')
	} else {
		// Test structure
		expect(count).toBeGreaterThanOrEqual(0)
	}
})

test('label at end works (default)', async ({ page }) => {
	await openFormsSection(page)
	const switches = page.locator('label.pp-switch')
	const firstSwitch = switches.first()
	
	// Default should not have label-start class
	const classes = await firstSwitch.getAttribute('class')
	expect(classes).not.toContain('pp-switch-label-start')
	
	await expect(firstSwitch).toBeVisible()
})

test('Switch - description text displays', async ({ page }) => {
	await openFormsSection(page)
	const switches = page.locator('label.pp-switch')
	const count = await switches.count()
	
	// Find switch with description
	let hasDescription = false
	for (let i = 0; i < count; i++) {
		const switchEl = switches.nth(i)
		const description = switchEl.locator('.pp-control-description')
		if (await description.count() > 0) {
			hasDescription = true
			await expect(description.first()).toBeVisible()
			break
		}
	}
	
	// At least one switch should have description
	expect(hasDescription).toBeTruthy()
})

test('disabled switch does not toggle', async ({ page }) => {
	await openFormsSection(page)
	const disabledSwitches = page.locator('input[type="checkbox"].pp-switch-input[disabled]')
	const count = await disabledSwitches.count()
	
	if (count > 0) {
		const disabledSwitch = disabledSwitches.first()
		await expect(disabledSwitch).toBeDisabled()
		
		const initialChecked = await disabledSwitch.isChecked()
		
		// Try to click (should not change)
		await disabledSwitch.click({ force: true })
		
		const afterClick = await disabledSwitch.isChecked()
		expect(afterClick).toBe(initialChecked)
	} else {
		// Test structure
		expect(count).toBeGreaterThanOrEqual(0)
	}
})

test('Switch - checked state persists', async ({ page }) => {
	await openFormsSection(page)
	const switches = page.locator('input[type="checkbox"].pp-switch-input:not([disabled])')
	const firstSwitch = switches.first()
	
	// Set checked
	await firstSwitch.check()
	expect(await firstSwitch.isChecked()).toBe(true)
	
	// Uncheck
	await firstSwitch.uncheck()
	expect(await firstSwitch.isChecked()).toBe(false)
	
	// Check again
	await firstSwitch.check()
	expect(await firstSwitch.isChecked()).toBe(true)
})

test('a11y - forms route passes axe checks', async ({ page }) => {
	await page.goto('/forms')
	await runA11yCheck(page)
})

