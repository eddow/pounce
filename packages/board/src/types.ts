/**
 * Type definitions and augmentation support for @pounce/board
 * 
 * Users can extend RequestContext by declaring a module augmentation:
 * 
 * ```ts
 * declare module '@pounce/board/server' {
 *   interface RequestContext {
 *     user?: { id: string; email: string }
 *     session?: Session
 *   }
 * }
 * ```
 */

// Re-export core types from toolbox
export type {
	HttpMethod,
	RequestContext,
	Middleware,
	RouteHandler,
	RouteResponse,
} from '@pounce/toolbox/entry-no-dom'

export type { ApiError } from '@pounce/toolbox/entry-no-dom'

// Re-export router types from serverRouter namespace
import type { serverRouter } from '@pounce/toolbox/entry-no-dom'
export type RouteParams = serverRouter.RouteParams
export type RouteTreeNode = serverRouter.RouteTreeNode
export type RouteMatch = serverRouter.RouteMatch
export type ParsedPathSegment = serverRouter.ParsedPathSegment
