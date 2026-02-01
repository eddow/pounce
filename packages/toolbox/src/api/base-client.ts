import { clearSSRData as clearSSRState, getSSRData, getSSRId, injectSSRData } from '../ssr/utils.js'
import {
	ApiError,
	type HttpMethod,
	type Middleware,
	type RouteHandler,
} from './core.js'
import type { ExtractPathParams } from './inference.js'

import { PounceResponse } from './response.js'

export type InterceptorMiddleware = (
	request: Request,
	next: (req: Request) => Promise<PounceResponse>
) => Promise<PounceResponse>

import { addContextInterceptor, getContext, trackSSRPromise } from './context.js'
import type { AssertSchema, RouteDefinition } from '../router/defs.js'

interface InterceptorEntry {
	pattern: string | RegExp
	handler: InterceptorMiddleware
}

const interceptorRegistry: InterceptorEntry[] = []

/**
 * Register a global interceptor
 */
export function intercept(pattern: string | RegExp, handler: InterceptorMiddleware): () => void {
	const ctx = getContext()
	if (ctx) {
		return addContextInterceptor(pattern, handler)
	}
	const entry = { pattern, handler }
	interceptorRegistry.push(entry)
	return () => {
		const index = interceptorRegistry.indexOf(entry)
		if (index !== -1) interceptorRegistry.splice(index, 1)
	}
}

export function clearInterceptors(): void {
	interceptorRegistry.length = 0
}

function matchPattern(urlString: string, pattern: string | RegExp): boolean {
	if (pattern instanceof RegExp) return pattern.test(urlString)
	if (pattern === '**') return true
	
	let pathname = urlString
	try {
		if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
			const u = new URL(urlString)
			pathname = u.pathname
		}
	} catch { }
	
	if (pattern === '*') return !pathname.slice(1).includes('/')
	if (typeof pattern === 'string' && pattern.endsWith('/**')) {
		const base = pattern.slice(0, -3)
		if (base.startsWith('http')) return urlString.startsWith(base)
		return pathname.startsWith(base)
	}
	if (typeof pattern === 'string' && pattern.startsWith('http')) return urlString === pattern
	return pathname === pattern
}

export interface ApiClientInstance<P extends string = string> {
	get: <T>(
		...params: keyof ExtractPathParams<P> extends never
			? [params?: Record<string, string>]
			: [params: ExtractPathParams<P>]
	) => HydratedPromise<T>
	post: <T>(body: unknown) => Promise<T>
	put: <T>(body: unknown) => Promise<T>
	del: <T>(
		...params: keyof ExtractPathParams<P> extends never
			? [params?: Record<string, string>]
			: [params: ExtractPathParams<P>]
	) => Promise<T>
	patch: <T>(body: unknown) => Promise<T>
}

export interface HydratedPromise<T> extends Promise<T> {
	hydrated: T | undefined
}

function withHydration<T>(promise: Promise<T>, value: T | undefined): HydratedPromise<T> {
	const p = promise as HydratedPromise<T>
	p.hydrated = value
	return p
}

export interface RouteRegistry {
	match(
		path: string,
		method: HttpMethod
	): {
		handler: RouteHandler
		middlewareStack: Middleware[]
		params: Record<string, string>
	} | null
}

const REGISTRY_SYMBOL = Symbol.for('__POUNCE_ROUTE_REGISTRY__')

export function setRouteRegistry(registry: RouteRegistry): void {
	const ctx = getContext()
	if (ctx) ctx.routeRegistry = registry
	;(globalThis as any)[REGISTRY_SYMBOL] = registry
}

export function getRouteRegistry(): RouteRegistry | null {
	return (globalThis as any)[REGISTRY_SYMBOL] || null
}

export function clearRouteRegistry(): void {
	;(globalThis as any)[REGISTRY_SYMBOL] = null
}

const CONFIG_SYMBOL = Symbol.for('__POUNCE_CONFIG__')
const DEFAULT_CONFIG = {
	timeout: 10000,
	ssr: false,
	retries: 0,
	retryDelay: 100,
}

function getGlobalConfig() {
	const g = globalThis as any
	if (!g[CONFIG_SYMBOL]) g[CONFIG_SYMBOL] = { ...DEFAULT_CONFIG }
	return g[CONFIG_SYMBOL]
}

export const config = getGlobalConfig()

export function enableSSR(): void {
	const ctx = getContext()
	if (ctx) ctx.config.ssr = true
	else config.ssr = true
}

