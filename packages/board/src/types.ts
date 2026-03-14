/**
 * Type definitions and augmentation support for @sursaut/board
 *
 * Users can extend RequestContext by declaring a module augmentation:
 *
 * ```ts
 * declare module '@sursaut/board/server' {
 *   interface RequestContext {
 *     user?: { id: string; email: string }
 *     session?: Session
 *   }
 * }
 * ```
 */

// Types - re-export for augmentation support from core
export type {
	HttpMethod,
	Middleware,
	RequestContext,
	RouteHandler,
	RouteResponse,
} from './lib/http/core.js'

export type { ParsedPathSegment, RouteParams, RouteTreeNode } from './lib/router/index.js'
