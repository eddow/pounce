import { describe, expect, it, vi } from 'vitest'
import { createApiClientFactory } from './base-client.js'

describe('ApiClient stream', () => {
	it('should read SSE frames and call onMessage', async () => {
		// Mock an executor that returns a stream
		const mockExecutor = vi.fn().mockImplementation(async () => {
			const stream = new ReadableStream({
				start(controller) {
					const encoder = new TextEncoder()
					controller.enqueue(encoder.encode('data: {"msg": "hello"}\n\n'))
					controller.enqueue(encoder.encode('data: {"msg": "world"}\n\n'))
					controller.close()
				},
			})

			return new Response(stream, {
				headers: { 'Content-Type': 'text/event-stream' },
			})
		})

		const client = createApiClientFactory(mockExecutor)
		const onMessage = vi.fn()
		const onError = vi.fn()

		// Intercept fetch directly because stream() bypasses the generic executor
		// implementation and calls `fetch` directly since it needs a true Response stream.
		const originalFetch = globalThis.fetch
		globalThis.fetch = mockExecutor

		const cleanup = client('/api/stream').stream(onMessage, onError)

		// Wait an event loop tick for stream consumption to finish
		await new Promise((r) => setTimeout(r, 50))

		expect(onMessage).toHaveBeenCalledTimes(2)
		expect(onMessage).toHaveBeenNthCalledWith(1, { msg: 'hello' })
		expect(onMessage).toHaveBeenNthCalledWith(2, { msg: 'world' })
		expect(onError).not.toHaveBeenCalled()

		cleanup()
		globalThis.fetch = originalFetch
	})

	it('should gracefully handle abort', async () => {
		const abortPromise = new Promise<void>((resolve) => {
			const mockExecutor = vi.fn().mockImplementation(async (req: Request) => {
				const stream = new ReadableStream({
					start(controller) {
						req.signal.addEventListener('abort', () => {
							resolve()
						})
					},
				})
				return new Response(stream)
			})

			const originalFetch = globalThis.fetch
			globalThis.fetch = mockExecutor

			const client = createApiClientFactory(mockExecutor)
			const onMessage = vi.fn()
			const onError = vi.fn()

			const cleanup = client('/api/long-stream').stream(onMessage, onError)
			cleanup() // Abort immediately

			globalThis.fetch = originalFetch
		})

		await expect(abortPromise).resolves.toBeUndefined()
	})
})
