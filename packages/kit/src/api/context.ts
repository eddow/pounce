/**
 * Request Context for @pounce/kit
 * Shared types and context management with pluggable hooks.
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
	retries: number
	retryDelay: number
}

/**
 * Request-scoped state — generic, no SSR awareness.
 * Server frameworks extend via the `data` bag.
 */
export interface RequestScope {
	config: Partial<ClientConfig>
	interceptors: InterceptorEntry[]
	origin?: string
	/** Open bag for framework extensions (SSR state, route registry, etc.) */
	data: Record<symbol, unknown>
}

/**
 * Get the current request scope.
 * In browser: always returns null (no ALS).
 * In Node: overridden by node/context.ts via setGetContext hook.
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
		config,
		interceptors: [],
		data: {},
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

// ── Extension hooks ──────────────────────────────────────────────────

/**
 * Hook called before a request is executed. Return a value to short-circuit
 * the actual fetch (e.g. return cached SSR data). Return undefined to proceed.
 */
export type RequestHook = (method: string, url: URL) => unknown | undefined

/**
 * Hook called after a successful response with the parsed data.
 * Used by server frameworks to collect responses (e.g. for SSR injection).
 */
export type ResponseHook = (method: string, url: URL, data: unknown) => void

/**
 * Hook called when a request promise is created.
 * Used by server frameworks to track pending promises for SSR flushing.
 */
export type PromiseHook = (promise: Promise<unknown>) => void

/**
 * Hook called to check if streaming should be disabled (e.g. during SSR).
 */
export type StreamGuardHook = () => boolean

let requestHook: RequestHook | null = null
let responseHook: ResponseHook | null = null
let promiseHook: PromiseHook | null = null
let streamGuardHook: StreamGuardHook | null = null

export function setRequestHook(hook: RequestHook | null) {
	requestHook = hook
}
export function setResponseHook(hook: ResponseHook | null) {
	responseHook = hook
}
export function setPromiseHook(hook: PromiseHook | null) {
	promiseHook = hook
}
export function setStreamGuardHook(hook: StreamGuardHook | null) {
	streamGuardHook = hook
}

/** @internal */
export function callRequestHook(method: string, url: URL): unknown | undefined {
	return requestHook?.(method, url)
}
/** @internal */
export function callResponseHook(method: string, url: URL, data: unknown) {
	responseHook?.(method, url, data)
}
/** @internal */
export function callPromiseHook(promise: Promise<unknown>) {
	promiseHook?.(promise)
}
/** @internal */
export function callStreamGuardHook(): boolean {
	return streamGuardHook?.() ?? false
}
