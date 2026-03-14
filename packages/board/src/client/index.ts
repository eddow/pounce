/**
 * Client-side exports for sursaut-board
 * Use: import { api } from 'sursaut-board/client'
 */

// API client
export {
	type ApiClientInstance,
	api,
	delete,
	get,
	type InterceptorMiddleware,
	intercept,
	patch,
	post,
	put,
} from '../lib/http/client.js'

// Types
export { ApiError } from '../lib/http/core.js'
export { SursautResponse } from '../lib/http/response.js'
export { defineRoute, type RouteDefinition } from '../lib/router/defs.js'
export {
	buildRouteTree,
	matchRoute,
	parseSegment,
	type RouteMatch,
	type RouteParams,
	type RouteTreeNode,
} from '../lib/router/index.js'
// SSR hydration (client-side consumption)
export { getSSRData, getSSRId } from '../lib/ssr/utils.js'
