import { withSSR as coreWithSSR } from '@pounce/core/server'
import { createScope, getContext, type RequestScope, runWithContext } from '../api/context.js'
import { escapeJson, type SSRDataMap } from '../api/ssr-hydration.js'
import { createClientInstance, runWithClientAsync } from './bootstrap.js'

// Re-export universal hydration utilities for convenience
export {
	clearSSRData,
	escapeJson,
	getSSRData,
	getSSRId,
	injectSSRData,
	type SSRDataMap,
} from '../api/ssr-hydration.js'

/**
 * Unified SSR wrapper that composes both @pounce/core and @pounce/kit isolation.
 * This ensures both the JSDOM environment and the client singleton are properly isolated per request.
 */
export async function withSSR<T>(
	fn: () => Promise<T>,
	options?: { url?: string | URL }
): Promise<T> {
	return coreWithSSR((_dom: { document: Document; window: Window }) => {
		return runWithClientAsync(async (_client) => {
			return fn()
		}, options)
	})
}

/**
 * Synchronous version of withSSR for simple cases.
 */
export function withSSRSync<T>(fn: () => T, options?: { url?: string | URL }): T {
	return coreWithSSR((_dom: { document: Document; window: Window }) => {
		const clientInstance = createClientInstance(options?.url)
		const { als } = require('../node/bootstrap.js')
		return als.run(clientInstance, () => fn())
	})
}

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
 * Inject API responses into HTML as script tags
 */
export function injectApiResponses(html: string, responses: SSRDataMap): string {
	const scripts = Object.entries(responses)
		.map(
			([_, { id, data }]) =>
				`<script type="application/json" id="${id}">${escapeJson(JSON.stringify(data))}</script>`
		)
		.join('\n')

	// Insert before </head> if exists, otherwise before </body>
	if (html.includes('</head>')) {
		return html.replace('</head>', `${scripts}\n</head>`)
	}
	if (html.includes('</body>')) {
		return html.replace('</body>', `${scripts}\n</body>`)
	}

	// Fallback: append to end
	return html + scripts
}
