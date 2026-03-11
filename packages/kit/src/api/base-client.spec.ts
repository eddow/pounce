import { describe, expect, it, vi } from 'vitest'
import { createApiClientFactory } from './base-client.js'
import { _registerApi, defineRoute } from './defs.js'

describe('ApiClient prefetch', () => {
	it('reuses a prefetched GET result for the next get call', async () => {
		const mockExecutor = vi.fn(
			async () =>
				new Response(JSON.stringify({ ok: true, value: 1 }), {
					headers: { 'Content-Type': 'application/json' },
				})
		)

		const client = createApiClientFactory(mockExecutor)
		const entry = client('/api/posts/[id]')

		await entry.prefetch({ id: 1 })
		const value = await entry.get<{ ok: boolean; value: number }>({ id: 1 })

		expect(value).toEqual({ ok: true, value: 1 })
		expect(mockExecutor).toHaveBeenCalledTimes(1)
	})

	it('shares an in-flight prefetch promise with get', async () => {
		let resolveResponse: ((response: Response) => void) | undefined
		const mockExecutor = vi.fn(
			() =>
				new Promise<Response>((resolve) => {
					resolveResponse = resolve
				})
		)

		const client = createApiClientFactory(mockExecutor)
		const entry = client('/api/posts/[id]')

		const prefetched = entry.prefetch<{ ok: boolean; value: number }>({ id: 2 })
		const requested = entry.get<{ ok: boolean; value: number }>({ id: 2 })

		expect(mockExecutor).toHaveBeenCalledTimes(1)

		resolveResponse?.(
			new Response(JSON.stringify({ ok: true, value: 2 }), {
				headers: { 'Content-Type': 'application/json' },
			})
		)

		await expect(prefetched).resolves.toEqual({ ok: true, value: 2 })
		await expect(requested).resolves.toEqual({ ok: true, value: 2 })
	})

	it('expires prefetched GET values after the provided ttl', async () => {
		let counter = 0
		const mockExecutor = vi.fn(
			async (_req: Request) =>
				new Response(JSON.stringify({ ok: true, call: ++counter }), {
					headers: { 'Content-Type': 'application/json' },
				})
		)

		const client = createApiClientFactory(mockExecutor)
		const entry = client('/api/posts/[id]')

		await entry.prefetch({ id: 3 }, { ttl: 1 })
		await new Promise((resolve) => setTimeout(resolve, 5))
		const value = await entry.get<{ ok: boolean; call: number }>({ id: 3 })

		expect(value).toEqual({ ok: true, call: 2 })
		expect(mockExecutor).toHaveBeenCalledTimes(2)
	})
})

describe('defineRoute callable', () => {
	it('calls the registered api with the built URL', async () => {
		const mockExecutor = vi.fn(
			async () =>
				new Response(JSON.stringify({ id: '42', name: 'Alice' }), {
					headers: { 'Content-Type': 'application/json' },
				})
		)
		const client = createApiClientFactory(mockExecutor)
		_registerApi(client as any)

		const getUser = defineRoute('/users/[id]')
		const user = await getUser({ id: '42' }).get<{ id: string; name: string }>()

		expect(user).toEqual({ id: '42', name: 'Alice' })
		expect(mockExecutor).toHaveBeenCalledTimes(1)
		const calledUrl = new URL((mockExecutor.mock.calls as any)[0][0].url)
		expect(calledUrl.pathname).toBe('/users/42')
	})

	it('appends query params via schema', async () => {
		const mockExecutor = vi.fn(
			async () =>
				new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
		)
		const client = createApiClientFactory(mockExecutor)
		_registerApi(client as any)

		const listUsers = defineRoute('/users', {
			assert: (p: { page?: number; limit?: number }) => ({
				page: String(p.page ?? 1),
				limit: String(p.limit ?? 10),
			}),
		})
		await listUsers({ page: 2, limit: 5 }).get()

		const calledUrl = new URL((mockExecutor.mock.calls as any)[0][0].url)
		expect(calledUrl.pathname).toBe('/users')
		expect(calledUrl.searchParams.get('page')).toBe('2')
		expect(calledUrl.searchParams.get('limit')).toBe('5')
	})

	it('allows zero-arg calls for routes without required params', async () => {
		const mockExecutor = vi.fn(
			async () =>
				new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
		)
		const client = createApiClientFactory(mockExecutor)
		_registerApi(client as any)

		const listUsers = defineRoute('/users')
		await listUsers().get()

		const calledUrl = new URL((mockExecutor.mock.calls as any)[0][0].url)
		expect(calledUrl.pathname).toBe('/users')
		expect(calledUrl.search).toBe('')
	})

	it('throws when a required path param is missing', () => {
		const getUser = defineRoute('/users/[id]')
		expect(() => getUser({} as any)).toThrow('Missing path parameter: id')
	})

	it('exposes path and buildUrl as properties', () => {
		const route = defineRoute('/posts/[slug]')
		expect(route.path).toBe('/posts/[slug]')
		expect(route.buildUrl({ slug: 'hello' })).toBe('/posts/hello')
	})
})
