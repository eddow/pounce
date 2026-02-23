import { test } from '@playwright/test'

interface TestPerfCounters {
	componentRenders: number
	elementRenders: number
	renderCacheHits: number
	reconciliations: number
	forIterations: number
	dynamicSwitches: number
	effectCreations: number
	effectReactions: number
	byName: Record<string, number>
	byNameReactions: Record<string, number>
	reset(): void
	readonly cacheHitRatio: number
	readonly totalNodes: number
}

declare global {
	interface Window {
		__POUNCE_PERF__: TestPerfCounters
	}
}

test('report performance counters', async ({ page }) => {
	await page.goto('/')
	await page.waitForSelector('#app')
	// Wait for any post-mount microtasks
	await page.waitForTimeout(500)

	const counters = await page.evaluate(() => window.__POUNCE_PERF__)
	const domStats = await page.evaluate(() => {
		const stats: Record<string, number> = {}
		const walk = (node: Node) => {
			const tag = node.nodeType === Node.TEXT_NODE ? '#text' : (node as Element).tagName?.toLowerCase()
			if (tag) stats[tag] = (stats[tag] || 0) + 1
			node.childNodes.forEach(walk)
		}
		const root = document.querySelector('#app')
		if (root) walk(root)
		return stats
	})

	console.log('\n🚀 Pounce Performance Report')
	console.log('============================')
	console.log(`Effect Creations: ${counters.effectCreations}`)
	console.log(`Effect Reactions: ${counters.effectReactions}`)
	console.log(`Component Renders: ${counters.componentRenders}`)
	console.log(`Element Renders:   ${counters.elementRenders}`)
	console.log(`Reconciliations:   ${counters.reconciliations}`)
	
	console.log('\nDOM Node Counts:')
	const sortedNodes = Object.entries(domStats)
		.sort(([, a], [, b]) => (b as number) - (a as number))
	for (const [tag, count] of sortedNodes) {
		console.log(`  ${tag.padEnd(30)}: ${count}`)
	}

	if (counters.byName) {
		console.log('\nEffect Creations by Name:')
		const sorted = Object.entries(counters.byName)
			.sort(([, a], [, b]) => (b as number) - (a as number))
		for (const [name, count] of sorted) {
			console.log(`  ${String(name).padEnd(30)}: ${count}`)
		}
	}
	if (counters.byNameReactions) {
		console.log('\nEffect Reactions by Name:')
		const sorted = Object.entries(counters.byNameReactions)
			.sort(([, a], [, b]) => (b as number) - (a as number))
		for (const [name, count] of sorted) {
			console.log(`  ${String(name).padEnd(30)}: ${count}`)
		}
	}
	console.log('============================\n')
})
