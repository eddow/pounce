/**
 * Server-side exports for @pounce/board
 * Consumes @pounce/kit/node for server-specific functionality
 */

import * as kitNode from '@pounce/kit/node'
export * from '@pounce/kit/node'

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
