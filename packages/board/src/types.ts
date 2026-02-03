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

// Re-export core types from kit
export * from '@pounce/kit'
import * as kitNode from '@pounce/kit/node'

// Re-export router functions flattened for compatibility
export const buildRouteTree = kitNode.serverRouter.buildRouteTree
export const matchRoute = kitNode.serverRouter.matchFileRoute
export const collectMiddleware = kitNode.serverRouter.collectMiddleware
export const parseSegment = kitNode.serverRouter.parseSegment

// Types - re-export for augmentation support
export type FileRouteMatch = kitNode.serverRouter.FileRouteMatch
export type RouteTreeNode = kitNode.serverRouter.RouteTreeNode
export type RouteParams = kitNode.serverRouter.RouteParams
export type SegmentInfo = kitNode.serverRouter.SegmentInfo

// Re-export core types to enable declaration merging
export type {
	RequestContext,
	Middleware,
	RouteHandler,
	RouteResponse,
	HttpMethod,
} from '@pounce/kit'
