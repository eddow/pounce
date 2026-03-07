/**
 * Performance instrumentation shim for @pounce/kit
 * Conditionally exports native Performance API in development
 */

import { isDev } from 'mutts'

const perfEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
const perfFlag = perfEnv.VITE_PERF === 'true'
const perfLogFlag = perfEnv.VITE_PERF_LOG === 'true'
const enabled = isDev || perfFlag

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined

export function recordPerf(name: string, start: number, end = perf?.now()) {
	if (!perf || end == null) return
	perf.measure(name, { start, end })
}

const perfState = globalThis as typeof globalThis & { __pounceKitPerfLogging?: boolean }

if (
	perf &&
	perfLogFlag &&
	typeof PerformanceObserver !== 'undefined' &&
	!perfState.__pounceKitPerfLogging
) {
	perfState.__pounceKitPerfLogging = true
	new PerformanceObserver((list) => {
		for (const entry of list.getEntries()) {
			if (!entry.name.startsWith('route:')) continue
			console.info(`[perf] ${entry.name} ${entry.duration.toFixed(3)}ms`)
		}
	}).observe({ entryTypes: ['measure'] })
}
