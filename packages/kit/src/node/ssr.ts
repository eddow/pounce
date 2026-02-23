import { createScope, getContext, type RequestScope } from '../api/context.js'
import { escapeJson, type SSRDataMap } from '../api/ssr-hydration.js'
import { runWithContext } from './context.js'

// Re-export universal hydration utilities for convenience
export {
	clearSSRData,
	escapeJson,
	getSSRData,
	getSSRId,
	injectSSRData,
	type SSRDataMap,
} from '../api/ssr-hydration.js'
export { setPlatform } from '../platform/shared.js'
export { createTestAdapter } from '../platform/test.js'
// Re-export platform adapter types for SSR engines to implement
export type { PlatformAdapter } from '../platform/types.js'

/**
 * Run a function within an SSR context.
 * Delegates to runWithContext from api/context.
 *
 * Note: request isolation (ALS, per-request client) is the SSR engine's
 * responsibility. The engine should call `setPlatform()` with its own
 * adapter before invoking this.
 */
export async function withSSRContext<T>(
	fn: () => Promise<T>,
	origin?: string
): Promise<{ result: T; context: RequestScope }> {
	const existing = getContext()
	const scope = createScope(existing?.config)
	scope.origin = origin || existing?.origin
	scope.routeRegistry = existing?.routeRegistry

	return runWithContext(scope, async () => {
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

	if (html.includes('</head>')) {
		return html.replace('</head>', `${scripts}\n</head>`)
	}
	if (html.includes('</body>')) {
		return html.replace('</body>', `${scripts}\n</body>`)
	}

	return html + scripts
}
