import { test, expect } from '@playwright/test'

/**
 * UI & SSR tests for the unified demo app.
 * Exercises SSR hydration, layouts, navigation, and provide-as-props.
 */
test.describe('Demo UI', () => {
	// ── Home page (root provide + layout) ────────────────────────────
	test('Home page renders with root layout and provide data', async ({ page }) => {
		const response = await page.goto('/')
		expect(response?.ok()).toBeTruthy()

		// Root layout nav
		await expect(page.locator('nav')).toBeVisible()
		await expect(page.locator('nav')).toContainText('Home')
		await expect(page.locator('nav')).toContainText('Posts')
		await expect(page.locator('nav')).toContainText('Users')

		// Index page content (from provide)
		await expect(page.locator('h1')).toHaveText('Index Page')
		await expect(page.locator('text=Welcome to Sursaut Demo')).toBeVisible()
	})

	// ── SSR hydration ────────────────────────────────────────────────
	test('SSR injects hydration script tags', async ({ page }) => {
		const response = await page.goto('/')
		const html = await response?.text() ?? ''
		// Hydration data should be present in initial HTML
		expect(html).toContain('sursaut-data-')
		expect(html).toContain('application/json')
	})

	// ── Posts list page (nested provide) ─────────────────────────────
	test('Posts page lists seed posts', async ({ page }) => {
		await page.goto('/posts')
		await expect(page.locator('h1')).toHaveText('Posts')
		// Seed data: two posts
		const items = page.locator('li')
		await expect(items.first()).toContainText('First Post')
	})

	// ── Post detail page ─────────────────────────────────────────────
	test('Post detail page shows content', async ({ page }) => {
		await page.goto('/posts/1')
		await expect(page.locator('article h1')).toHaveText('First Post')
		await expect(page.locator('article p')).toContainText('Hello World')
		// Back link
		await expect(page.locator('article a[href="/posts"]')).toBeVisible()
	})

	// ── Users section (nested layout) ────────────────────────────────
	test('Users page shows nested layout header', async ({ page }) => {
		await page.goto('/users')
		// Users layout wraps with an h2
		await expect(page.locator('h2')).toHaveText('Users Section')
		await expect(page.locator('h1')).toHaveText('Users')
	})

	// ── User detail page ─────────────────────────────────────────────
	test('User detail page renders profile', async ({ page }) => {
		await page.goto('/users/1')
		await expect(page.locator('#user-profile h1')).toHaveText('Alice')
		await expect(page.locator('#user-profile')).toContainText('Role: admin')
	})

	// ── Client-side navigation ───────────────────────────────────────
	test('Navigate between pages via links', async ({ page }) => {
		await page.goto('/')
		// Click Posts nav link
		await page.locator('nav a[href="/posts"]').click()
		await expect(page).toHaveURL(/\/posts$/)
		await expect(page.locator('h1')).toHaveText('Posts')

		// Click into a post detail
		await page.locator('li a').first().click()
		await expect(page).toHaveURL(/\/posts\/\d+/)
		await expect(page.locator('article h1')).toBeVisible()
	})

	// ── Back navigation ──────────────────────────────────────────────
	test('Browser back/forward works', async ({ page }) => {
		await page.goto('/')
		await page.locator('nav a[href="/posts"]').click()
		await expect(page).toHaveURL(/\/posts$/)
		await expect(page.locator('h1')).toHaveText('Posts')

		await page.goBack()
		await expect(page).toHaveURL(/\/$/)
		await expect(page.locator('h1')).toHaveText('Index Page')

		await page.goForward()
		await expect(page).toHaveURL(/\/posts$/)
		await expect(page.locator('h1')).toHaveText('Posts')
	})
})
