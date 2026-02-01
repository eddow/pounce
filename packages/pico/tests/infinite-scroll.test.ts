
import { expect, test } from '@playwright/test'

test.describe('Infinite Scroll', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`))
        
        // Direct navigation to avoid menu dependency
        // We use relative URL which Playwright resolves against baseURL
        await page.goto('/infinite-scroll')
        
        // Wait for heading to be visible to ensure hydration/render
        // Debug: check for not found
        const notFound = page.getByRole('heading', { name: 'Not found' })
        if (await notFound.isVisible()) {
             throw new Error('Route not found - 404')
        }
        await expect(page.getByRole('heading', { level: 2, name: 'Infinite Scroll' })).toBeVisible({ timeout: 10000 })
    })

    test('renders initial items', async ({ page }) => {
        const items = page.locator('.pp-infinite-scroll-item')
        
        // Wait for items to appear
        await expect(items.first()).toBeVisible({ timeout: 10000 })
        
        const count = await items.count()
        expect(count).toBeGreaterThan(0)
        expect(count).toBeLessThan(50)
        
        await expect(items.first()).toContainText('Item 0')
    })
    
    test('scrolls to show new items', async ({ page }) => {
        const scrollContainer = page.locator('.pp-infinite-scroll')
        
        // Wait for hydration
        await expect(scrollContainer).toBeVisible()
        
        // Trigger scroll
        await scrollContainer.evaluate((el: any) => el.scrollTop = 500)
         // Allow time for virtualization update (ResizeObserver/ScrollEvent)
        await page.waitForTimeout(500)
        
        const items = page.locator('.pp-infinite-scroll-item')
        const firstText = await items.first().textContent()
        
        expect(firstText).not.toContain('Item 0')
    })

    test('stickyLast: auto-scrolls when at bottom', async ({ page }) => {
        const scrollContainer = page.locator('.pp-infinite-scroll')
        await expect(scrollContainer).toBeVisible()
        
        // Scroll to bottom
        await scrollContainer.evaluate((el: any) => el.scrollTop = el.scrollHeight)
        await page.waitForTimeout(200)
        
        // Add item
        await page.getByRole('button', { name: 'Add Item' }).click()
        await page.waitForTimeout(200)
        
        const isAtBottom = await scrollContainer.evaluate((el: any) => Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10)
        expect(isAtBottom).toBeTruthy()
    })
    
    test('stickyLast: does NOT scroll when not at bottom', async ({ page }) => {
        const scrollContainer = page.locator('.pp-infinite-scroll')
        await expect(scrollContainer).toBeVisible()
        
        // Scroll to top
        await scrollContainer.evaluate((el: any) => el.scrollTop = 0)
        await page.waitForTimeout(200)
        
        // Add item
        await page.getByRole('button', { name: 'Add Item' }).click()
        await page.waitForTimeout(200)
        
        const scrollTop = await scrollContainer.evaluate((el: any) => el.scrollTop)
        expect(scrollTop).toBe(0)
    })
})
