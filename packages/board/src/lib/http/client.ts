/**
 * Universal API client for sursaut-board
 * Supports absolute, site-absolute, and site-relative URLs
 * Handles SSR data injection and hydration
 */

import {
	clearInterceptors as clearKitInterceptors,
	createApiClientFactory,
	type InterceptorMiddleware,
	type ApiClientInstance as KitApiClientInstance,
	config as kitConfig,
	intercept as kitIntercept,
	setPromiseHook,
	setRequestHook,
	setResponseHook,
	setStreamGuardHook,
} from '@sursaut/kit'
import { clearSSRData as clearSSRState, getSSRData, getSSRId, injectSSRData } from '../ssr/utils.js'
import type { ExtractPathParams } from '../types/inference.js'
import {
	ApiError,
	type HttpMethod,
	type Middleware,
	type RequestContext,
	type RouteHandler,
	runMiddlewares,
} from './core.js'

declare global {
	var __SURSAUT_ROUTE_REGISTRY__: RouteRegistry | null | undefined
}

import { addContextInterceptor, getContext } from '../http/context.js'

export interface ApiClientInstance<P extends string = string> {
	get: <T>(
		...params: keyof ExtractPathParams<P> extends never
			? [params?: Record<string, string>]
			: [params: ExtractPathParams<P>]
	) => HydratedPromise<T>
	post: <T>(body: unknown) => Promise<T>
	put: <T>(body: unknown) => Promise<T>
	delete: <T>(
		...params: keyof ExtractPathParams<P> extends never
			? [params?: Record<string, string>]
			: [params: ExtractPathParams<P>]
	) => Promise<T>
	patch: <T>(body: unknown) => Promise<T>
}

export interface HydratedPromise<T> extends Promise<T> {
	/**
	 * Synchronous access to the hydrated value if available.
	 * undefined if no SSR data was found or if pending.
	 */
	hydrated: T | undefined
}

// Helper to attach value to promise
function withHydration<T>(promise: Promise<T>, value: T | undefined): HydratedPromise<T> {
	const p = promise as HydratedPromise<T>
	p.hydrated = value
	return p
}

/**
 * Route registry for server-side dispatch
 * Populated by adapters (Hono, Vercel, etc.) during initialization
 */
export interface RouteRegistry {
	/**
	 * Match a path and method to a handler
	 * Returns null if no match found
	 */
	match(
		path: string,
		method: HttpMethod
	): {
		handler: RouteHandler
		middlewareStack: Middleware[]
		params: Record<string, string>
	} | null
}

/**
 * Set the route registry for server-side dispatch
 * Called by adapters during app initialization
 */
export function setRouteRegistry(registry: RouteRegistry): void {
	const ctx = getContext()
	if (ctx) {
		ctx.routeRegistry = registry
	}
	globalThis.__SURSAUT_ROUTE_REGISTRY__ = registry
}

export function getRouteRegistry(): RouteRegistry | null {
	return globalThis.__SURSAUT_ROUTE_REGISTRY__ || null
}

/**
 * Clear the route registry (for testing)
 */
export function clearRouteRegistry(): void {
	globalThis.__SURSAUT_ROUTE_REGISTRY__ = null
}

/**
 * Dispatch directly to a route handler (server-side, no network)
 * @internal
 */
async function dispatchToHandler(request: Request): Promise<Response> {
	const ctx = getContext()
	const activeRegistry = ctx?.routeRegistry || globalThis.__SURSAUT_ROUTE_REGISTRY__

	if (!activeRegistry) {
		throw new Error(
			'[sursaut-board] SSR dispatch failed: No route registry set. ' +
				'Ensure setRouteRegistry() is called during app initialization.'
		)
	}

	const url = new URL(request.url)
	const path = url.pathname
	const method = request.method.toUpperCase() as HttpMethod
	const match = activeRegistry.match(path, method)

	if (!match) {
		throw new Error(`[sursaut-board] SSR dispatch failed: No handler found for ${method} ${path}`)
	}

	const context: RequestContext = {
		request,
		params: match.params,
	}

	// Run through middleware stack and handler
	const response = await runMiddlewares(match.middlewareStack, context, match.handler)

	return response
}

const configWithSSR = Object.assign(kitConfig, { ssr: false })

/**
 * Global configuration for sursaut-board
 */
export const config: typeof kitConfig & { ssr: boolean } = configWithSSR

/**
 * Enable SSR mode for server-side rendering
 */
export function enableSSR(): void {
	const ctx = getContext()
	if (ctx) {
		ctx.config.ssr = true
	} else {
		config.ssr = true
	}
}

/**
 * Disable SSR mode (for testing or manual control)
 */
