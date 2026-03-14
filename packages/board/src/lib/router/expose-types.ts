// ==========================================
// expose-types.ts — Type-level utilities for the expose() API routing system.
// This file is TYPES ONLY. No runtime code. Safe to import from client code.
// Runtime implementation lives in expose.ts (server-only).
// ==========================================

// 1. The Magic String Extractor
// Recursively hunts for [param] in a string and builds a type record from it.
type ExtractParams<Path extends string> = Path extends `${string}[${infer Param}]${infer Rest}`
	? { [K in Param]: string } & ExtractParams<Rest>
	: {}

// 2. The Type Prettifier
// Stops TS from showing ugly intersections like `{ fileId: string } & { userId: string }`
// and squashes them into a clean `{ fileId: string; userId: string }`.
type Prettify<T> = { [K in keyof T]: T[K] } & {}

// 3. Framework Base Types
export type HTTPVerb = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'stream'

// DESIGN: SursautRequest will be expanded (headers, body, env, etc.)
// The handler contract is req → Promise<value>. No `res` object.
// For `stream`, the handler returns a ReadableStream (see @sursaut/kit stream client).
export interface SursautRequest<Params = Record<string, string>> {
	params: Params
	url: URL
	raw: Request
	request: Request
}

export type RouteHandler<Params> = (req: SursautRequest<Params>) => any

// DESIGN: `middle` = middleware. Combines pre-check (abort) and wrapping (next) patterns.
// - Return void/undefined → next middleware (or handler) is called automatically.
// - Return a Response → chain short-circuits, Response is sent to client.
// - Call next() to wrap the downstream chain (run code before AND after handler).
// - Can mutate req (e.g. req.user = ...) to pass context downstream.
//
// CROSS-TREE INHERITANCE: `middle` cascades across the directory hierarchy.
// If routes/admin/index.ts declares middle: [requireAuth], ALL sibling files
// in routes/admin/ (e.g. users.ts, settings.ts) inherit it automatically.
// Stacking order: ancestor-first. Computed once at boot, stored flat in the registry.
export type MiddleNext = () => Promise<Response>
export type MiddleFunction<Params = Record<string, string>> = (
	req: SursautRequest<Params>,
	next: MiddleNext
) => Response | void | Promise<Response | void>

// Reserved keys that are NOT sub-path branches.
// Sub-paths are structurally disambiguated: they MUST start with '/'.
// This means metadata keys can grow freely without collision risk.
export type ReservedKey = HTTPVerb | 'provide' | 'middle'

// 4. The Recursive Tree Validator
// RouteNode provides contextual typing for object literals passed to expose().
// It supports HTTP verbs + provide/middle + nested '/...' branches.
export type RouteNode<CurrentParams> = {
	middle?: MiddleFunction<Prettify<CurrentParams>>[]
	provide?: RouteHandler<Prettify<CurrentParams>>
} & {
	[K in HTTPVerb]?: RouteHandler<Prettify<CurrentParams>>
} & {
	[K in `/${string}`]?: RouteNode<Prettify<CurrentParams & ExtractParams<K>>>
}

// Backward-compatible alias kept for existing imports/usages.
export type ValidatedTree<CurrentParams, T = RouteNode<Prettify<CurrentParams>>> =
	T extends RouteNode<Prettify<CurrentParams>> ? T : never

// ==========================================
// CLIENT KIT UTILITIES (Type Extraction)
// ==========================================

/**
 * Extracts the awaited return type of a specific HTTP verb from a route node.
 * Usage: type Users = InferVerb<typeof UsersRoute, 'get'>
 */
export type InferVerb<Node, Verb extends HTTPVerb> = Node extends {
	[K in Verb]: (...args: any[]) => infer R
}
	? Awaited<R>
	: never

/**
 * Extracts the awaited return type of the 'provide' loader.
 *
 * `provide` is SSR-only: called during server rendering to hydrate the sibling .tsx component.
 * It is NOT an HTTP endpoint — regular GET/POST/etc. requests never invoke `provide`.
 *
 * CROSS-TREE INHERITANCE: `provide` cascades across the directory hierarchy.
 * If routes/admin/index.ts has provide → { user, perms }, and routes/admin/users.ts
 * has provide → { userList }, the component receives the merged result:
 * { user, perms, userList }. Child provide receives parent data in req.
 *
 * CLIENT ACCESS:
 * - SSR: provide data is serialized into the HTML (hydration payload).
 * - SPA navigation: the client fetches provide data via an internal convention
 *   (e.g. dedicated header or query param), the server calls provide and returns it.
 *
 * Usage: type PageData = InferProvide<typeof PageRoute>
 */
export type InferProvide<Node> = Node extends {
	provide: (...args: any[]) => infer R
}
	? Awaited<R>
	: never

/**
 * Walk a route tree by path and extract a verb return type or sub-tree.
 * Branch keys start with '/', verbs don't.
 *
 * Usage:
 *   import type Route from '../../routes/teams/[teamId]/users.ts'
 *   type User = InferPath<typeof Route, '/[userId]/get'>
 *
 * Instead of the more verbose:
 *   type User = InferVerb<typeof Route['/[userId]'], 'get'>
 */
export type InferPath<Node, Path extends string> = Path extends `/${
	infer Segment // Match '/branch/rest' — split on second '/' to get the branch key
}/${infer Tail}`
	? `/${Segment}` extends keyof Node
		? InferPath<Node[`/${Segment}`], Tail extends `/${string}` ? Tail : `/${Tail}`>
		: never
	: // Match exact path
		Path extends keyof Node
		? Node[Path] extends (...args: any[]) => infer R
			? Awaited<R>
			: Node[Path]
		: // Or try removing the leading slash to match a verb (e.g. '/get' -> 'get')
			Path extends `/${infer Verb}`
			? Verb extends keyof Node
				? Node[Verb] extends (...args: any[]) => infer R
					? Awaited<R>
					: Node[Verb]
				: never
			: never
