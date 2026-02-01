import { expect, test } from '@playwright/test'

const openMenu = async (page: any) => {
	const burger = page.getByRole('button', { name: 'Open navigation' })
	if (await burger.isVisible()) {
		await burger.click()
	}
}

test('shows Overview by default and supports navigation links', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
	// Open the menu dropdown first (summary element)
	await openMenu(page)
	// Then find and click the Interaction item
	const interactionLink = page.getByRole('menuitem', { name: 'Interaction' })
	await interactionLink.click()
	await expect(page).toHaveURL(/\/interaction$/)
	await expect(page.getByRole('heading', { level: 2, name: 'Dialog' })).toBeVisible()
})

// Route navigation
test('all menu items navigate to correct routes', async ({ page }) => {
	await page.goto('/')
	
	const routes = [
		{ name: 'Display', path: '/display', heading: 'Display' },
		{ name: 'Forms', path: '/forms', heading: 'Forms' },
		{ name: 'Interaction', path: '/interaction', heading: 'Dialog' },
		{ name: 'Dockview', path: '/dockview', heading: 'Dockview' },
		{ name: 'Toolbar', path: '/toolbar', heading: 'Toolbars' },
	]
	
	for (const route of routes) {
		await openMenu(page)
		// Use exact match to avoid matching "Dockview Harsh" when looking for "Dockview"
		const link = page.getByRole('menuitem', { name: route.name, exact: true })
		await link.click()
		await expect(page).toHaveURL(new RegExp(`${route.path.replace('/', '\\/')}$`))
		const expectedLevel = route.name === 'Interaction' ? 2 : 1
		await expect(page.getByRole('heading', { level: expectedLevel, name: route.heading })).toBeVisible()
	}
})

test('browser back/forward buttons work', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
	
	// Navigate to a route
	await openMenu(page)
	await page.getByRole('menuitem', { name: 'Display' }).click()
	await expect(page).toHaveURL(/\/display$/)
	
	// Go back
	await page.goBack()
	await expect(page).toHaveURL(/\/$/)
	await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
	
	// Go forward
	await page.goForward()
	await expect(page).toHaveURL(/\/display$/)
	await expect(page.getByRole('heading', { level: 1, name: 'Display' })).toBeVisible()
})

test('direct URL navigation works', async ({ page }) => {
	// Navigate directly to a route
	await page.goto('/forms')
	await expect(page.getByRole('heading', { level: 1, name: 'Forms' })).toBeVisible()
	
	// Navigate directly to another route
	await page.goto('/toolbar')
	await expect(page.getByRole('heading', { level: 1, name: 'Toolbars' })).toBeVisible()
	
	// Navigate to root
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
})

test('hash fragments preserved during navigation', async ({ page }) => {
	await page.goto('/#test-hash')
	
	// Navigate with hash
	await openMenu(page)
	await page.getByRole('menuitem', { name: 'Display' }).click()
	await expect(page).toHaveURL(/\/display#test-hash$/)
	
	// Navigate to another route
	await openMenu(page)
	await page.getByRole('menuitem', { name: 'Forms' }).click()
	await expect(page).toHaveURL(/\/forms#test-hash$/)
})

test('route changes update URL correctly', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveURL(/\/$/)
	
	// Navigate to Display
	await openMenu(page)
	await page.getByRole('menuitem', { name: 'Display' }).click()
	await expect(page).toHaveURL(/\/display$/)
	
	// Navigate to Forms
	await openMenu(page)
	await page.getByRole('menuitem', { name: 'Forms' }).click()
	await expect(page).toHaveURL(/\/forms$/)
	
	// Navigate back to Overview
	// Overview is not a menu item; navigate directly
	await page.goto('/')
	await expect(page).toHaveURL(/\/$/)
})

// Dark mode toggle
test('toggle button appears', async ({ page }) => {
	await page.goto('/')
	const toggleButton = page.getByRole('button', { name: 'Toggle dark mode' })
	await expect(toggleButton).toBeVisible()
})

test('clicking toggle changes theme', async ({ page }) => {
	await page.goto('/')
	const toggleButton = page.getByRole('button', { name: 'Toggle dark mode' })
	
	// Get initial theme
	const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme)
	
	// Click toggle
	await toggleButton.click()
	
	// Wait for theme change
	await page.waitForTimeout(100)
	
	// Get new theme
	const newTheme = await page.evaluate(() => document.documentElement.dataset.theme)
	
	// Theme should have changed
	expect(newTheme).not.toBe(initialTheme)
	expect(['dark', 'light']).toContain(newTheme)
})

test('theme persists across navigation', async ({ page }) => {
	await page.goto('/')
	const toggleButton = page.getByRole('button', { name: 'Toggle dark mode' })
	
	// Set theme to dark
	await toggleButton.click()
	await page.waitForTimeout(100)
	const themeAfterToggle = await page.evaluate(() => document.documentElement.dataset.theme)
	
	// Navigate to another route
	await openMenu(page)
	await page.getByRole('menuitem', { name: 'Display' }).click()
	await expect(page).toHaveURL(/\/display$/)
	
	// Theme should persist
	const themeAfterNav = await page.evaluate(() => document.documentElement.dataset.theme)
	expect(themeAfterNav).toBe(themeAfterToggle)
})

test('theme persists on page reload (via localStorage)', async ({ page }) => {
	await page.goto('/')
	const toggleButton = page.getByRole('button', { name: 'Toggle dark mode' })
	
	// Set theme
	await toggleButton.click()
	await page.waitForTimeout(100)
	const themeBeforeReload = await page.evaluate(() => document.documentElement.dataset.theme)
	
	// Reload page
	await page.reload()
	await page.waitForTimeout(100)
	
	// Theme should persist
	const themeAfterReload = await page.evaluate(() => document.documentElement.dataset.theme)
	expect(themeAfterReload).toBe(themeBeforeReload)
})