export function disableSSR(): void {
	const ctx = getContext()
	if (ctx) {
		ctx.config.ssr = false
		// We can't clearSSRState for just this context easily as it clears everything?
		// actually utils.clearSSRData() now respects context.
		clearSSRState()
	} else {
		config.ssr = false
		clearSSRState()
	}
}

export { getSSRId, getSSRData, injectSSRData }

/**
 * Clear all SSR data
 */
export function clearSSRData(): void {
	clearSSRState()
}

async function materializeRequestBody(request: Request): Promise<BodyInit | undefined> {
	if (request.method === 'GET' || request.method === 'HEAD') {
		return undefined
	}

	const contentType = request.headers.get('Content-Type') ?? ''
	if (contentType.includes('application/json')) {
		return await request.text()
	}
	if (contentType.includes('application/x-www-form-urlencoded')) {
		return await request.text()
	}
	if (contentType.includes('multipart/form-data')) {
		return await request.formData()
	}
	return request.body ?? undefined
}

async function fetchWithTimeout(request: Request, timeout: number): Promise<Response> {
	const controller = new AbortController()
	const id = setTimeout(() => controller.abort(), timeout)
	const method = request.method
	try {
		const body = await materializeRequestBody(request)
		return await fetch(new URL(request.url), {
			method,
			headers: request.headers,
			body,
			signal: controller.signal as RequestInit['signal'],
		})
	} catch (error: unknown) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new ApiError(408, 'Request Timeout', null, request.url)
		}
		throw error
	} finally {
		clearTimeout(id)
	}
}

async function dispatchWithTimeout(request: Request, timeout: number): Promise<Response> {
	const controller = new AbortController()
	const id = setTimeout(() => controller.abort(), timeout)
	try {
		return await Promise.race([
			dispatchToHandler(request),
			new Promise<Response>((_, reject) => {
				controller.signal.addEventListener('abort', () => {
					reject(new ApiError(408, 'Request Timeout', null, request.url))
				})
			}),
		])
	} finally {
		clearTimeout(id)
	}
}

function resolveInputUrl<P extends string>(
	input: P | URL | ApiClientInstance<P> | object
): URL | null {
	const ctx = getContext()
	const origin =
		typeof window !== 'undefined' && window.location
			? window.location.origin
			: ctx?.origin || 'http://localhost'
	const base =
		typeof window !== 'undefined' && window.location
			? window.location.href
			: ctx?.origin || 'http://localhost'

	const buildUrlObj = (inputStr: string): URL => {
		if (inputStr.startsWith('http://') || inputStr.startsWith('https://')) {
			return new URL(inputStr)
		}
		if (inputStr.startsWith('/')) {
			return new URL(inputStr, origin)
		}
		if (inputStr.startsWith('.')) {
			return new URL(inputStr, base)
		}
		return new URL(`/${inputStr}`, origin)
	}

	if (typeof input === 'object' && input !== null && !(input instanceof URL)) {
		return null
	}

	if (typeof input === 'string') {
		return buildUrlObj(input)
	}

	if (input instanceof URL) {
		return new URL(input)
	}

	return null
}

function withQuery<P extends string>(
	baseUrl: URL,
	template: P | URL | ApiClientInstance<P> | object,
	params?: Record<string, string>
): URL {
	const currentUrl = new URL(baseUrl)
	if (typeof template === 'string' && template.includes('[') && template.includes(']') && params) {
		let builtPath: string = template
		const usedKeys = new Set<string>()
		for (const [key, value] of Object.entries(params)) {
			const placeholder = `[${key}]`
			if (builtPath.includes(placeholder)) {
				builtPath = builtPath.replace(placeholder, value)
				usedKeys.add(key)
			}
		}
		const builtUrl = resolveInputUrl(builtPath)
		if (builtUrl) {
			for (const [key, value] of Object.entries(params)) {
				if (!usedKeys.has(key)) {
					builtUrl.searchParams.set(key, value)
				}
			}
			return builtUrl
		}
	}
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			currentUrl.searchParams.set(key, value)
		}
	}
	return currentUrl
}