export function disableSSR(): void {
	const ctx = getContext()
	if (ctx) {
		ctx.config.ssr = false
		clearSSRState()
	} else {
		config.ssr = false
		clearSSRState()
	}
}

export { getSSRId, getSSRData, injectSSRData, clearSSRState as clearSSRData }

async function runInterceptors(
	initialRequest: Request,
	finalHandler: (req: Request) => Promise<PounceResponse>
): Promise<PounceResponse> {
	const url = initialRequest.url
	const ctx = getContext()
	const contextInterceptors = ctx ? ctx.interceptors : []
	const allInterceptors = [...interceptorRegistry, ...contextInterceptors]
	const chain = allInterceptors
		.filter((entry) => matchPattern(url, entry.pattern))
		.map((entry) => entry.handler)

	let index = 0
	const dispatch = async (req: Request): Promise<PounceResponse> => {
		if (index < chain.length) {
			const handler = chain[index++]
			return handler(req, dispatch)
		}
		return finalHandler(req)
	}
	return dispatch(initialRequest)
}

/**
 * Abstract executor interface.
 * Implementations (fetch vs server-dispatch) passed to createApiClient.
 */
export type RequestExecutor = (req: Request, timeout: number) => Promise<Response>;

/**
 * Creates a configured API Client factory.
 */
