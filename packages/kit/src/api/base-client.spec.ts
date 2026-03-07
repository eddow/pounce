import { describe, expect, it, vi } from 'vitest'
import { createApiClientFactory } from './base-client.js'

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
