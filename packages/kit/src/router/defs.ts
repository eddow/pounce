export type RouteParams<_Path extends string> = Record<string, string>

export type { AssertSchema, CallableRoute, RouteDefinition } from '../api/defs'
export { defineRoute } from '../api/defs'
