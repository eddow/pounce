import { expect, test } from '@playwright/test'
import { openSection } from './helpers/nav'

const openDockviewSection = async (page: any) => {
    page.on('console', (msg: any) => {
        if (msg.type() === 'error') console.log('BROWSER CONSOLE ERROR:', msg.text())
    })
    page.on('pageerror', (err: any) => {
        console.log('BROWSER PAGE ERROR:', err.message)
        console.log('STACK:', err.stack)
    })
    await openSection(page, { 
        menuName: 'Dockview' as any, 
        expectedUrlPath: '/dockview' as any, 
        expectedHeading: 'Dockview', 
        headingLevel: 1 
    })
}

test.describe('Dockview Regular', () => {
    test('renders initial layout and widgets', async ({ page }) => {
        await openDockviewSection(page)
        
        // Wait for dockview to initialize
        const dockviewContainer = page.getByTestId('dockview-theme-container')
        await expect(dockviewContainer).toBeVisible()

        // Check for default components (if any are added by default, but the route starts with empty layout usually)
        // In the route, state.layout is undefined initially, so it should be empty.
    })

    test('adds panels and verifies content', async ({ page }) => {
        await openDockviewSection(page)

        // Click "Add Panel 1"
        await page.getByRole('button', { name: 'Add Panel 1' }).click()
        
        // Verify panel 1 is visible
        const panel1 = page.locator('.pp-dv-item.body').filter({ hasText: 'Test Panel 1' })
        await expect(panel1).toBeVisible()
        
        // Check contents of panel 1
        await expect(panel1.locator('h3')).toHaveText('Test Panel 1')
    })

    test('bidirectional title sync', async ({ page }) => {
        await openDockviewSection(page)

        // Add Title/Params Panel
        await page.getByTestId('add-title-params-panel').click()
        
        const panel = page.locator('.pp-dv-item.body').filter({ hasText: 'Title/Params Sync Test' })
        await expect(panel).toBeVisible()

        // 1. Update Title via Props (Forward Sync)
        await panel.getByTestId('update-title-prop').click()
        const titleText = await panel.getByTestId('title-display').innerText()
        expect(titleText).toContain('Updated Title')
        
        // Verify tab title also updated
        const tab = page.locator('.pp-dv-item.tab').filter({ hasText: titleText })
        await expect(tab).toBeVisible()

        // 2. Update Title via API (Reverse Sync)
        await panel.getByTestId('update-title-api').click()
        const apiTitleText = await panel.getByTestId('title-display').innerText()
        expect(apiTitleText).toContain('API Title')
        await expect(page.locator('.pp-dv-item.tab').filter({ hasText: apiTitleText })).toBeVisible()
    })

    test('bidirectional params sync', async ({ page }) => {
        await openDockviewSection(page)

        // Add Title/Params Panel
        await page.getByTestId('add-title-params-panel').click()
        
        const panel = page.locator('.pp-dv-item.body').filter({ hasText: 'Title/Params Sync Test' })
        
        // 1. Update Params via Props
        await panel.getByTestId('update-params-prop').click()
        let paramsText = await panel.getByTestId('params-display').innerText()
        expect(paramsText).toContain('"updated":true')

        // 2. Update Params via API
        await panel.getByTestId('update-params-api').click()
        paramsText = await panel.getByTestId('params-display').innerText()
        expect(paramsText).toContain('"fromAPI":true')
    })

    test('layout save and load', async ({ page }) => {
        await openDockviewSection(page)

        // Add a panel
        await page.getByRole('button', { name: 'Add Panel 1' }).click()
        await expect(page.locator('.pp-dv-item.body').filter({ hasText: 'Test Panel 1' })).toBeVisible()

        // Save layout
        await page.getByRole('button', { name: 'Save Layout' }).click()
        
        // Clear layout
        await page.getByRole('button', { name: 'Clear Layout' }).click()
        await expect(page.locator('.pp-dv-item.body')).toHaveCount(0)

        // Load layout
        await page.getByRole('button', { name: 'Load Layout' }).click()
        await expect(page.locator('.pp-dv-item.body').filter({ hasText: 'Test Panel 1' })).toBeVisible()
    })

    test('header actions render correctly', async ({ page }) => {
        await openDockviewSection(page)

        // Add panel
        await page.getByRole('button', { name: 'Add Panel 1' }).click()
        
        // Check for header action (right side should show panel count)
        const headerAction = page.locator('.pp-dv-item').filter({ hasText: '1 panel' })
        await expect(headerAction).toBeVisible()

        // Add another panel to same group
        await page.getByRole('button', { name: 'Add Panel 2' }).click()
        await expect(page.locator('.pp-dv-item').filter({ hasText: '2 panels' })).toBeVisible()
    })
})

test.describe('Dockview Harsh', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', (msg: any) => {
            if (msg.type() === 'error') console.log('BROWSER CONSOLE ERROR:', msg.text())
        })
        page.on('pageerror', (err: any) => {
            console.log('BROWSER PAGE ERROR:', err.message)
            console.log('STACK:', err.stack)
        })
    })
    test('handles race conditions and early API access', async ({ page }) => {
        await page.goto('/dockview-harsh')
        
        // Verify that panels added during race condition are eventually rendered
        // In dockview-harsh.tsx, 'race-condition-panel' is added via requestAnimationFrame
        const racePanel = page.locator('.pp-dv-item.body').filter({ hasText: 'Params: {"race":true}' })
        await expect(racePanel).toBeVisible()

        // Verify API status indicators
        const apiStatus = page.getByTestId('api-status')
        await expect(apiStatus.locator('p').filter({ hasText: 'API was set: Yes' })).toBeVisible()
        await expect(apiStatus.locator('p').filter({ hasText: 'API variable is: defined' })).toBeVisible()
    })

    test('pending panels buffer until API is ready', async ({ page }) => {
        await page.goto('/dockview-harsh')

        // Click "Add Panel" button which uses ensurePanel
        await page.getByRole('button', { name: 'Add Panel (tests ensurePanel)' }).click()
        
        const testPanel = page.locator('.pp-dv-item.body').filter({ hasText: 'Params: {"test":true}' })
        await expect(testPanel).toBeVisible()
    })
})
