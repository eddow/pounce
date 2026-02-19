import { createScope, getContext, type RequestScope, runWithContext } from '../http/context.js'

export type SSRDataMap = Record<string, { id: string; data: unknown }>

let _globalClientCounter = 0
const clientHydrationCache = new Map<string, unknown>()

/**
 * Run a function within an SSR context (Legacy wrapper)
 * Now delegates to runWithContext from lib/http/context
 */
export async function withSSRContext<T>(
	fn: () => Promise<T>,
	origin?: string
): Promise<{ result: T; context: RequestScope }> {
	// Always create a new scope for nested isolation
	const existing = getContext()
	const scope = createScope(existing?.config)
	scope.origin = origin || existing?.origin
	scope.routeRegistry = existing?.routeRegistry
	// We do NOT inherit responses by default to maintain isolation as per tests

	return runWithContext(scope, async () => {
		// Enable SSR by default if using this legacy wrapper, as it implies SSR usage
		scope.config.ssr = true
		const result = await fn()
		return { result, context: scope }
	})
}

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
 * Get all collected SSR responses as a map for injection
 */
export function getCollectedSSRResponses(): SSRDataMap {
	const ctx = getContext()
	if (!ctx) return {}

	const map: SSRDataMap = {}
	for (const [id, data] of ctx.ssr.responses.entries()) {
		map[id] = { id, data }
	}
	return map
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
		_globalClientCounter = 0
		clientHydrationCache.clear()
	}
}

// Injector Registry
export type Injector = (context: RequestScope) => string | Promise<string>
const injectors: Injector[] = []

/**
 * Register a custom SSR data injector
 * @param fn Function that returns HTML string (e.g. script/style tags) to be injected
 */
export function registerInjector(fn: Injector): void {
	injectors.push(fn)
}

// Register default API data injector
registerInjector((ctx) => {
	if (!ctx.config.ssr) return ''
	const scripts = []

	// Inject collected SSR responses
	for (const [id, data] of ctx.ssr.responses.entries()) {
		scripts.push(
			`<script type="application/json" id="${id}">${escapeJson(JSON.stringify(data))}</script>`
		)
	}

	return scripts.join('\n')
})

/**
 * Inject all registered content into HTML
 * Runs all injectors and appends content to head or body
 */
export async function injectSSRContent(html: string): Promise<string> {
	const ctx = getContext()

	let injectedContent = ''

	// Always run injectors if context exists (they check config.ssr internally if needed)
	if (ctx) {
		for (const injector of injectors) {
			injectedContent += `${await injector(ctx)}\n`
		}
	} else {
		// Fallback for when context is lost but we have collected responses (rare/legacy)
		// logic moved to injectors, so strictly we need context now.
	}

	if (!injectedContent.trim()) return html

	// Insert before </head> if exists, otherwise before </body>
	if (html.includes('</head>')) {
		return html.replace('</head>', `${injectedContent}</head>`)
	}
	if (html.includes('</body>')) {
		return html.replace('</body>', `${injectedContent}</body>`)
	}

	// Fallback: append to end
	return html + injectedContent
}

/**
 * [DEPRECATED] Inject API responses into HTML
 * Kept for backward compatibility but forwards to new system logic if possible
 * or performs simplified sync injection
 */
export function injectApiResponses(html: string, responses: SSRDataMap): string {
	// Sync fallback for legacy calls
	const scripts = Object.entries(responses)
		.map(
			([_, { id, data }]) =>
				`<script type="application/json" id="${id}">${escapeJson(JSON.stringify(data))}</script>`
		)
		.join('\n')

	if (html.includes('</head>')) {
		return html.replace('</head>', `${scripts}\n</head>`)
	}
	return html + scripts
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
			if (process.env.NODE_ENV === 'development') {
				console.warn(`[pounce-board] SSR hydration: Script tag with ID "${id}" not found.`)
			}
			return undefined
		}

		if (!script.textContent) {
			if (process.env.NODE_ENV === 'development') {
				console.warn(`[pounce-board] SSR hydration: Script tag "${id}" is empty.`)
			}
			return undefined
		}

		try {
			const data = JSON.parse(script.textContent) as T
			// One-time consumption from DOM
			script.remove()
			return data
		} catch (err) {
			if (process.env.NODE_ENV === 'development') {
				console.warn(`[pounce-board] SSR hydration: Failed to parse JSON for "${id}".`, err)
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
