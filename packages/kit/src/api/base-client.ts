import { ApiError, type HttpMethod } from './core.js'
import type { ExtractPathParams } from './inference.js'
import { PounceResponse } from './response.js'

export type InterceptorMiddleware = (
	request: Request,
	next: (req: Request) => Promise<PounceResponse>
) => Promise<PounceResponse>

import type { AssertSchema, RouteDefinition } from '../router/defs.js'
import {
	addContextInterceptor,
	callPromiseHook,
	callRequestHook,
	callResponseHook,
	callStreamGuardHook,
	getContext,
} from './context.js'

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

const CONFIG_SYMBOL = Symbol.for('__POUNCE_CONFIG__')

type ApiGlobals = {
	[CONFIG_SYMBOL]?: typeof DEFAULT_CONFIG
}

const globals = globalThis as unknown as ApiGlobals

const DEFAULT_PREFETCH_TTL = 5000

type PrefetchEntry = {
	value: unknown
	expiresAt: number
}

const DEFAULT_CONFIG = {
	timeout: 10000,
	retries: 0,
	retryDelay: 100,
}

function getGlobalConfig() {
	if (!globals[CONFIG_SYMBOL]) globals[CONFIG_SYMBOL] = { ...DEFAULT_CONFIG }
	return globals[CONFIG_SYMBOL]
}

export const config = getGlobalConfig()

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
	return PounceResponse.from(await dispatch(initialRequest))
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
	const prefetchedGets = new Map<string, PrefetchEntry>()
	const pendingPrefetches = new Map<string, Promise<unknown>>()

	function getPrefetchedValue<T>(currentUrl: URL): { hit: boolean; value?: T } {
		const key = currentUrl.toString()
		const entry = prefetchedGets.get(key)
		if (!entry) return { hit: false }
		if (entry.expiresAt <= Date.now()) {
			prefetchedGets.delete(key)
			return { hit: false }
		}
		return { hit: true, value: entry.value as T }
	}

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

		function resolveCurrentUrl(params?: Record<string, string | number>): URL {
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
				const currentUrl = buildUrlObj(builtPath)
				for (const [key, value] of Object.entries(params)) {
					if (!usedKeys.has(key)) {
						currentUrl.searchParams.set(key, String(value))
					}
				}
				return currentUrl
			}

			const currentUrl = new URL(url)
			if (params) {
				for (const [key, value] of Object.entries(params)) {
					currentUrl.searchParams.set(key, String(value))
				}
			}
			return currentUrl
		}

		function prefetchGet<T>(
			currentUrl: URL,
			options?: { signal?: AbortSignal; ttl?: number }
		): Promise<T> {
			const hooked = callRequestHook('GET', currentUrl)
			if (hooked !== undefined) return Promise.resolve(hooked as T)

			const prefetched = getPrefetchedValue<T>(currentUrl)
			if (prefetched.hit) return Promise.resolve(prefetched.value as T)

			const key = currentUrl.toString()
			const pending = pendingPrefetches.get(key)
			if (pending) return pending as Promise<T>

			const ttl = options?.ttl ?? DEFAULT_PREFETCH_TTL
			const started = requestWithRetry<T>('GET', currentUrl, undefined, options?.signal)
				.then((value) => {
					prefetchedGets.set(key, { expiresAt: Date.now() + ttl, value })
					return value
				})
				.finally(() => {
					pendingPrefetches.delete(key)
				})

			pendingPrefetches.set(key, started)
			return started
		}

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
				// Hook: check for cached/short-circuit data (e.g. SSR hydration)
				if (method === 'GET') {
					const cached = callRequestHook(method, currentUrl)
					if (cached !== undefined) return cached as T
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

						// Hook: notify of successful response (e.g. SSR data collection)
						callResponseHook(method, currentUrl, data)

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
			// Hook: track promise (e.g. for SSR flushing)
			callPromiseHook(promise)
			return promise
		}

		return {
			get<T>(
				params?: Record<string, string | number>,
				options?: { signal?: AbortSignal }
			): Promise<T> {
				const currentUrl = resolveCurrentUrl(params)

				// Hook: check for cached data before fetching
				const cached = callRequestHook('GET', currentUrl)
				if (cached !== undefined) return Promise.resolve(cached as T)

				const prefetched = getPrefetchedValue<T>(currentUrl)
				if (prefetched.hit) return Promise.resolve(prefetched.value as T)

				const pending = pendingPrefetches.get(currentUrl.toString())
				if (pending) return pending as Promise<T>

				return requestWithRetry<T>('GET', currentUrl, undefined, options?.signal)
			},
			prefetch<T>(
				params?: Record<string, string | number>,
				options?: { signal?: AbortSignal; ttl?: number }
			): Promise<T> {
				return prefetchGet<T>(resolveCurrentUrl(params), options)
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
				const currentUrl = resolveCurrentUrl(params)
				return requestWithRetry<T>('DELETE', currentUrl, undefined, options?.signal)
			},
			async patch<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T> {
				return requestWithRetry<T>('PATCH', url, body, options?.signal)
			},
			stream<T>(onMessage: (data: T) => void, onError?: (error: Error) => void): () => void {
				// Hook: streaming disabled (e.g. during SSR)
				if (callStreamGuardHook()) {
					return () => {}
				}

				const currentUrl = resolveCurrentUrl(paramsOrOptions)

				const controller = new AbortController()

				const doStream = async () => {
					try {
						const request = new Request(currentUrl.toString(), {
							method: 'GET',
							headers: { Accept: 'text/event-stream' },
							signal: controller.signal,
						})

						const finalHandler = async (req: Request): Promise<PounceResponse> => {
							const res = await fetch(req)
							return PounceResponse.from(res)
						}

						const response = await runInterceptors(request, finalHandler)

						if (!response.ok) {
							throw new Error(`HTTP ${response.status}: ${response.statusText}`)
						}

						if (!response.body) {
							throw new Error('Response body is null')
						}

						const reader = response.body.getReader()
						const decoder = new TextDecoder()
						let buffer = ''

						while (true) {
							const { done, value } = await reader.read()
							if (done) break

							buffer += decoder.decode(value, { stream: true })
							const lines = buffer.split('\n')
							buffer = lines.pop() || ''

							for (const line of lines) {
								if (line.startsWith('data: ')) {
									const dataStr = line.slice(6).trim()
									if (dataStr) {
										try {
											const data = JSON.parse(dataStr) as T
											onMessage(data)
										} catch (err) {
											console.error('Failed to parse SSE data:', dataStr, err)
										}
									}
								}
							}
						}
					} catch (error: any) {
						if (error.name !== 'AbortError' && onError) {
							onError(error)
						}
					}
				}

				doStream()

				return () => {
					controller.abort()
				}
			},
		}
	}

	// Proxy creation
	const api = new Proxy(apiClient, {
		get(target, prop, receiver) {
			if (prop in target) return Reflect.get(target, prop, receiver)
			const methods = ['get', 'prefetch', 'post', 'put', 'del', 'patch']
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
	): Promise<T>
	prefetch<T>(
		params?: ExtractPathParams<P> | Record<string, string | number>,
		options?: { signal?: AbortSignal; ttl?: number }
	): Promise<T>
	post<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T>
	put<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T>
	del<T>(
		params?: ExtractPathParams<P> | Record<string, string | number>,
		options?: { signal?: AbortSignal }
	): Promise<T>
	patch<T>(body: unknown, options?: { signal?: AbortSignal }): Promise<T>
	stream<T>(onMessage: (data: T) => void, onError?: (error: Error) => void): () => void
}
