import { isDev } from 'mutts'
import { getContext } from './context.js'

export type SSRDataMap = Record<string, { id: string; data: unknown }>

const clientHydrationCache = new Map<string, unknown>()

/**
 * Generate unique ID for SSR data
 * Uses only the URL path for determinism between server and client
 */
export function getSSRId(url: string | URL): string {
	const path = typeof url === 'string' ? url : url.pathname + url.search

	// Use base64 encoding for the path to ensure it's predictable and reversible
	// We use 'btoa' which is universal (available in Node 16+ and browsers)
	const pathHash = btoa(path).replace(/[=/+]/g, '')

	return `pounce-data-${pathHash}`
}

/**
 * Inject SSR data (used server-side)
 */
export function injectSSRData(id: string, data: unknown): void {
	const ctx = getContext()
	if (ctx) {
		ctx.ssr.responses.set(id, data)
	}
}

/**
 * Clear all SSR data
 */
export function clearSSRData(): void {
	const ctx = getContext()
	if (ctx) {
		ctx.ssr.responses.clear()
		ctx.ssr.counter = 0
	} else if (typeof window !== 'undefined') {
		clientHydrationCache.clear()
	}
}

/**
 * Get SSR data (universal)
 * 1. Checks server-side map if on server
 * 2. Checks script tags in DOM if on client
 */
export function getSSRData<T>(id: string): T | undefined {
	const ctx = getContext()

	// 1. If we have a context, we are in a managed SSR/Request environment
	if (ctx) {
		return ctx.ssr.responses.get(id) as T | undefined
	}

	// 2. Client-side or Test check (DOM + Cache)
	// If a document is present but no context, we are either on the client or in a unit test.
	if (typeof document !== 'undefined') {
		// Check cache first
		if (clientHydrationCache.has(id)) {
			const cached = clientHydrationCache.get(id) as T
			clientHydrationCache.delete(id) // One-time consumption
			return cached
		}

		const script = document.getElementById(id)
		if (!script) {
			if (isDev) {
				console.warn(`[@pounce/board] SSR hydration: Script tag with ID "${id}" not found.`)
			}
			return undefined
		}

		if (!script.textContent) {
			if (isDev) {
				console.warn(`[@pounce/board] SSR hydration: Script tag "${id}" is empty.`)
			}
			return undefined
		}

		try {
			const data = JSON.parse(script.textContent) as T
			// One-time consumption from DOM
			script.remove()
			return data
		} catch (err) {
			if (isDev) {
				console.warn(`[@pounce/board] SSR hydration: Failed to parse JSON for "${id}".`, err)
			}
			return undefined
		}
	}

	return undefined
}

/**
 * Escape JSON for safe injection into HTML
 */
export function escapeJson(json: string): string {
	return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}
