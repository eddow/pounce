/**
 * Request Context for @pounce/kit
 * Shared types and fallback (non-ALS) context management.
 * ALS-backed implementation lives in node/context.ts (Node EP only).
 */
import type { InterceptorMiddleware } from './base-client.js'

const CONTEXT_KEY = Symbol.for('__POUNCE_CONTEXT__')

type PounceGlobals = {
	[CONTEXT_KEY]?: RequestScope | null
}

const globals = globalThis as unknown as PounceGlobals

export interface InterceptorEntry {
	pattern: string | RegExp
	handler: InterceptorMiddleware
}

export interface ClientConfig {
	timeout: number
	ssr: boolean
	retries: number
	retryDelay: number
}

/**
 * Request-scoped state
 */
export interface RequestScope {
	ssr: {
		id: symbol
		responses: Map<string, unknown>
		counter: number
		promises: Promise<unknown>[]
	}
	config: Partial<ClientConfig>
	interceptors: InterceptorEntry[]
	origin?: string
	routeRegistry?: any
}

/**
 * Get the current request scope.
 * In browser: always returns null (no ALS).
 * In Node: overridden by node/context.ts via getContextImpl hook.
 */
export let getContext: () => RequestScope | null = () => globals[CONTEXT_KEY] || null

/** @internal — set by node/context.ts to inject ALS-aware implementation */
export function setGetContext(impl: () => RequestScope | null) {
	getContext = impl
}

export function setGlobalCtx(ctx: RequestScope | null) {
	globals[CONTEXT_KEY] = ctx
}

/**
 * Initialize a new empty scope
 */
export function createScope(config: Partial<ClientConfig> = {}): RequestScope {
	return {
		ssr: {
			id: Symbol('ssr-context'),
			responses: new Map(),
			counter: 0,
			promises: [],
		},
		config,
		interceptors: [],
	}
}

/**
 * Helper to add an interceptor to the current scope
 */
export function addContextInterceptor(pattern: string | RegExp, handler: InterceptorMiddleware) {
	const ctx = getContext()
	if (ctx) {
		ctx.interceptors.push({ pattern, handler })
		return () => {
			const index = ctx.interceptors.findIndex((i) => i.handler === handler)
			if (index !== -1) ctx.interceptors.splice(index, 1)
		}
	} else {
		console.warn('[@pounce/kit] Attempted to add context interceptor outside of a context')
		return () => {}
	}
}

/**
 * Track a promise in the current SSR context
 */
export function trackSSRPromise(promise: Promise<unknown>) {
	const ctx = getContext()
	if (ctx) {
		ctx.ssr.promises.push(promise)
	}
}

/**
 * Get and clear all pending SSR promises
 */
export function flushSSRPromises(): Promise<unknown>[] {
	const ctx = getContext()
	if (ctx) {
		const promises = ctx.ssr.promises
		ctx.ssr.promises = []
		return promises
	}
	return []
}