export function createApiClientFactory(executor: RequestExecutor) {
    function apiClient(
        input: any,
        paramsOrOptions: any = {},
        maybeOptions: any = {}
    ): ApiClientInstance<any> {
        let url: URL
        let options = paramsOrOptions

        if (typeof input === 'object' && input !== null && 'buildUrl' in input) {
            const routeDef = input as RouteDefinition
            const params = paramsOrOptions
            options = maybeOptions
            const builtUrl = routeDef.buildUrl(params)
            
            const ctx = getContext()
            const origin = (typeof window !== 'undefined' && window.location) 
                ? window.location.origin 
                : (ctx?.origin || 'http://localhost')
            
            if (builtUrl.startsWith('http')) {
                url = new URL(builtUrl)
            } else {
                url = new URL(builtUrl, origin)
            }
        } else {
            if (typeof input === 'object' && input !== null && !(input instanceof URL)) {
                return input as ApiClientInstance
            }
            options = paramsOrOptions
        }

        const ctx = getContext()
        const currentConfig = ctx ? { ...config, ...ctx.config } : config
        
        const timeout = options.timeout ?? currentConfig.timeout
        const maxRetries = options.retries ?? currentConfig.retries
        const retryDelay = options.retryDelay ?? currentConfig.retryDelay

        if (!url!) {
            if (typeof input === 'string') {
                if (input.startsWith('http://') || input.startsWith('https://')) {
                    url = new URL(input)
                } else if (input.startsWith('/')) {
                    const ctx = getContext()
                    const origin = (typeof window !== 'undefined' && window.location) 
                        ? window.location.origin 
                        : (ctx?.origin || 'http://localhost')
                    url = new URL(input, origin)
                } else if (input.startsWith('.')) {
                    const ctx = getContext()
                    const base = (typeof window !== 'undefined' && window.location) 
                        ? window.location.href 
                        : (ctx?.origin || 'http://localhost')
                    url = new URL(input, base)
                } else {
                    const ctx = getContext()
                    const origin = (typeof window !== 'undefined' && window.location) 
                        ? window.location.origin 
                        : (ctx?.origin || 'http://localhost')
                    url = new URL(`/${input}`, origin)
                }
            } else {
                url = input
            }
        }


        async function requestWithRetry<T>(
            method: HttpMethod,
            currentUrl: URL,
            body?: unknown
        ): Promise<T> {
            const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
            const requestHeaders: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }
            const requestBody = isFormData ? (body as any) : body !== undefined ? JSON.stringify(body) : undefined

            const doRequest = async (): Promise<T> => {
                const activeCtx = getContext()
                const isSSR = activeCtx ? activeCtx.config.ssr ?? config.ssr : config.ssr
                
                // SSR Hydration Check (Same for both envs effectively, but mostly useful for Client reading SSR data)
                // Note: On Server, we might want to skip this if we are initiating the fetch?
                // Actually, if we are on server (isSSR=true), we don't read "getSSRData" usually, we WRITE it.
                // UNLESS we are rendering a component that calls an API that was ALREADY fetched higher up?
                // But generally: Client READS, Server WRITES.
                
                if (!isSSR && method === 'GET') {
                     // Client side looking for data injected by server
                    const currentSsrId = getSSRId(currentUrl)
                    const existingData = getSSRData(currentSsrId)
                    if (existingData !== undefined) {
                        return existingData as T
                    }
                }

                let lastError: any = null

                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    try {
                        const request = new Request(currentUrl.toString(), {
                            method,
                            headers: requestHeaders,
                            body: requestBody,
                        })

                        const finalHandler = async (req: Request): Promise<PounceResponse> => {
                             // Use injected executor
                             const response = await executor(req, timeout);
                             return PounceResponse.from(response)
                        }

                        const response = await runInterceptors(request, finalHandler)

                        if (!response.ok) {
                            let errorData = null
                            try {
                                if (response.headers.get('Content-Type')?.includes('application/json')) {
                                    errorData = await response.json()
                                }
                            } catch { }
                            throw new ApiError(response.status, response.statusText, errorData, request.url)
                        }

                        const data = (await response.json()) as T
                        const activeCtx = getContext()
                        const isSSR = activeCtx ? activeCtx.config.ssr ?? config.ssr : config.ssr

                        if (isSSR) {
                            const currentSsrId = getSSRId(currentUrl)
                            injectSSRData(currentSsrId, data)
                        }
                        return data
                    } catch (error: any) {
                        lastError = error
                        const shouldRetry =
                            attempt < maxRetries &&
                            (error instanceof ApiError ? error.status >= 500 || error.status === 408 : true)

                        if (shouldRetry) {
                            if (retryDelay > 0) await new Promise((resolve) => setTimeout(resolve, retryDelay))
                            continue
                        }
                        throw error
                    }
                }
                throw lastError
            }

            const promise = doRequest()
            const activeCtx = getContext()
            if (activeCtx && (activeCtx.config.ssr ?? config.ssr)) {
                trackSSRPromise(promise)
            }
            return promise
        }

        return {
            get<T>(...args: [params?: any]): HydratedPromise<T> {
                const params = args[0] as Record<string, string> | undefined
                const currentUrl = new URL(url)
                if (params) {
                    for (const [key, value] of Object.entries(params)) {
                        currentUrl.searchParams.set(key, value)
                    }
                }
                const currentSsrId = getSSRId(currentUrl)
                const activeCtx = getContext()
                const isSSR = activeCtx ? activeCtx.config.ssr ?? config.ssr : config.ssr
                let cachedData: T | undefined

                if (!isSSR) {
                    cachedData = getSSRData<T>(currentSsrId)
                }
                
                const promise = (async () => {
                    if (cachedData !== undefined) return cachedData
                    return requestWithRetry<T>('GET', currentUrl)
                })()

                return withHydration(promise, cachedData)
            },
            async post<T>(body: unknown): Promise<T> {
                return requestWithRetry<T>('POST', url, body)
            },
            async put<T>(body: unknown): Promise<T> {
                return requestWithRetry<T>('PUT', url, body)
            },
            async del<T>(...args: [params?: any]): Promise<T> {
                const params = args[0] as Record<string, string> | undefined
                const currentUrl = new URL(url)
                if (params) {
                    for (const [key, value] of Object.entries(params)) {
                        currentUrl.searchParams.set(key, value)
                    }
                }
                return requestWithRetry<T>('DELETE', currentUrl)
            },
            async patch<T>(body: unknown): Promise<T> {
                return requestWithRetry<T>('PATCH', url, body)
            },
        }
    }
    
    // Proxy creation
    const api = new Proxy(apiClient, {
        get(target, prop: string) {
            if (prop in target) return (target as any)[prop]
            const methods = ['get', 'post', 'put', 'del', 'patch']
            if (methods.includes(prop)) {
                const currentPath = typeof window !== 'undefined' ? window.location.href : '.'
                return (target(currentPath) as any)[prop]
            }
            return (target as any)[prop]
        },
    }) as unknown as ApiClient & ApiClientInstance
    
    return api;
}

export interface ApiClient {
	<P extends string>(
		input: P | URL | object,
		options?: { timeout?: number; retries?: number; retryDelay?: number }
	): ApiClientInstance<P>

	<P extends string, Q extends AssertSchema>(
		routeDef: RouteDefinition<P, Q>,
		params: any,
		options?: { timeout?: number; retries?: number; retryDelay?: number }
	): ApiClientInstance<string>
}
