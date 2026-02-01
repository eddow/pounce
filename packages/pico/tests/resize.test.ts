import { test, expect } from '@playwright/test'


test.describe('Resize Directive', () => {
    test('should support bidirectional resizing', async ({ page }) => {
        await page.goto('http://localhost:4183/debug-directives')
        
        // Wait for element
        const box = page.locator('[use\\:resize]'); // Playwright selector might need escaping for colon or use text/css
        // Or better, use layout attributes if available, or just the div inside main
        const resizable = page.locator('div[style*="resize: both"]')
        await expect(resizable).toBeVisible()

        // width input
        const widthInput = page.getByLabel('Width:')
        const heightInput = page.getByLabel('Height:')
        
        // Initial values
        await expect(widthInput).toHaveValue('300')
        await expect(heightInput).toHaveValue('200')
        // Check computed style
        await expect(resizable).toHaveCSS('width', '300px')
        await expect(resizable).toHaveCSS('height', '200px')

        // 1. Programmatic resize: Change input -> Box changes
        await widthInput.fill('400')
        await heightInput.fill('250')
        await expect(resizable).toHaveCSS('width', '400px')
        await expect(resizable).toHaveCSS('height', '250px')
        
        // 2. User resize: Change box -> Input changes
        // Simulate resize by setting style directly via JS, triggering ResizeObserver
        // Playwright doesn't easily support drag-to-resize natively without mouse steps, 
        // but we can simulate the effect by changing style and waiting for observer to update the inputs.
        // Wait, if I change style directly, does ResizeObserver fire? Yes.
        await resizable.evaluate((el: HTMLElement) => {
            el.style.width = '500px'
            el.style.height = '350px'
        })
        
        // Wait for inputs to update (biDi DOM -> Reactive)
        await expect(widthInput).toHaveValue('500')
        await expect(heightInput).toHaveValue('350')
    })
})
