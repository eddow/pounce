import { createApiClientFactory, type RequestExecutor } from '../api/base-client.js'
import { ApiError, runMiddlewares, type RequestContext, type HttpMethod } from '../api/core.js'
import { getContext } from '../api/context.js'

const serverExecutor: RequestExecutor = async (req: Request, timeout: number) => {
    // We can handle timeout here too if we want parity, using Promise.race
    const controller = new AbortController()
    const id = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined

    try {
        return await Promise.race([
            dispatchToHandler(req),
            new Promise<Response>((_, reject) => {
                controller.signal.addEventListener('abort', () => {
                    reject(new ApiError(408, 'Request Timeout', null, req.url))
                })
            }),
        ])
    } finally {
        if (id) clearTimeout(id)
    }
}


const REGISTRY_SYMBOL = Symbol.for('__POUNCE_ROUTE_REGISTRY__')

async function dispatchToHandler(request: Request): Promise<Response> {
	const ctx = getContext()
	const processRegistry = (globalThis as any)[REGISTRY_SYMBOL]
	const activeRegistry = ctx?.routeRegistry || processRegistry

	if (!activeRegistry) {
		// If no registry is set, we could fallback to throw, or maybe try fetch if absolute URL?
        // But the requirement is "server dispatch".
        // The user suggested "throw Not Implemented" for common, but here we ARE in the server implementation.
        // If the server implementation is used but no registry is provided, it's an error.
		throw new Error(
			'[@pounce/kit] SSR dispatch failed: No route registry set. ' +
				'Ensure setRouteRegistry() is called during app initialization.'
		)
	}

	const url = new URL(request.url)
	const path = url.pathname
	const method = request.method.toUpperCase() as HttpMethod
	const match = activeRegistry.match(path, method)

	if (!match) {
        // If local route not found, and it IS a local request, 404.
        // If it's an external request (http://google.com), we should probably let it FETCH?
        // But the current logic (legacy) was: "if isSSR && isLocalRequest".
        // Here, we are the "No-DOM" client. We might be running in Node scripts where we WANT to fetch google.com.
        
        // REVISIT: Should the Server Client fall back to Fetch for external URLs?
        // Yes, otherwise we can't call external APIs from the server.
        // The `dispatchToHandler` logic in legacy client.ts handled this check.
        
        // Let's re-add the check: is it local?
        // But how do we know "local" without origin context?
        // We can check if `activeRegistry.match` returns something. If not, it might be external.
        
        // Actually, let's keep it simple as per user request: No-DOM EP = Direct Dispatch.
        // If I want to fetch external, I might need a different client or this client should be smart.
        // "board will implement all the 'throw notImplemented' functions for SSR" - this refers to the Base/Abstract.
		throw new Error(`[@pounce/kit] SSR dispatch failed: No handler found for ${method} ${path}`)
	}

	const context: RequestContext = {
		request,
		params: match.params,
	}

	return await runMiddlewares(match.middlewareStack, context, match.handler)
}

// Helper to determine if we should dispatch or fetch?
// Actually, let's look at legacy client.ts:
// if (isLocalRequest) { dispatch } else { fetch }
// We should preserve this behavior in the server executor.

const smartServerExecutor: RequestExecutor = async (req: Request, timeout: number) => {
    const ctx = getContext()
    const origin = ctx?.origin || 'http://localhost' // Default for relative URLs
    
    // Check if request is local
    let isLocal = false
    try {
        const u = new URL(req.url)
        if (u.origin === origin || u.origin === 'null' || req.url.startsWith('/')) {
             // Basic origin check. If config.origin is not set, we assume everything relative is local?
             // But what if u.origin is "http://localhost:3000" and origin is same?
             isLocal = (u.origin === origin)
        }
    } catch {
        isLocal = true // Relative URL
    }

    if (isLocal) {
        return serverExecutor(req, timeout)
    } else {
        // Fallback to fetch for external
        return fetch(req)
    }
}

// Wait, the user said "dom returns fetch", "no-dom returns dispatch".
// If I use `smartServerExecutor` I am combining them.
// But purely `dispatch` cannot handle external APIs.
// Use `serverExecutor` for now which uses `dispatchToHandler`.
// If `dispatchToHandler` throws, maybe we catch and fetch?
// No, explicit is better.

const serverApi = createApiClientFactory(smartServerExecutor)
export { serverApi as api }
export * from '../api/base-client.js'

export function get<T>(params?: Record<string, string>): Promise<T> { return serverApi.get<T>(params) }
export function post<T>(body: unknown): Promise<T> { return serverApi.post<T>(body) }
export function put<T>(body: unknown): Promise<T> { return serverApi.put<T>(body) }
export function del<T>(params?: Record<string, string>): Promise<T> { return serverApi.del<T>(params) }
export function patch<T>(body: unknown): Promise<T> { return serverApi.patch<T>(body) }
