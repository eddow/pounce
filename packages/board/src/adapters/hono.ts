/**
 * Hono adapter for pounce-board
 * Automatically integrates file-based routes with Hono
 */

import type { Context, MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { enableSSR, setRouteRegistry } from '../lib/http/client.js'
import { runMiddlewares } from '../lib/http/core.js'
import { buildRouteTree, matchRoute, type RouteTreeNode } from '../lib/router/index.js'
import { injectSSRContent, withSSRContext } from '../lib/ssr/utils.js'

export interface PounceMiddlewareOptions {
	/** Path to routes directory. Defaults to './routes' */
	routesDir?: string
	/** Custom module importer (e.g. vite.ssrLoadModule) */
	importFn?: (path: string) => Promise<any>
	/** Glob routes object for environments without filesystem access (e.g. production) */
	globRoutes?: Record<string, () => Promise<any>>
}

// Cached route tree (lazily initialized per routesDir)
const routeTreeCache = new Map<string, RouteTreeNode>()

/**
 * Create Hono middleware that handles pounce-board routes
 */
export function createPounceMiddleware(options?: PounceMiddlewareOptions): MiddlewareHandler {
	const routesDir = options?.routesDir ?? './routes'

	return async (c: Context, next: () => Promise<void>): Promise<Response | undefined> => {
		const url = new URL(c.req.url)
		const origin = `${url.protocol}//${url.host}`

		return (
			await withSSRContext(async () => {
				// Build route tree once (lazy init per routesDir)
				let routeTree = routeTreeCache.get(routesDir)
				if (!routeTree) {
					routeTree = await buildRouteTree(routesDir, options?.importFn, options?.globRoutes)
					routeTreeCache.set(routesDir, routeTree)
				}

				// Set route registry for SSR dispatch
				setRouteRegistry({
					match: (path, method) => {
						const m = matchRoute(path, routeTree!, method)
						if (m?.handler) {
							return {
								handler: m.handler,
								middlewareStack: m.middlewareStack,
								params: m.params,
							}
						}
						return null
					},
				})

				// Match the request path
				const method = c.req.method.toUpperCase()
				const reqUrl = new URL(c.req.url)
				const match = matchRoute(reqUrl.pathname, routeTree, method)

				const accept = c.req.header('Accept') || ''
				const prefersHtml = accept.includes('text/html')

				if (match) {
					// If it's a GET request and the client prefers HTML, we should NOT
					// return the API handler response directly. Instead, we should
					// fall through to allow SSR/HTML rendering.
					if (method === 'GET' && prefersHtml) {
						// Fall through
					} else if (match.handler) {
						// Build request context
						const ctx = {
							request: c.req.raw,
							params: match.params,
						}

						// Execute middleware stack and handler
						const response = await runMiddlewares(match.middlewareStack, ctx, match.handler)

						// Return the pounce-board response directly
						return response
					}
				}

				// No route matched - proceed to next Hono handler
				// Enable SSR for potential HTML rendering downstream
				enableSSR()
				await next()

				// Handle SSR injection for HTML responses
				const contentType = c.res.headers.get('Content-Type')
				if (contentType?.includes('text/html')) {
					const html = await c.res.text()
					// Inject content (API, styles, etc.) into the HTML body
					const finalHtml = await injectSSRContent(html)

					// Create new response with injected HTML

					c.res = new Response(finalHtml, {
						status: c.res.status,
						headers: c.res.headers,
					})
					// Content-Length needs to be recalculated or removed
					c.res.headers.delete('Content-Length')
				}
			}, origin)
		).result
	}
}

/**
 * Create a Hono app with pounce-board integration
 */
export function createPounceApp(options?: PounceMiddlewareOptions): Hono {
	const app = new Hono()
	app.use('*', createPounceMiddleware(options))
	return app
}

/**
 * Clear the route tree cache to force a rebuild on the next request.
 *
 * Crucial for Hot Module Replacement (HMR). When a route file is added,
 * removed, or modified, the cache must be cleared so that `buildRouteTree`
 * runs again, discovering new files and re-importing updated modules
 * (via `vite.ssrLoadModule`).
 */
export function clearRouteTreeCache(): void {
	routeTreeCache.clear()
}
