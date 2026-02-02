/**
 * Server-side exports for @pounce/board
 * Consumes @pounce/kit
 */

import { serverRouter } from '@pounce/kit'
export * from '@pounce/kit'

// Re-export router functions flattened for compatibility
export const buildRouteTree = serverRouter.buildRouteTree
export const matchRoute = serverRouter.matchFileRoute // Verified locally in node-router that it is exported as matchRoute
export const collectMiddleware = serverRouter.collectMiddleware
export const parseSegment = serverRouter.parseSegment

// Types - re-export for augmentation support
export type FileRouteMatch = serverRouter.FileRouteMatch
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
} from '@pounce/kit'
