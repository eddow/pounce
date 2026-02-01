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

// Types
export type RouteMatch = serverRouter.RouteMatch
export type RouteTreeNode = serverRouter.RouteTreeNode
export type RouteParams = serverRouter.RouteParams
export type SegmentInfo = serverRouter.SegmentInfo
