import { test, expect } from '@playwright/test'

/**
 * Performance profiling test for the demo app.
 *
 * Instruments the mutts reactive proxy to count and categorize
 * property accesses, identifying the source of hyper-reactivity.
 *
 * Run:  pnpm exec playwright test --config playwright.perf.config.ts
 */
test('overview performance profile', async ({ page }) => {
	const startTime = Date.now()
	await page.goto('/', { timeout: 60_000 })
	await expect(page.locator('h2')).toContainText('Pounce UI', { timeout: 60_000 })
	const loadTime = Date.now() - startTime

	const pounce = await page.evaluate(() => (window as any).__POUNCE_PERF__ || {})
	const dep = await page.evaluate(() => {
		const d = (window as any).__DEP__
		if (!d) return null
		// Get top 20 properties by count
		const propEntries = Object.entries(d.propCounts as Record<string, number>)
			.sort((a, b) => (b[1] as number) - (a[1] as number))
			.slice(0, 20)
		// Get top 10 objects by count — serialize with constructor name and keys
		const topObjs: Array<{ count: number; ctor: string; keys: string[] }> = []
		for (const [obj, count] of d.objCount as Map<object, number>) {
			topObjs.push({
				count: count as number,
				ctor: obj?.constructor?.name || '(null-proto)',
				keys: Object.keys(obj).slice(0, 10),
			})
		}
		topObjs.sort((a, b) => b.count - a.count)
		return {
			total: d.total,
			topProps: propEntries,
			topObjs: topObjs.slice(0, 15),
			uniqueObjects: d.objCount.size,
		}
	})

	console.log('\n══════════════════════════════════════════════')
	console.log(`  LOAD TIME:          ${loadTime} ms`)
	console.log('  Pounce counters:')
	for (const [k, v] of Object.entries(pounce)) {
		if (typeof v === 'number') console.log(`    ${k}: ${v}`)
	}
	if (dep) {
		console.log('──────────────────────────────────────────────')
		console.log(`  dependant() calls:  ${dep.total}`)
		console.log(`  unique objects:     ${dep.uniqueObjects}`)
		console.log('  Top properties:')
		for (const [prop, count] of dep.topProps) {
			console.log(`    ${String(count).padStart(10)}  ${prop}`)
		}
		console.log('  Top objects:')
		for (const obj of dep.topObjs) {
			console.log(`    ${String(obj.count).padStart(10)}  ${obj.ctor}  keys=[${obj.keys.join(',')}]`)
		}
	}
	console.log('══════════════════════════════════════════════\n')

	expect(loadTime).toBeLessThan(3000)
})
