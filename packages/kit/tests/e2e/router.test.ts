import { test, expect } from '@playwright/test'

test.describe('Kit Router — SPA reactivity', () => {
	test('initial load renders the correct route', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('[data-testid="home-view"] h1')).toHaveText('Home')
		await expect(page.locator('[data-testid="current-path"]')).toHaveText('/')
	})

	test('clicking <A> navigates without full page reload', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()

		// Track full page loads after initial — should stay at zero
		let fullPageLoads = 0
		page.on('load', () => fullPageLoads++)

		// Navigate to About
		await page.click('[data-testid="nav-about"]')
		await expect(page.locator('[data-testid="about-view"] h1')).toHaveText('About')
		await expect(page).toHaveURL(/\/about$/)
		await expect(page.locator('[data-testid="current-path"]')).toHaveText('/about')

		// Navigate to User 1
		await page.click('[data-testid="nav-user-1"]')
		await expect(page.locator('[data-testid="user-view"] h1')).toHaveText('User Profile')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')
		await expect(page).toHaveURL(/\/users\/1$/)

		// Navigate back to Home
		await page.click('[data-testid="nav-home"]')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()
		await expect(page).toHaveURL(/\/$/)

		// No full page reloads should have occurred during SPA navigation
		expect(fullPageLoads).toBe(0)
	})

	test('route params are displayed and update on navigation', async ({ page }) => {
		await page.goto('/users/1')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 1')

		// Navigate to User 2 via global nav
		await page.click('[data-testid="nav-user-2"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 2')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 2')
		await expect(page).toHaveURL(/\/users\/2$/)
	})

	test('param change within same route pattern updates content', async ({ page }) => {
		await page.goto('/users/1')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')

		// Use in-page links to switch between users (same route pattern, different param)
		await page.click('[data-testid="link-user-42"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 42')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 42')
		await expect(page).toHaveURL(/\/users\/42$/)

		await page.click('[data-testid="link-user-2"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 2')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 2')
	})

	test('browser back/forward navigates reactively', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()

		await page.click('[data-testid="nav-about"]')
		await expect(page.locator('[data-testid="about-view"]')).toBeVisible()

		await page.click('[data-testid="nav-user-1"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')

		// Back to About
		await page.goBack()
		await expect(page.locator('[data-testid="about-view"]')).toBeVisible()
		await expect(page).toHaveURL(/\/about$/)

		// Back to Home
		await page.goBack()
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()
		await expect(page).toHaveURL(/\/$/)

		// Forward to About
		await page.goForward()
		await expect(page.locator('[data-testid="about-view"]')).toBeVisible()

		// Forward to User 1
		await page.goForward()
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')
	})

	test('direct URL access renders the correct route', async ({ page }) => {
		await page.goto('/about')
		await expect(page.locator('[data-testid="about-view"] h1')).toHaveText('About')

		await page.goto('/users/99')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 99')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 99')
	})

	test('unknown route shows not-found', async ({ page }) => {
		await page.goto('/nonexistent')
		await expect(page.locator('[data-testid="not-found-view"] h1')).toHaveText('404')
	})

	test('aria-current is set on active nav link', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('[data-testid="nav-home"]')).toHaveAttribute('aria-current', 'page')
		await expect(page.locator('[data-testid="nav-about"]')).not.toHaveAttribute('aria-current', 'page')

		await page.click('[data-testid="nav-about"]')
		await expect(page.locator('[data-testid="nav-about"]')).toHaveAttribute('aria-current', 'page')
		await expect(page.locator('[data-testid="nav-home"]')).not.toHaveAttribute('aria-current', 'page')
	})
})
