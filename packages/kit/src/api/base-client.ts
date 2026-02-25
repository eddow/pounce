import { ApiError, type HttpMethod, type Middleware, type RouteHandler } from './core.js'
import type { ExtractPathParams } from './inference.js'
import { PounceResponse } from './response.js'
import {
	clearSSRData as clearSSRState,
	getSSRData,
	getSSRId,
	injectSSRData,
} from './ssr-hydration.js'

export type InterceptorMiddleware = (
	request: Request,
	next: (req: Request) => Promise<PounceResponse>
) => Promise<PounceResponse>

import type { AssertSchema, RouteDefinition } from '../router/defs.js'
import { addContextInterceptor, getContext, trackSSRPromise } from './context.js'

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
	} catch {}

	if (pattern === '*') return !pathname.slice(1).includes('/')
	if (typeof pattern === 'string' && pattern.endsWith('/**')) {
		const base = pattern.slice(0, -3)
		if (base.startsWith('http')) return urlString.startsWith(base)
		return pathname.startsWith(base)
	}
	if (typeof pattern === 'string' && pattern.startsWith('http')) return urlString === pattern
	return pathname === pattern
}

// ApiClientInstance interface is defined at the end of the file

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
const CONFIG_SYMBOL = Symbol.for('__POUNCE_CONFIG__')

type ApiGlobals = {
	[REGISTRY_SYMBOL]?: RouteRegistry | null
	[CONFIG_SYMBOL]?: typeof DEFAULT_CONFIG
}

const globals = globalThis as unknown as ApiGlobals

const DEFAULT_CONFIG = {
	timeout: 10000,
	ssr: false,
	retries: 0,
	retryDelay: 100,
}

export function setRouteRegistry(registry: RouteRegistry): void {
	const ctx = getContext()
	if (ctx) ctx.routeRegistry = registry
	globals[REGISTRY_SYMBOL] = registry
}

export function getRouteRegistry(): RouteRegistry | null {
	return globals[REGISTRY_SYMBOL] || null
}

export function clearRouteRegistry(): void {
	globals[REGISTRY_SYMBOL] = null
}

