import { test, expect } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

/**
 * Performance profiling test for the demo app.
 *
 * Captures a CDP CPU profile and prints the top self-time functions.
 *
 * Run:  pnpm exec playwright test --config playwright.perf.config.ts
 */
test('overview performance profile', async ({ page }) => {
	const cdp = await page.context().newCDPSession(page)

	// Start CPU profiling
	await cdp.send('Profiler.enable')
	await cdp.send('Profiler.start')

	const startTime = Date.now()
	await page.goto('/', { timeout: 60_000 })
	await expect(page.locator('h2')).toContainText('Pounce UI', { timeout: 60_000 })
	const loadTime = Date.now() - startTime

	// Stop profiling
	const { profile } = await cdp.send('Profiler.stop')
	await cdp.send('Profiler.disable')

	// Save raw profile
	const sandboxDir = '/home/fmdm/dev/ownk/pounce/packages/ui/sandbox'
	mkdirSync(sandboxDir, { recursive: true })
	writeFileSync(sandboxDir + '/cpu-profile.cpuprofile', JSON.stringify(profile))

	// Analyze: compute self-time per function
	type Node = typeof profile.nodes[0]
	const nodeMap = new Map<number, Node>()
	for (const node of profile.nodes) nodeMap.set(node.id, node)

	const selfTime = new Map<number, number>()
	const { samples, timeDeltas } = profile
	if (samples && timeDeltas) {
		for (let i = 0; i < samples.length; i++) {
			const id = samples[i]
			const dt = timeDeltas[i] || 0
			selfTime.set(id, (selfTime.get(id) || 0) + dt)
		}
	}

	// Aggregate by function name + url
	const fnTime = new Map<string, { self: number; url: string; line: number }>()
	for (const [id, time] of selfTime) {
		const node = nodeMap.get(id)
		if (!node) continue
		const cf = node.callFrame
		const name = cf.functionName || '(anonymous)'
		const key = `${name}@${cf.url}:${cf.lineNumber}`
		const existing = fnTime.get(key)
		if (existing) {
			existing.self += time
		} else {
			fnTime.set(key, { self: time, url: cf.url, line: cf.lineNumber })
		}
	}

	// Sort by self-time descending
	const sorted = [...fnTime.entries()]
		.sort((a, b) => b[1].self - a[1].self)
		.slice(0, 30)

	const pounce = await page.evaluate(() => (window as any).__POUNCE_PERF__ || {})

	console.log('\n══════════════════════════════════════════════')
	console.log(`  LOAD TIME:          ${loadTime} ms`)
	console.log('  Pounce counters:')
	for (const [k, v] of Object.entries(pounce)) {
		if (typeof v === 'number') console.log(`    ${k}: ${v}`)
	}
	console.log('──────────────────────────────────────────────')
	console.log('  Top 30 functions by self-time (µs):')
	for (const [key, { self }] of sorted) {
		console.log(`    ${String(self).padStart(8)}  ${key}`)
	}
	console.log('══════════════════════════════════════════════\n')

	expect(loadTime).toBeLessThan(3000)
})

test('docs /ui/forms performance profile', async ({ page }) => {
	const cdp = await page.context().newCDPSession(page)

	await cdp.send('Profiler.enable')
	await cdp.send('Profiler.start')

	// Load the SPA shell first
	await page.goto('http://127.0.0.1:5290/', { timeout: 60_000 })
	await page.waitForSelector('#app', { timeout: 30_000 })
	await page.waitForTimeout(1000)

	// Now profile the navigation to /ui/forms
	await cdp.send('Profiler.stop')
	await cdp.send('Profiler.start')

	const startTime = Date.now()
	await page.evaluate(() => window.history.pushState({}, '', '/ui/forms'))
	await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')))
	await page.waitForTimeout(5000)
	const loadTime = Date.now() - startTime

	const { profile } = await cdp.send('Profiler.stop')
	await cdp.send('Profiler.disable')

	// Save raw profile
	const sandboxDir = '/home/fmdm/dev/ownk/pounce/packages/ui/sandbox'
	mkdirSync(sandboxDir, { recursive: true })
	writeFileSync(sandboxDir + '/cpu-profile-forms.cpuprofile', JSON.stringify(profile))

	// Analyze: compute self-time per function
	type Node = typeof profile.nodes[0]
	const nodeMap = new Map<number, Node>()
	for (const node of profile.nodes) nodeMap.set(node.id, node)

	const selfTime = new Map<number, number>()
	const { samples, timeDeltas } = profile
	if (samples && timeDeltas) {
		for (let i = 0; i < samples.length; i++) {
			const id = samples[i]
			const dt = timeDeltas[i] || 0
			selfTime.set(id, (selfTime.get(id) || 0) + dt)
		}
	}

	const base = 'http://127.0.0.1:5290'
	const fnTime = new Map<string, { self: number }>()
	for (const [id, time] of selfTime) {
		const node = nodeMap.get(id)
		if (!node) continue
		const cf = node.callFrame
		const name = cf.functionName || '(anonymous)'
		const url = cf.url.replace(base + '/@fs/home/fmdm/dev/ownk/', '').replace(base + '/', '')
		const key = `${name}@${url}:${cf.lineNumber}`
		const existing = fnTime.get(key)
		if (existing) existing.self += time
		else fnTime.set(key, { self: time })
	}

	const sorted = [...fnTime.entries()]
		.sort((a, b) => b[1].self - a[1].self)
		.slice(0, 40)

	console.log('\n══════════════════════════════════════════════')
	console.log(`  /ui/forms LOAD TIME:  ${loadTime} ms`)
	console.log('──────────────────────────────────────────────')
	console.log('  Top 40 functions by self-time (µs):')
	for (const [key, { self }] of sorted) {
		console.log(`    ${String(self).padStart(8)}  ${key}`)
	}
	console.log('══════════════════════════════════════════════\n')

	expect(loadTime).toBeLessThan(5000)
})
