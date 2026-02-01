import { test, expect } from '@playwright/test'

test.describe('Scroll Directive', () => {
    test('should support bidirectional scrolling', async ({ page }) => {
        await page.goto('http://localhost:4183/debug-directives')
        
        const container = page.locator('#scroll-container')
        await expect(container).toBeVisible()

        // Inputs
        // Layout:
        // <article><header>X Axis</header><label>Value: ... <input ...></label></article>
        // getByLabel('X Axis') might fail if 'X Axis' is in header, not label text.
        // Actually, the label text starts with "Value: ...". "X Axis" is in the header sibling/parent context.
        const scrollSection = page.locator('section', { hasText: 'Scroll' })
        const xInput = scrollSection.locator('input').nth(0)
        const yInput = scrollSection.locator('input').nth(1)

        // Initial state
        await expect(xInput).toHaveValue('0')
        await expect(yInput).toHaveValue('0')

        // 1. Programmatic scroll (Reactive -> DOM)
        // Scroll X
        await xInput.fill('100')
        await xInput.blur() // ensure change event
        // Check DOM property
        await expect(container).toHaveJSProperty('scrollLeft', 100)
        
        // 1b. Focus stability check (Regression test for drag loop issue)
        // Set value, check if focus is maintained (implies element was not regenerated)
        await xInput.focus()
        await xInput.fill('110')
        // Note: fill() might blur? 
        // Let's use type to simulate user input more closely
        await xInput.focus()
        await xInput.type('1') // appends? or types? type usually appends if not clear.
        // Actually, let's just use evaluate to set focus and value, then check activeElement
        
        // Better: ensure xInput handle is still valid and same as focused element
        await xInput.focus()
        // Simulate reactivity update that might cause regeneration
        await container.evaluate(el => el.scrollLeft = 120)
        
        // Wait for binding to update input value
        await expect(xInput).toHaveValue('120')
        
        // Check if xInput still has focus
        await expect(xInput).toBeFocused()

        // Scroll Y
        await yInput.fill('150')
        await yInput.blur()
        await expect(container).toHaveJSProperty('scrollTop', 150)

        // 2. User scroll (DOM -> Reactive)
        // Simulate scroll via JS
        await container.evaluate((el: HTMLElement) => {
            el.scrollLeft = 200
            el.scrollTop = 180
            el.dispatchEvent(new Event('scroll'))
        })
        
        // Wait for inputs to update (Reactive binding)
        await expect(xInput).toHaveValue('200')
        await expect(yInput).toHaveValue('180')

        // 3. Max binding checks
        // We know content is 1000x800, container is 300x200
        // max X approx 700 (minus scrollbar), max Y approx 600
        const maxX = await xInput.getAttribute('max')
        const maxY = await yInput.getAttribute('max')
        
        expect(Number(maxX)).toBeGreaterThan(0)
        expect(Number(maxY)).toBeGreaterThan(0)
    })
})
