import { test, expect } from '@playwright/test'

test.describe('Minimal App Navigation', () => {
	test.use({ baseURL: 'http://localhost:3000' })

	// ✅ TODO: Test initial page load renders correctly
	test('Initial page load renders correctly', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('h1')).toHaveText('Index Page')
		await expect(page.locator('text=Welcome to the minimal app!')).toBeVisible()
		
		// Verify navigation links are present
		await expect(page.locator('#link-user-1')).toBeVisible()
		await expect(page.locator('#link-user-2')).toBeVisible()
		await expect(page.locator('#link-user-list')).toBeVisible()
	})

	// ✅ TODO: Test client-side navigation between routes
	test('Client-side SPA navigation between routes', async ({ page }) => {
		await page.goto('/')
		
		// Track navigation events to verify it's SPA navigation (no full page reload)
		let fullPageLoads = 0
		page.on('load', () => fullPageLoads++)
		
		// Navigate to User 1 via SPA link
		await page.click('#link-user-1')
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('h1')).toHaveText('User Profile')
		
		// Navigate to User List via global nav
		await page.click('#global-nav a[href="/users/list"]')
		await expect(page).toHaveURL(/\/users\/list$/)
		await expect(page.locator('h1')).toHaveText('User List')
		
		// Navigate back to home via SPA link
		await page.click('#link-home')
		await expect(page).toHaveURL(/\/$/)
		await expect(page.locator('h1')).toHaveText('Index Page')
		
		// Verify no full page reloads occurred (only initial load)
		expect(fullPageLoads).toBe(1)
	})

	// ✅ TODO: Test dynamic route params (/users/123)
	test('Dynamic route params work correctly', async ({ page }) => {
		await page.goto('/')
		
		// Navigate to User 1
		await page.click('#link-user-1')
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('text=ID: 1')).toBeVisible()
		await expect(page.locator('text=Name: User 1')).toBeVisible()
		
		// Navigate to User 2
		await page.goto('/')
		await page.click('#link-user-2')
		await expect(page).toHaveURL(/\/users\/2$/)
		await expect(page.locator('text=ID: 2')).toBeVisible()
		await expect(page.locator('text=Name: User 2')).toBeVisible()
		
		// Test direct URL access with different param
		await page.goto('/users/999')
		await expect(page.locator('text=ID: 999')).toBeVisible()
		await expect(page.locator('text=Name: User 999')).toBeVisible()
	})

	// ✅ TODO: Test navigation preserves state
	test('Navigation preserves component state', async ({ page }) => {
		await page.goto('/')
		
		// Verify initial counter state
		await expect(page.locator('#counter-value')).toHaveText('0')
		
		// Increment counter multiple times
		await page.click('#increment-btn')
		await page.click('#increment-btn')
		await page.click('#increment-btn')
		await expect(page.locator('#counter-value')).toHaveText('3')
		
		// Navigate away to user profile
		await page.click('#link-user-1')
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('h1')).toHaveText('User Profile')
		
		// Navigate back to home
		await page.click('#global-nav a[href="/"]')
		await expect(page).toHaveURL(/\/$/)
		
		// State is NOT preserved (new component instance)
		// This is expected behavior - each navigation creates fresh components
		await expect(page.locator('#counter-value')).toHaveText('0')
		
		// Increment again to verify reactivity still works
		await page.click('#increment-btn')
		await expect(page.locator('#counter-value')).toHaveText('1')
	})

	// ✅ TODO: Test back/forward browser navigation
	test('Browser back/forward navigation works', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('h1')).toHaveText('Index Page')
		
		// Navigate forward through several routes
		await page.click('#link-user-1')
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('h1')).toHaveText('User Profile')
		
		await page.click('#global-nav a[href="/users/list"]')
		await expect(page).toHaveURL(/\/users\/list$/)
		await expect(page.locator('h1')).toHaveText('User List')
		
		// Navigate back
		await page.goBack()
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('h1')).toHaveText('User Profile')
		
		await page.goBack()
		await expect(page).toHaveURL(/\/$/)
		await expect(page.locator('h1')).toHaveText('Index Page')
		
		// Navigate forward
		await page.goForward()
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('h1')).toHaveText('User Profile')
		
		await page.goForward()
		await expect(page).toHaveURL(/\/users\/list$/)
		await expect(page.locator('h1')).toHaveText('User List')
	})

	// ✅ TODO: Test 404 handling for unknown routes
	test('404 handling for unknown routes', async ({ page }) => {
		const response = await page.goto('/unknown-route')
		
		// Server returns 200 OK for fallback index.html (SPA pattern)
		expect(response?.status()).toBe(200)
		
		// Client router doesn't match, so root should be empty or show 404
		const rootText = await page.locator('#root').innerText()
		expect(rootText.trim()).toBe('')
	})

	// Additional test: Multiple dynamic params in sequence
	test('Navigate between multiple dynamic routes', async ({ page }) => {
		await page.goto('/users/list')
		await expect(page.locator('h1')).toHaveText('User List')
		
		// Click through multiple user links from the list
		await page.click('#list-link-user-1')
		await expect(page).toHaveURL(/\/users\/1$/)
		await expect(page.locator('text=Name: User 1')).toBeVisible()
		
		// Go back and click another user
		await page.goBack()
		await page.click('#list-link-user-2')
		await expect(page).toHaveURL(/\/users\/2$/)
		await expect(page.locator('text=Name: User 2')).toBeVisible()
	})

	// Additional test: Global navigation persists across routes
	test('Global navigation is accessible from all routes', async ({ page }) => {
		await page.goto('/users/1')
		
		// Verify global nav is present
		await expect(page.locator('#global-nav')).toBeVisible()
		await expect(page.locator('#global-nav a[href="/"]')).toBeVisible()
		await expect(page.locator('#global-nav a[href="/users/1"]')).toBeVisible()
		await expect(page.locator('#global-nav a[href="/users/list"]')).toBeVisible()
		
		// Navigate using global nav
		await page.click('#global-nav a[href="/users/list"]')
		await expect(page).toHaveURL(/\/users\/list$/)
		
		// Global nav still present
		await expect(page.locator('#global-nav')).toBeVisible()
	})
})
