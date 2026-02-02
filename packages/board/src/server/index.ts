/**
 * Server-side exports for @pounce/board
 * Consumes @pounce/toolbox
 */

import { serverRouter } from '@pounce/toolbox/entry-no-dom'
export * from '@pounce/toolbox/entry-no-dom'

// Re-export router functions flattened for compatibility
export const buildRouteTree = serverRouter.buildRouteTree
export const matchRoute = serverRouter.matchRoute // Verified locally in node-router that it is exported as matchRoute
export const collectMiddleware = serverRouter.collectMiddleware
export const parseSegment = serverRouter.parseSegment

// Types - re-export for augmentation support
export type RouteMatch = serverRouter.RouteMatch
export type RouteTreeNode = serverRouter.RouteTreeNode
export type RouteParams = serverRouter.RouteParams
export type SegmentInfo = serverRouter.SegmentInfo

// Re-export core types to enable declaration merging
export type {
	RequestContext,
	Middleware,
	RouteHandler,
	RouteResponse,
	HttpMethod,
} from '@pounce/toolbox/entry-no-dom'
