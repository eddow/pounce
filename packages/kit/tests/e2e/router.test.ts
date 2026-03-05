import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
	page.on('console', (msg) => {
		console.log(`BROWSER [${msg.type()}]: ${msg.text()}`)
	})
})

test.describe('Kit Router — SPA reactivity', () => {
	test('initial load renders the correct route', async ({ page }) => {
		await page.goto('/router')
		await expect(page.locator('[data-testid="home-view"] h1')).toHaveText('Home')
		await expect(page.locator('[data-testid="current-path"]')).toHaveText('/router')
	})

	test('clicking <A> navigates without full page reload', async ({ page }) => {
		await page.goto('/router')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()

		let fullPageLoads = 0
		page.on('load', () => fullPageLoads++)

		await page.click('[data-testid="nav-user-1"]')
		await expect(page.locator('[data-testid="user-view"] h1')).toHaveText('User Profile')
		await expect(page).toHaveURL(/\/router\/users\/1$/)
		await expect(page.locator('[data-testid="current-path"]')).toHaveText('/router/users/1')

		await page.click('[data-testid="nav-about"]')
		await expect(page.locator('[data-testid="about-view"] h1')).toHaveText('About')
		await page.click('[data-testid="nav-user-1"]')
		await expect(page.locator('[data-testid="user-view"] h1')).toHaveText('User Profile')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')
		await expect(page).toHaveURL(/\/router\/users\/1$/)

		await page.click('[data-testid="nav-home"]')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()
		await expect(page).toHaveURL(/\/router$/)

		expect(fullPageLoads).toBe(0)
	})

	test('route params are displayed and update on navigation', async ({ page }) => {
		await page.goto('/router/users/1')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 1')

		await page.click('[data-testid="nav-user-2"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 2')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 2')
		await expect(page).toHaveURL(/\/router\/users\/2$/)
	})

	test('param change within same route pattern updates content', async ({ page }) => {
		await page.goto('/router/users/1')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')

		await page.click('[data-testid="link-user-42"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 42')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 42')
		await expect(page).toHaveURL(/\/router\/users\/42$/)

		await page.click('[data-testid="link-user-2"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 2')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 2')
	})

	test('browser back/forward navigates reactively', async ({ page }) => {
		await page.goto('/router')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()

		await page.click('[data-testid="nav-about"]')
		await expect(page.locator('[data-testid="about-view"]')).toBeVisible()

		await page.click('[data-testid="nav-user-1"]')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')

		await page.goBack()
		await expect(page.locator('[data-testid="about-view"]')).toBeVisible()
		await expect(page).toHaveURL(/\/router\/about$/)

		await page.goBack()
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()
		await expect(page).toHaveURL(/\/router$/)

		await page.goForward()
		await expect(page.locator('[data-testid="about-view"]')).toBeVisible()

		await page.goForward()
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 1')
	})

	test('direct URL access renders the correct route', async ({ page }) => {
		await page.goto('/router/about')
		await expect(page.locator('[data-testid="about-view"] h1')).toHaveText('About')

		await page.goto('/router/users/99')
		await expect(page.locator('[data-testid="user-id"]')).toHaveText('ID: 99')
		await expect(page.locator('[data-testid="user-name"]')).toHaveText('Name: User 99')
	})

	test('unknown route shows not-found', async ({ page }) => {
		await page.goto('/router/nonexistent')
		await expect(page.locator('[data-testid="not-found-view"] h1')).toHaveText('404')
	})

	test('aria-current is set on active nav link', async ({ page }) => {
		await page.goto('/router')
		await expect(page.locator('[data-testid="nav-home"]')).toHaveAttribute('aria-current', 'page')
		await expect(page.locator('[data-testid="nav-about"]')).not.toHaveAttribute('aria-current', 'page')

		await page.click('[data-testid="nav-about"]')
		await expect(page.locator('[data-testid="nav-about"]')).toHaveAttribute('aria-current', 'page')
		await expect(page.locator('[data-testid="nav-home"]')).not.toHaveAttribute('aria-current', 'page')
	})

	test('scrolls to top on navigation by default', async ({ page }) => {
		await page.goto('/router/long')
		await expect(page.locator('[data-testid="long-view"]')).toBeVisible()

		await page.evaluate(() => window.scrollTo(0, 1000))
		let scrollY = await page.evaluate(() => window.scrollY)
		expect(scrollY).toBe(1000)

		await page.click('[data-testid="nav-home"]')
		await expect(page.locator('[data-testid="home-view"]')).toBeVisible()

		scrollY = await page.evaluate(() => window.scrollY)
		expect(scrollY).toBe(0)
	})
})
