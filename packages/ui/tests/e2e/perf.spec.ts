import { test, expect } from '@playwright/test'

test('overview performance profile', async ({ page, browser }) => {
	try {
		// Start tracing with screenshots and snapshots
		console.log('Starting trace...')
		await browser.startTracing(page, { path: 'sandbox/perf-trace.json', screenshots: true })

		const startTime = Date.now()
		// Navigate to the demo root
		await page.goto('/', { timeout: 60000 })

		// Wait for the overview heading to be visible to ensure app is hydrated/rendered
		// Using locator('h2') with text matching to be more robust than role matching in this specific context
		await expect(page.locator('h2')).toContainText('Pounce UI', { timeout: 60000 })

		const endTime = Date.now()
		console.log(`Load time: ${endTime - startTime}ms`)

		const timings = await page.evaluate(() => (window as any).__MUTTS_TIMING__)
		console.log('MUTTS TIMINGS:', JSON.stringify(timings, null, 2))

	} catch (e) {
		console.error('Test failed:', e)
		throw e
	} finally {
		// Stop tracing
		console.log('Stopping trace...')
		await browser.stopTracing()
		console.log('Trace saved.')
	}
})