function getGlobalConfig() {
	if (!globals[CONFIG_SYMBOL]) globals[CONFIG_SYMBOL] = { ...DEFAULT_CONFIG }
	return globals[CONFIG_SYMBOL]
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
export type RequestExecutor = (req: Request, timeout: number) => Promise<Response>

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
		let template: string | undefined
		let options = paramsOrOptions

		const buildUrlObj = (inputStr: string): URL => {
			if (inputStr.startsWith('http://') || inputStr.startsWith('https://')) {
				return new URL(inputStr)
			}
			const ctx = getContext()
			const origin =
				typeof window !== 'undefined' && window.location
					? window.location.origin
					: ctx?.origin || 'http://localhost'

			if (inputStr.startsWith('/')) {
				return new URL(inputStr, origin)
			}
			if (inputStr.startsWith('.')) {
				const base =
					typeof window !== 'undefined' && window.location
						? window.location.href
						: ctx?.origin || 'http://localhost'
				return new URL(inputStr, base)
			}
			return new URL(`/${inputStr}`, origin)
		}

		if (typeof input === 'object' && input !== null && 'buildUrl' in input) {
			const routeDef = input as RouteDefinition
			const params = paramsOrOptions
			options = maybeOptions
			url = buildUrlObj(routeDef.buildUrl(params))
		} else {
			if (typeof input === 'object' && input !== null && !(input instanceof URL)) {
				return input as ApiClientInstance<any>
			}
			options = paramsOrOptions
			if (typeof input === 'string') {
				if (input.includes('[') && input.includes(']')) {
					template = input
				}
				url = buildUrlObj(input)
			} else {
				url = input
			}
		}

		const ctx = getContext()
		const currentConfig = ctx ? { ...config, ...ctx.config } : config

		const timeout = options.timeout ?? currentConfig.timeout
		const maxRetries = options.retries ?? currentConfig.retries
		const retryDelay = options.retryDelay ?? currentConfig.retryDelay

		async function requestWithRetry<T>(
			method: HttpMethod,
			currentUrl: URL,
			body?: unknown,
			signal?: AbortSignal
		): Promise<T> {
			const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
			const requestHeaders: Record<string, string> = isFormData
				? {}
				: { 'Content-Type': 'application/json' }
			const requestBody = isFormData
				? (body as BodyInit)
				: body !== undefined
					? JSON.stringify(body)
					: undefined

			const doRequest = async (): Promise<T> => {
				const activeCtx = getContext()
				const isSSR = activeCtx ? (activeCtx.config.ssr ?? config.ssr) : config.ssr

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
							signal: signal ?? options.signal,
						})

						const finalHandler = async (req: Request): Promise<PounceResponse> => {
							// Use injected executor
							const response = await executor(req, timeout)
							return PounceResponse.from(response)
						}

						const response = await runInterceptors(request, finalHandler)

						if (!response.ok) {
							let errorData = null
							try {
								if (response.headers.get('Content-Type')?.includes('application/json')) {
									errorData = await response.json()
								}
							} catch {}
							throw new ApiError(response.status, response.statusText, errorData, request.url)
						}

						const data = (await response.json()) as T
						const activeCtx = getContext()
						const isSSR = activeCtx ? (activeCtx.config.ssr ?? config.ssr) : config.ssr

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
			get<T>(
				params?: Record<string, string | number>,
				options?: { signal?: AbortSignal }
			): HydratedPromise<T> {
				let currentUrl: URL

				if (template && params) {
					let builtPath = template
					const usedKeys = new Set<string>()
					for (const [key, value] of Object.entries(params)) {
						const placeholder = `[${key}]`
						if (builtPath.includes(placeholder)) {
							builtPath = builtPath.replace(placeholder, String(value))
							usedKeys.add(key)
						}
					}
					currentUrl = buildUrlObj(builtPath)
					for (const [key, value] of Object.entries(params)) {
						if (!usedKeys.has(key)) {
							currentUrl.searchParams.set(key, String(value))
						}
					}
				} else {
					currentUrl = new URL(url)
					if (params) {
						for (const [key, value] of Object.entries(params)) {
							currentUrl.searchParams.set(key, String(value))
						}
					}
				}

				const currentSsrId = getSSRId(currentUrl)
				const activeCtx = getContext()
				const isSSR = activeCtx ? (activeCtx.config.ssr ?? config.ssr) : config.ssr
				let cachedData: T | undefined

				if (!isSSR) {
					cachedData = getSSRData<T>(currentSsrId)
				}

				const promise = (async () => {
					if (cachedData !== undefined) return cachedData
					return requestWithRetry<T>('GET', currentUrl, undefined, options?.signal)
				})()

				return withHydration(promise, cachedData)
			},
			async post<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T> {
				return requestWithRetry<T>('POST', url, body, options?.signal)
			},
			async put<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T> {
				return requestWithRetry<T>('PUT', url, body, options?.signal)
			},
			async del<T>(
				params?: Record<string, string | number>,
				options?: { signal?: AbortSignal }
			): Promise<T> {
				let currentUrl: URL

				if (template && params) {
					let builtPath = template
					const usedKeys = new Set<string>()
					for (const [key, value] of Object.entries(params)) {
						const placeholder = `[${key}]`
						if (builtPath.includes(placeholder)) {
							builtPath = builtPath.replace(placeholder, String(value))
							usedKeys.add(key)
						}
					}
					currentUrl = buildUrlObj(builtPath)
					for (const [key, value] of Object.entries(params)) {
						if (!usedKeys.has(key)) {
							currentUrl.searchParams.set(key, String(value))
						}
					}
				} else {
					currentUrl = new URL(url)
					if (params) {
						for (const [key, value] of Object.entries(params)) {
							currentUrl.searchParams.set(key, String(value))
						}
					}
				}
				return requestWithRetry<T>('DELETE', currentUrl, undefined, options?.signal)
			},
			async patch<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T> {
				return requestWithRetry<T>('PATCH', url, body, options?.signal)
			},
		}
	}

	// Proxy creation
	const api = new Proxy(apiClient, {
		get(target, prop, receiver) {
			if (prop in target) return Reflect.get(target, prop, receiver)
			const methods = ['get', 'post', 'put', 'del', 'patch']
			if (typeof prop === 'string' && methods.includes(prop)) {
				const currentPath = typeof window !== 'undefined' ? window.location.href : '.'
				const instance = target(currentPath)
				return Reflect.get(instance, prop)
			}
			return Reflect.get(target, prop, receiver)
		},
	}) as unknown as ApiClient & ApiClientInstance<any>

	return api
}

export interface ApiClient {
	<P extends string>(
		input: P | URL | object,
		options?: { timeout?: number; retries?: number; retryDelay?: number; signal?: AbortSignal }
	): ApiClientInstance<P>

	<P extends string, Q extends AssertSchema>(
		routeDef: RouteDefinition<P, Q>,
		params: any,
		options?: { timeout?: number; retries?: number; retryDelay?: number; signal?: AbortSignal }
	): ApiClientInstance<string>
}

export interface ApiClientInstance<P extends string> {
	get<T>(
		params?: ExtractPathParams<P> | Record<string, string | number>,
		options?: { signal?: AbortSignal }
	): HydratedPromise<T>
	post<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T>
	put<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T>
	del<T>(
		params?: ExtractPathParams<P> | Record<string, string | number>,
		options?: { signal?: AbortSignal }
	): Promise<T>
	patch<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T>
}
