/**
 * Request Context for @pounce/board
 * Handles thread-local storage for SSR data, configuration, and interceptors.
 */
import type { AsyncLocalStorage } from 'node:async_hooks'

// Define the Interceptor type here to avoid circular imports if possible,
// or import strictly as type.
// We'll import InterceptorMiddleware from client.ts, but only as type.
import type { InterceptorMiddleware } from './base-client.js'

// Typed global slots — eliminates `as any` on globalThis
const STORAGE_KEY = Symbol.for('__POUNCE_STORAGE__')
const CONTEXT_KEY = Symbol.for('__POUNCE_CONTEXT__')

type PounceGlobals = {
	[STORAGE_KEY]?: AsyncLocalStorage<RequestScope>
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

/** @internal */
export function getStorage(): AsyncLocalStorage<RequestScope> | null {
	return globals[STORAGE_KEY] || null
}

export function setStorage(storage: AsyncLocalStorage<RequestScope>) {
	globals[STORAGE_KEY] = storage
}

async function ensureStorage(): Promise<AsyncLocalStorage<RequestScope>> {
	if (globals[STORAGE_KEY]) return globals[STORAGE_KEY]
	const { AsyncLocalStorage } = await import('node:async_hooks')
	const s = new AsyncLocalStorage<RequestScope>()
	globals[STORAGE_KEY] = s
	return s
}

/**
 * Get the current request scope
 */
export function getContext(): RequestScope | null {
	const storage = getStorage()
	if (storage) {
		const store = storage.getStore()
		if (store) return store
	}
	// Fallback for browser/single-threaded environments or shared SSR state
	return globals[CONTEXT_KEY] || null
}

function setGlobalCtx(ctx: RequestScope | null) {
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
 * Run a function within a request scope
 */
export async function runWithContext<T>(scope: RequestScope, fn: () => Promise<T>): Promise<T> {
	// Initialize storage if needed (Node.js only)
	const storage = await ensureStorage()

	if (storage) {
		return storage.run(scope, fn)
	}

	// Fallback
	const prev = getContext()
	setGlobalCtx(scope)
	try {
		return await fn()
	} finally {
		setGlobalCtx(prev)
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
		// Warn? Or fallback to global registry?
		// For now, if no context, we can't add to context.
		// The caller should use the global 'intercept' if they want global.
		console.warn('[@pounce/board] Attempted to add context interceptor outside of a context')
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
