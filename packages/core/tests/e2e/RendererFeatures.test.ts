import { test, expect } from '@playwright/test'

test.describe('Renderer features', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#RendererFeatures')
		await page.waitForSelector('#tests')
		const errorPromise = page
			.waitForSelector('#tests :text("Failed to load fixture")', { timeout: 5000 })
			.catch(() => null)
		const okPromise = page.waitForSelector('#tests .output', { timeout: 5000 }).catch(() => null)
		const result = await Promise.race([errorPromise, okPromise])
		if (!result) {
			const html = await page.locator('#tests').innerHTML()
			const list = await page.evaluate(() => (window as any).__fixturesList || [])
			throw new Error(
				'Fixture did not render within timeout. #tests HTML: ' + html + ' fixtures: ' + JSON.stringify(list)
			)
		}
		const isError = await page.locator('#tests :text("Failed to load fixture")').count()
		if (isError) {
			const html = await page.locator('#tests').innerText()
			throw new Error('Fixture failed to load: ' + html)
		}
	})

	test('dynamic tag selection forwards `is` and supports components', async ({ page }) => {
		const root = page.locator('[data-testid="dynamic-root"]')
		await expect(root).toHaveAttribute('data-kind', 'button')
		await expect(root).toHaveAttribute('is', 'fancy-control')
		const initialTag = await root.evaluate<string>((node) => node.tagName.toLowerCase())
		expect(initialTag).toBe('button')

		await page.click('[data-action="toggle-dynamic"]')
		await expect(root).toHaveAttribute('data-kind', 'section')
		const toggledTag = await root.evaluate<string>((node) => node.tagName.toLowerCase())
		expect(toggledTag).toBe('section')

		await page.click('[data-action="toggle-dynamic-mode"]')
		await expect(root).toHaveAttribute('data-kind', 'component')
		await expect(root).toHaveAttribute('is', 'fancy-control')
		const componentTag = await root.evaluate<string>((node) => node.tagName.toLowerCase())
		expect(componentTag).toBe('article')
		await expect(page.locator('[data-testid="dynamic-component-marker"]')).toBeVisible()
		await expect(page.locator('[data-testid="dynamic-forwarded-is"]')).toHaveText('fancy-control')
	})

	test('`if` directives react to boolean, scope, and when conditions', async ({ page }) => {
		const featureOn = page.locator('[data-testid="feature-on"]')
		const featureOff = page.locator('[data-testid="feature-off"]')
		const permAllowed = page.locator('[data-testid="perm-allowed"]')
		const permDenied = page.locator('[data-testid="perm-denied"]')

		await expect(featureOn).toHaveText('Feature On')
		await expect(featureOff).toHaveCount(0)
		await expect(page.locator('[data-testid="role-guest"]')).toHaveText('Guest space')
		await expect(permAllowed).toHaveCount(0)
		await expect(permDenied).toHaveText('No analytics access')

		await page.click('[data-action="feature-toggle"]')
		await expect(page.locator('[data-testid="feature-on"]')).toHaveCount(0)
		await expect(page.locator('[data-testid="feature-off"]')).toHaveText('Feature Off')

		await page.click('[data-action="role-member"]')
		await expect(page.locator('[data-testid="role-member"]')).toHaveText('Member area')
		await expect(page.locator('[data-testid="role-guest"]')).toHaveCount(0)
		await expect(permAllowed).toHaveText('Analytics enabled')
		await expect(permDenied).toHaveCount(0)

		await page.click('[data-action="role-admin"]')
		await expect(page.locator('[data-testid="role-admin"]')).toHaveText('Admin control')
	})

	test('`use` directives provide mount hooks and reactive mixins', async ({ page }) => {
		const mounts = page.locator('[data-testid="use-mounts"]')
		const toggleUse = page.locator('[data-action="use-toggle-target"]')
		const target = page.locator('[data-testid="use-target"]')
		await expect(mounts).toHaveText('1')
		await expect(target).toHaveAttribute('data-marker', 'primary')
		await expect(page.locator('[data-testid="mixin-updates"]')).toHaveText('1')

		await page.click('[data-action="variant-next"]')
		await expect(target).toHaveAttribute('data-marker', 'secondary')
		await expect(page.locator('[data-testid="mixin-updates"]')).toHaveText('2')

		await toggleUse.click()
		await expect(page.locator('[data-testid="use-target"]')).toHaveCount(0)
		await expect(mounts).toHaveText('1')
		await expect(page.locator('[data-testid="mixin-updates"]')).toHaveText('2')
	})

	test('`for` directive reuses instances and cleans up removed items', async ({ page }) => {
		const firstItem = page.locator('[data-testid="list-item"]').first()
		await expect(firstItem.locator('.label')).toHaveText('Alpha')
		const initialInstance = await firstItem.getAttribute('data-instance')
		if (!initialInstance) throw new Error('missing data-instance attribute on first list item')

		await page.click('[data-action="list-update"]')
		await expect(firstItem.locator('.label')).toHaveText('Alpha!')
		await expect(firstItem).toHaveAttribute('data-instance', initialInstance)

		await page.click('[data-action="list-remove"]')
		await expect(page.locator('[data-testid="list-item"]')).toHaveCount(1)

		await page.click('[data-action="list-add"]')
		const lastItem = page.locator('[data-testid="list-item"]').last()
		await expect(lastItem.locator('.label')).toHaveText(/Item \d+/)
	})
})


