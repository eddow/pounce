import { test, expect } from '@playwright/test'

test.describe('Pointer Directive', () => {
    test('should support pointer tracking and buttons', async ({ page }) => {
        await page.goto('http://localhost:4183/debug-directives')
        page.on('console', msg => console.log('BROWSER:', msg.text()))
        
        const pointerSection = page.locator('h2', { hasText: 'Pointer' }).locator('..')
        const container = page.locator('h2', { hasText: 'Pointer' }).locator('xpath=following-sibling::div').first()

        await expect(container).toBeVisible()
        await container.scrollIntoViewIfNeeded()

        // 1. Move mouse to center
        const box = await container.boundingBox()
        if (!box) throw new Error('Container not found')

        await page.mouse.move(box.x + 50, box.y + 50)
        
        // Check output text
        await expect(container).toContainText('x: 48')
        await expect(container).toContainText('y: 48')
        await expect(container).toContainText('buttons: 0')
        
        await page.waitForTimeout(3000)
        await page.mouse.move(box.x + 100, box.y + 100)
        await expect(container).toContainText('x: 98')
        await expect(container).toContainText('y: 98')
        // 2. Click (Move + Down + Up)
        await page.mouse.down()
        // await expect(container).toContainText('buttons: 1') // Left button
        
        await page.mouse.up()
        // await expect(container).toContainText('buttons: 0')

        // 3. Right click (if possible)
        await page.mouse.down({ button: 'right' })
        // await expect(container).toContainText('buttons: 2')
        await page.mouse.up({ button: 'right' })

        // 4. Leave
        await page.mouse.move(0, 0) // Move out
        await expect(container).toContainText('Move pointer here...')

        // 5. Re-enter after timeout (Regression test for GC issue)
        // Simulate "few short seconds" where reactivity might die
        await page.waitForTimeout(5000)
        
        await page.mouse.move(box.x + 20, box.y + 20)
        // If GC killed the effect, this will fail or show old values
        await expect(container).toContainText('x: 18') 
        await expect(container).toContainText('y: 18')
    })
})
