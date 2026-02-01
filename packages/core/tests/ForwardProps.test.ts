import { test, expect } from '@playwright/test'

test.describe.skip('ForwardProps', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('PAGE LOG:', msg.text()))
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message))
        
        await page.goto('/')
        console.log('Navigated to /')
        
        await page.waitForLoadState('networkidle')

        // Inject component directly
        await page.evaluate(() => {
            const forwardProps = (window as any).forwardProps
            const h = (window as any).h

            const ChildInput = (props: any) => {
                 return h('input', {
                     'data-testid': 'child-input',
                     ...forwardProps(props)
                 })
            }

            const state = { value: 'original' }
            // mimic reactive prop
            const props = {
                get value() { return state.value },
                set value(v) { state.value = v }
            }
            
            const App = () => h('div', { 'data-testid': 'forward-props-test' }, 
                h('div', { 'data-testid': 'display-value' }, () => state.value), // getter function for text
                ChildInput(props),
                h('button', {
                    'data-testid': 'reset-btn',
                    onclick: () => { 
                        state.value = 'reset' 
                    }
                })
            )

            // Mount to #tests
            const root = document.getElementById('tests')
            if (root) {
                const mountable = App()
                const nodes = mountable.render({}) // Render with empty scope
                const nodeList = Array.isArray(nodes) ? nodes : [nodes];
                nodeList.forEach(n => root.appendChild(n));
                (window as any).__injectedApp = { state }
            }
        })
    })

    test('should forward reactive binding to child component', async ({ page }) => {
        const input = page.locator('[data-testid="child-input"]')
        const display = page.locator('[data-testid="display-value"]')
        
        // 1. Check initial value propagation (get)
        await expect(input).toHaveValue('original')
        await expect(display).toHaveText('original')

        // 2. Check update propagation (set)
        await input.fill('updated')
        await expect(display).toHaveText('updated')
        
        // 3. Check reactive update from parent
        await page.click('[data-testid="reset-btn"]')
        await expect(input).toHaveValue('reset')
    })
})
