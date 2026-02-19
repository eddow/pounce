/**
 * Main entry point for pounce-board (Universal)
 * re-exports client or server output based on environment via package.json conditions
 */

// Universal types and utilities
export {
	api,
	clearSSRData,
	config,
	disableSSR,
	enableSSR,
	getSSRData,
	getSSRId,
	type InterceptorMiddleware,
	intercept,
} from './lib/http/client.js'
export type {
	HttpMethod,
	Middleware,
	RequestContext,
	RouteHandler,
	RouteResponse,
} from './lib/http/core.js'
export { ApiError } from './lib/http/core.js'
export { defineProxy, type ProxyConfig, type ProxyEndpointConfig } from './lib/http/proxy.js'
export { PounceResponse } from './lib/http/response.js'
export { defineRoute, type RouteDefinition } from './lib/router/defs.js'
