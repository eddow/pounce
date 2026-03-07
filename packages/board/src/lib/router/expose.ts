// ==========================================
// expose.ts — Runtime implementation of the expose() API routing system.
// Types are in expose-types.ts (client-importable, no runtime code).
// ==========================================

import type {
	HTTPVerb,
	InferPath,
	InferProvide,
	InferVerb,
	MiddleFunction,
	MiddleNext,
	PounceRequest,
	ReservedKey,
	RouteHandler,
	RouteNode,
	ValidatedTree,
} from './expose-types.js'

// Re-export all types so consumers can import from a single module
export type {
	HTTPVerb,
	InferPath,
	InferProvide,
	InferVerb,
	MiddleFunction,
	MiddleNext,
	PounceRequest,
	RouteNode,
	ReservedKey,
	RouteHandler,
	ValidatedTree,
}

// ==========================================
// Route Registry — populated at boot by expose() calls
// ==========================================

export interface RouteEndpoint {
	handler: any
	middle: MiddleFunction[]
}

export interface RouteRegistryEntry {
	endpoints: Map<HTTPVerb, RouteEndpoint>
	middle: MiddleFunction[]
	provide?: any
	filePath?: string
}

declare global {
	var __POUNCE_EXPOSE_ROUTE_REGISTRY__: Map<string, RouteRegistryEntry> | undefined
	var __POUNCE_EXPOSE_FILE_REGISTRY__: Map<string, any> | undefined
}

export const routeRegistry =
	globalThis.__POUNCE_EXPOSE_ROUTE_REGISTRY__ ??
	(globalThis.__POUNCE_EXPOSE_ROUTE_REGISTRY__ = new Map<string, RouteRegistryEntry>())

export const fileRegistry =
	globalThis.__POUNCE_EXPOSE_FILE_REGISTRY__ ??
	(globalThis.__POUNCE_EXPOSE_FILE_REGISTRY__ = new Map<string, any>())

export function clearExposeRegistry(): void {
	routeRegistry.clear()
	fileRegistry.clear()
}

function toStreamHandler(handler: RouteHandler<any>): RouteHandler<any> {
	return async (req: PounceRequest) => {
		const result = await handler(req)
		if (result instanceof Response) return result

		const asyncIterable =
			result && typeof result === 'object' && Symbol.asyncIterator in result
				? (result as AsyncIterable<unknown>)
				: null

		if (!asyncIterable) return result

		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of asyncIterable) {
						controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`))
					}
					controller.close()
				} catch (error) {
					controller.error(error)
				}
			},
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		})
	}
}

// ==========================================
// expose() — Runtime function
// ==========================================

// FileParams allows the developer to inject params coming from the filename path.
// (e.g. file at routes/teams/[teamId]/users.ts → expose<{ teamId: string }>(...))
// Returns `T` so the client can use `typeof` to extract the exact shape.
//
// RUNTIME BEHAVIOR:
//   1. Read globalThis.__POUNCE_CURRENT_FILE__ to determine baseUrl
//   2. Flatten the config tree into the central routeRegistry
//   3. This runs once per file at server start (+ on HMR cache clear)
export function expose<
	FileParams extends Record<string, string> = Record<string, never>,
	T extends RouteNode<FileParams> = RouteNode<FileParams>,
>(tree: T): T {
	const currentFile = (globalThis as any).__POUNCE_CURRENT_FILE__
	const currentBaseUrl: string = (globalThis as any).__POUNCE_CURRENT_BASE_URL__ || ''

	if (currentFile) {
		fileRegistry.set(currentFile, { tree, baseUrl: currentBaseUrl })
	}

	let inheritedMiddle: MiddleFunction[] = []
	let inheritedProvide: any

	if (routeRegistry.has(currentBaseUrl)) {
		const existing = routeRegistry.get(currentBaseUrl)!
		inheritedMiddle = existing.middle
		inheritedProvide = existing.provide
	} else if (currentBaseUrl) {
		// Find closest ancestor
		const segments = currentBaseUrl.split('/').filter(Boolean)
		for (let i = segments.length - 1; i >= 0; i--) {
			const ancestorPath = `/${segments.slice(0, i).join('/')}`
			const ancestor = routeRegistry.get(ancestorPath === '//' ? '/' : ancestorPath)
			if (ancestor) {
				inheritedMiddle = ancestor.middle
				inheritedProvide = ancestor.provide
				break
			}
		}
	}

	function walk(
		node: any,
		currentPath: string,
		parentMiddle: MiddleFunction[],
		prefixProvide: any
	) {
		const nodeMiddle: MiddleFunction[] = Array.isArray(node.middle) ? node.middle : []
		const combinedMiddle = [...parentMiddle, ...nodeMiddle]

		let entry = routeRegistry.get(currentPath)
		if (!entry) {
			entry = { endpoints: new Map(), middle: combinedMiddle, filePath: currentFile }
			routeRegistry.set(currentPath, entry)
		} else {
			entry.middle = combinedMiddle
		}

		let composedProvide = prefixProvide
		if (node.provide) {
			if (prefixProvide) {
				const pFn = prefixProvide
				const cFn = node.provide
				composedProvide = async (req: PounceRequest) => {
					const pData = await pFn(req)
					if (pData) (req as any).provide = pData
					const cData = await cFn(req)
					return { ...(pData || {}), ...(cData || {}) }
				}
			} else {
				composedProvide = node.provide
			}
		}

		if (composedProvide) {
			entry.provide = composedProvide
		}

		for (const key in node) {
			if (key === 'middle' || key === 'provide') continue

			if (key.startsWith('/')) {
				// Sub-path branch
				const subPath = currentPath === '/' ? key : `${currentPath.replace(/\/$/, '')}${key}`
				walk(node[key], subPath, combinedMiddle, composedProvide)
			} else {
				// HTTP Verb leaf
				entry.endpoints.set(key as HTTPVerb, {
					handler: key === 'stream' ? toStreamHandler(node[key]) : node[key],
					middle: combinedMiddle,
				})
			}
		}
	}

	walk(tree, currentBaseUrl, inheritedMiddle, inheritedProvide)
	return tree as T
}

/*
// ==========================================
// EXAMPLE USAGE:
// File: src/routes/teams/[teamId]/users.ts
// ==========================================

export default expose<{ teamId: string }>({
    // Middleware — cascades to all sub-paths AND sibling files in this directory.
    middle: [requireAuth],

    // SSR-only loader — cascades to child routes, merged parent-first.
    // Not an HTTP endpoint. Client receives it via hydration or internal fetch.
    provide: async (req) => {
        return { teamName: 'Acme' };
    },

    // GET /teams/:teamId/users (when Accept != text/html)
    get: async (req) => {
        req.params.teamId; // ✅ string
        return { success: true };
    },

    // Sub-paths MUST start with '/'
    '/[userId]': {
        get: async (req) => {
            req.params.teamId; // ✅ inherited from file path
            req.params.userId; // ✅ inferred from '/[userId]' key
            return { user: { id: req.params.userId } };
        }
    }
});

// ==========================================
// ON THE CLIENT (type-only imports)
// ==========================================
// import type UsersRoute from '../../routes/teams/[teamId]/users.ts';
// import type { InferProvide, InferPath, InferVerb } from '@pounce/board';
//
// type PageData     = InferProvide<typeof UsersRoute>;
// type UserResponse = InferPath<typeof UsersRoute, '/[userId]/get'>;
// type AllUsers     = InferVerb<typeof UsersRoute, 'get'>;
*/
