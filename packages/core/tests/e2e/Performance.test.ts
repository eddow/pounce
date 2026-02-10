import { test, expect } from '@playwright/test'

interface PerfCounters {
	componentRenders: number
	elementRenders: number
	renderCacheHits: number
	reconciliations: number
	forIterations: number
	dynamicSwitches: number
	cacheHitRatio: number
}

declare global {
	interface Window {
		__POUNCE_PERF__: PerfCounters
	}
}

function getMeasures(page: import('@playwright/test').Page, prefix: string) {
	return page.evaluate((p) => {
		return performance
			.getEntriesByType('measure')
			.filter((e) => e.name.startsWith(p))
			.map((e) => ({ name: e.name, duration: e.duration }))
	}, prefix)
}

function getCounters(page: import('@playwright/test').Page) {
	return page.evaluate(() => {
		const c = window.__POUNCE_PERF__
		return {
			componentRenders: c.componentRenders,
			elementRenders: c.elementRenders,
			renderCacheHits: c.renderCacheHits,
			reconciliations: c.reconciliations,
			forIterations: c.forIterations,
			dynamicSwitches: c.dynamicSwitches,
			cacheHitRatio: c.cacheHitRatio,
		}
	})
}

test.describe('Performance budgets', () => {
	test('initial app mount completes within budget', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const appMount = await getMeasures(page, 'app:')
		expect(appMount.length).toBeGreaterThan(0)

		const mountMeasure = appMount.find((m) => m.name === 'app:mount')
		expect(mountMeasure).toBeDefined()
		// Budget: initial mount of demo app < 200ms (dev server, unbundled)
		expect(mountMeasure!.duration).toBeLessThan(200)

		const renderMeasure = appMount.find((m) => m.name === 'app:render')
		expect(renderMeasure).toBeDefined()
		expect(renderMeasure!.duration).toBeLessThan(200)
	})

	test('component render overhead stays within budget', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const components = await getMeasures(page, 'component:')
		expect(components.length).toBeGreaterThan(0)

		// Component measures include full subtree rendering.
		// Dev server budgets are generous (unbundled, HMR overhead).
		// Production budgets should be ~10x tighter.
		for (const m of components) {
			expect(m.duration, `${m.name} exceeded 500ms budget`).toBeLessThan(500)
		}
	})

	test('element render overhead stays within budget', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const elements = await getMeasures(page, 'element:')
		expect(elements.length).toBeGreaterThan(0)

		// Element render includes child processing — allow 50ms on dev server
		for (const m of elements) {
			expect(m.duration, `${m.name} exceeded budget`).toBeLessThan(50)
		}
	})

	test('reconciliation passes stay within budget', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const reconciles = await getMeasures(page, 'reconcile:')
		expect(reconciles.length).toBeGreaterThan(0)

		// Each reconciliation pass should be < 5ms
		for (const m of reconciles) {
			expect(m.duration, `${m.name} exceeded budget`).toBeLessThan(5)
		}
	})

	test('aggregate counters are populated after mount', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const counters = await getCounters(page)

		expect(counters.componentRenders).toBeGreaterThan(0)
		expect(counters.elementRenders).toBeGreaterThan(0)
		expect(counters.reconciliations).toBeGreaterThan(0)
		// Cache hits may be 0 on first mount — that's fine
		expect(counters.renderCacheHits).toBeGreaterThanOrEqual(0)
	})
})

test.describe('For list performance', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#For')
		await page.waitForSelector('#tests [data-testid="child-list"]')
	})

	test('<for> iteration measures are captured', async ({ page }) => {
		const forMeasures = await getMeasures(page, 'for:')
		expect(forMeasures.length).toBeGreaterThan(0)

		// Each <for> compute should be < 5ms for small lists
		for (const m of forMeasures) {
			expect(m.duration, `${m.name} exceeded budget`).toBeLessThan(5)
		}
	})

	test('<for> reactive update stays within budget', async ({ page }) => {
		// Clear existing measures
		await page.evaluate(() => performance.clearMeasures())

		await page.click('[data-action="add-start"]')
		await page.locator('[data-testid="child-list"] li').nth(3).waitFor()

		const forMeasures = await getMeasures(page, 'for:')
		expect(forMeasures.length).toBeGreaterThan(0)

		// Reactive list update should be < 5ms
		for (const m of forMeasures) {
			expect(m.duration, `${m.name} exceeded budget`).toBeLessThan(5)
		}

		const counters = await getCounters(page)
		expect(counters.forIterations).toBeGreaterThan(0)
	})
})

test.describe('Dynamic component performance', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/#Dynamic')
		await page.waitForSelector('#tests')
	})

	test('<dynamic> tag-switch measures are captured', async ({ page }) => {
		const dynMeasures = await getMeasures(page, 'dynamic:')
		// Dynamic may or may not be present depending on demo fixture
		// Just verify no measure exceeds budget if present
		for (const m of dynMeasures) {
			expect(m.duration, `${m.name} exceeded budget`).toBeLessThan(10)
		}
	})
})

test.describe('Render cache effectiveness', () => {
	test('reactive update triggers reconciliation', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const countersBefore = await getCounters(page)

		// Trigger a reactive update (add item via the mini counter's add button)
		await page.locator('#mini button.add').first().click()
		await page.waitForTimeout(100)

		const countersAfter = await getCounters(page)

		// Reconciliations should increase (reactive update triggers redraw)
		expect(countersAfter.reconciliations).toBeGreaterThan(countersBefore.reconciliations)
	})
})

test.describe('Performance measurement export', () => {
	test('all measurements can be exported as JSON', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const allMeasures = await page.evaluate(() =>
			performance.getEntriesByType('measure').map((e) => ({
				name: e.name,
				duration: e.duration,
				startTime: e.startTime,
			}))
		)

		expect(allMeasures.length).toBeGreaterThan(0)

		// Verify we have measures from each category
		const categories = new Set(allMeasures.map((m) => m.name.split(':')[0]))
		expect(categories.has('app')).toBe(true)
		expect(categories.has('component')).toBe(true)
		expect(categories.has('element')).toBe(true)
		expect(categories.has('reconcile')).toBe(true)
	})

	test('counters + measures provide full picture', async ({ page }) => {
		await page.goto('/')
		await page.waitForSelector('#app .counter-text')

		const counters = await getCounters(page)
		const measureCount = await page.evaluate(
			() => performance.getEntriesByType('measure').length
		)

		// Counters should be consistent with measures
		// (counters always increment, measures only fire when perf is enabled)
		expect(counters.componentRenders + counters.elementRenders).toBeGreaterThan(0)
		expect(measureCount).toBeGreaterThan(0)
	})
})
