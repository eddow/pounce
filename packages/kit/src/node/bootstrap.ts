import { AsyncLocalStorage } from 'node:async_hooks'
import { reactive } from 'mutts'
import type { Client } from '../client/types.js'

/**
 * Global storage for the Client instance associated with the current execution context (e.g., an SSR request).
 */
export const als = new AsyncLocalStorage<Client>()

/**
 * Creates a new isolated client instance for an SSR request.
 */
export function createClientInstance(url?: string | URL): Client {
	const parsedUrl = url ? new URL(url) : new URL('http://localhost/')

	return reactive({
		url: {
			href: parsedUrl.href,
			origin: parsedUrl.origin,
			pathname: parsedUrl.pathname,
			search: parsedUrl.search,
			hash: parsedUrl.hash,
			segments: parsedUrl.pathname.split('/').filter((s) => s.length > 0),
			query: Object.fromEntries(parsedUrl.searchParams.entries()),
		},
		viewport: { width: 1920, height: 1080 }, // Default SSR viewport
		history: { length: 1 },
		focused: false,
		visibilityState: 'hidden' as const,
		devicePixelRatio: 1,
		online: true,
		language: 'en-US',
		timezone: 'UTC',
		direction: 'ltr',
		navigate: () => {
			throw new Error('client.navigate() is not available in SSR context')
		},
		replace: () => {
			throw new Error('client.replace() is not available in SSR context')
		},
		reload: () => {
			throw new Error('client.reload() is not available in SSR context')
		},
		dispose: () => {},
		prefersDark: false,
	}) as Client
}

/**
 * Creates a context-aware proxy that resolves to the client instance
 * stored in the current AsyncLocalStorage context.
 */
export function createClientProxy(): Client {
	return new Proxy({} as Client, {
		get(_, prop) {
			const store = als.getStore()
			if (!store) {
				throw new Error(
					`Accessing client.${String(prop)} outside of a withSSR context. ` +
						`Make sure you're using withSSR() or runWithClient() to establish a request context.`
				)
			}
			const value = Reflect.get(store, prop)
			return typeof value === 'function' ? value.bind(store) : value
		},
		set(_, prop, value) {
			const store = als.getStore()
			if (!store) {
				throw new Error(`Setting client.${String(prop)} outside of a withSSR context.`)
			}
			return Reflect.set(store, prop, value)
		},
	})
}

/**
 * Runs a function within an SSR client context.
 * Creates an isolated client instance for the duration of the function.
 */
export function runWithClient<T>(fn: (client: Client) => T, options?: { url?: string | URL }): T {
	const clientInstance = createClientInstance(options?.url)
	return als.run(clientInstance, () => fn(clientInstance))
}

/**
 * Runs an async function within an SSR client context.
 */
export async function runWithClientAsync<T>(
	fn: (client: Client) => Promise<T>,
	options?: { url?: string | URL }
): Promise<T> {
	const clientInstance = createClientInstance(options?.url)
	return als.run(clientInstance, () => fn(clientInstance))
}
