
import { test, expect } from '@playwright/test'

test.describe('E-Commerce App Consumer', () => {
    test.use({ baseURL: 'http://localhost:3002' })

    test('Full checkout flow', async ({ page }) => {
        // 1. Visit catalog
        await page.goto('/products')
        await expect(page.locator('h1')).toHaveText('Featured Products')
        
        // 2. Add item to cart
        const firstProduct = page.locator('.product-card').first()
        await firstProduct.locator('button').click()
        
        // Handle alert for "Added to cart"
        page.on('dialog', dialog => dialog.dismiss())
        
        // 3. Go to cart
        await page.goto('/cart')
        await expect(page.locator('h1')).toHaveText('Shopping Cart')
        await expect(page.locator('li')).toContainText('Product ID: 1')
        
        // 4. Proceed to checkout
        await page.click('text=Proceed to Checkout')
        await expect(page).toHaveURL(/\/checkout/)
        
        // 5. Verify order summary
        await expect(page.locator('.checkout-summary')).toBeVisible()
        await expect(page.locator('li')).toContainText('Product 1 x 1')
        
        // 6. Pay
        await page.click('text=Pay Now')
        
        // 7. Verify success
        await expect(page.locator('.result.success')).toBeVisible()
        await expect(page.locator('.result.success')).toContainText('Transaction ID:')
        
        // 8. Verify cart cleared
        await page.goto('/cart')
        await expect(page.locator('text=Your cart is empty')).toBeVisible()
    })

    test('Hydration works', async ({ page }) => {
        const response = await page.goto('/products')
        const html = await response?.text() || ''
        
        // Check SSR content
        expect(html).toContain('Retro Camera')
        
        // Check hydration script tag presence in initial HTML
        expect(html).toContain('pounce-data-')
    })
})
