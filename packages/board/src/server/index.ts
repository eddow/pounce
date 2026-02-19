/**
 * Server-side exports for pounce-board
 * Use: import { buildRouteTree } from 'pounce-board/server'
 */

// Adapters
export { clearRouteTreeCache, createPounceApp, createPounceMiddleware } from '../adapters/hono.js'
// HTTP client (works on server too for SSR dispatch)
export {
	api,
	clearInterceptors,
	clearRouteRegistry,
	clearSSRData,
	config,
	disableSSR,
	enableSSR,
	intercept,
	setRouteRegistry,
} from '../lib/http/client.js'
// Context
export {
	createScope,
	flushSSRPromises,
	getContext,
	type RequestScope,
	runWithContext,
	trackSSRPromise,
} from '../lib/http/context.js'
// HTTP core
export {
	ApiError,
	addSecurityHeaders,
	compressResponse,
	createErrorResponse,
	createJsonResponse,
	type HttpMethod,
	type Middleware,
	type RequestContext,
	type RouteHandler,
	type RouteResponse,
	runMiddlewares,
} from '../lib/http/core.js'
// Proxy
export { defineProxy, type ProxyConfig, type ProxyEndpointConfig } from '../lib/http/proxy.js'
export { defineRoute, type RouteDefinition } from '../lib/router/defs.js'
// Router
export {
	buildRouteTree,
	matchRoute,
	parseSegment,
	type RouteMatch,
	type RouteParams,
	type RouteTreeNode,
} from '../lib/router/index.js'
// SSR injection
export {
	escapeJson,
	getCollectedSSRResponses,
	getSSRId,
	injectApiResponses,
	injectSSRData,
	type SSRDataMap,
	withSSRContext,
} from '../lib/ssr/utils.js'
