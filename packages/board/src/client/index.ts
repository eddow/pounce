/**
 * Client-side exports for pounce-board
 * Use: import { api } from 'pounce-board/client'
 */

// API client
export {
	type ApiClientInstance,
	api,
	del,
	get,
	type InterceptorMiddleware,
	intercept,
	patch,
	post,
	put,
} from '../lib/http/client.js'

// Types
export { ApiError } from '../lib/http/core.js'
export { PounceResponse } from '../lib/http/response.js'
export { defineRoute, type RouteDefinition } from '../lib/router/defs.js'
// SSR hydration (client-side consumption)
export { getSSRData, getSSRId } from '../lib/ssr/utils.js'