const boardExecutor = async (request: Request, timeout: number): Promise<Response> => {
	const ctx = getContext()
	const isSSR = ctx ? (ctx.config.ssr ?? config.ssr) : config.ssr
	const origin =
		ctx?.origin ||
		(typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost')
	const isLocalRequest = isSSR && new URL(request.url).origin === origin

	if (isLocalRequest) {
		return dispatchWithTimeout(request, timeout)
	}
	return fetchWithTimeout(request, timeout)
}

setRequestHook((method, url) => {
	if (method !== 'GET') return undefined
	return getSSRData(getSSRId(url))
})

setResponseHook((_method, url, data) => {
	const ctx = getContext()
	const isSSR = ctx ? (ctx.config.ssr ?? config.ssr) : config.ssr
	if (isSSR) {
		injectSSRData(getSSRId(url), data)
	}
})

setPromiseHook((promise) => {
	const ctx = getContext()
	const isSSR = ctx ? (ctx.config.ssr ?? config.ssr) : config.ssr
	if (ctx && isSSR) {
		ctx.ssr.promises.push(promise)
	}
})

setStreamGuardHook(() => {
	const ctx = getContext()
	return ctx ? (ctx.config.ssr ?? config.ssr) : config.ssr
})

const boardKitApi = createApiClientFactory(boardExecutor)

type ClientOptions = {
	timeout?: number
	retries?: number
	retryDelay?: number
	signal?: AbortSignal
}

function createWrappedInstance<P extends string>(
	input: P | URL | ApiClientInstance<P>,
	paramsOrOptions: unknown
): ApiClientInstance<P> {
	// Plain objects that are neither URL are passed through as-is (e.g. proxy objects)
	if (typeof input === 'object' && input !== null && !(input instanceof URL)) {
		return input as unknown as ApiClientInstance<P>
	}
	const baseUrl = resolveInputUrl(input)
	const instance: KitApiClientInstance<P> = boardKitApi(
		input as P | URL | object,
		paramsOrOptions as ClientOptions | undefined
	) as KitApiClientInstance<P>
	return wrapInstance(input, instance as KitApiClientInstance<P>, baseUrl)
}

function wrapInstance<P extends string>(
	input: P | URL | ApiClientInstance<P> | object,
	instance: KitApiClientInstance<P>,
	baseUrl: URL | null
): ApiClientInstance<P> {
	return {
		get<T>(
			...args: keyof ExtractPathParams<P> extends never
				? [params?: Record<string, string>]
				: [params: ExtractPathParams<P>]
		): HydratedPromise<T> {
			const params = args[0] as Record<string, string> | undefined
			const currentUrl = baseUrl ? withQuery(baseUrl, input, params) : null
			const ssrId = currentUrl ? getSSRId(currentUrl) : null
			const cachedData = ssrId ? getSSRData<T>(ssrId) : undefined
			const promise =
				cachedData !== undefined ? Promise.resolve(cachedData) : instance.get<T>(params)
			return withHydration(promise, cachedData)
		},
		post<T>(body: unknown): Promise<T> {
			return instance.post<T>(body)
		},
		put<T>(body: unknown): Promise<T> {
			return instance.put<T>(body)
		},
		delete<T>(
			...args: keyof ExtractPathParams<P> extends never
				? [params?: Record<string, string>]
				: [params: ExtractPathParams<P>]
		): Promise<T> {
			const params = args[0] as Record<string, string> | undefined
			return instance.delete<T>(params)
		},
		patch<T>(body: unknown): Promise<T> {
			return instance.patch<T>(body)
		},
	}
}

function apiClient<P extends string>(
	input: P | URL | ApiClientInstance<P>,
	paramsOrOptions: any = {}
): ApiClientInstance<P> {
	return createWrappedInstance(input, paramsOrOptions)
}

/**
 * Universal API client as a functional proxy
 *
 * api.get() -> api(window.location.href).get() [Client] targeting current resource ("pendant")
 * api.post(body) -> api(window.location.href).post(body)
 */
export const api = new Proxy(apiClient, {
	get(target, prop, receiver) {
		if (prop in target) return Reflect.get(target, prop, receiver)
		const methods = ['get', 'post', 'put', 'delete', 'patch']
		if (typeof prop === 'string' && methods.includes(prop)) {
			const currentPath = typeof window !== 'undefined' ? window.location.href : '.'
			return Reflect.get(target(currentPath), prop)
		}
		return Reflect.get(target, prop, receiver)
	},
}) as unknown as ApiClient & ApiClientInstance

export function intercept(pattern: string | RegExp, handler: InterceptorMiddleware): () => void {
	if (getContext()) {
		return addContextInterceptor(pattern, handler)
	}
	return kitIntercept(pattern, handler)
}

export function clearInterceptors(): void {
	clearKitInterceptors()
}

export type { InterceptorMiddleware }

export type ApiClient = <P extends string>(
	input: P | URL | object,
	options?: { timeout?: number; retries?: number; retryDelay?: number }
) => ApiClientInstance<P>

/**
 * Direct method exports for current route ("server pendant")
 * We use wrappers to ensure 'api.get' is accessed at call time,
 * capturing the current window.location.
 */
export function get<T>(params?: Record<string, string>): Promise<T> {
	return api.get<T>(params)
}

export function post<T>(body: unknown): Promise<T> {
	return api.post<T>(body)
}

export function put<T>(body: unknown): Promise<T> {
	return api.put<T>(body)
}

function deleteRequest<T>(params?: Record<string, string>): Promise<T> {
	return api.delete<T>(params)
}

export { deleteRequest as delete }

export function patch<T>(body: unknown): Promise<T> {
	return api.patch<T>(body)
}
