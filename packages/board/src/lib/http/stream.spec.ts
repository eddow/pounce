import { describe, expect, it, vi } from 'vitest'
import { defineStreamRoute } from './stream.js'

function expectResponse(
	value: Response | { status: number; data?: unknown; error?: string }
): Response {
	expect(value).toBeInstanceOf(Response)
	if (!(value instanceof Response)) {
		throw new Error('Expected Response from defineStreamRoute handler')
	}
	return value
}

describe('defineStreamRoute', () => {
	it('should produce a Response with text/event-stream content type', async () => {
		const handler = defineStreamRoute(() => {
			return () => {}
		})

		const mockReq = new Request('http://localhost')
		const response = expectResponse(await handler({ request: mockReq, params: {} }))

		expect(response.headers.get('Content-Type')).toBe('text/event-stream')
		expect(response.headers.get('Cache-Control')).toBe('no-cache')
		expect(response.headers.get('Connection')).toBe('keep-alive')
	})

	it('should write SSE frames to the stream when send is called', async () => {
		let sendData: (<T>(data: T) => void) | undefined
		const handler = defineStreamRoute((_ctx, send) => {
			sendData = send
			return () => {}
		})

		const mockReq = new Request('http://localhost')
		const response = expectResponse(await handler({ request: mockReq, params: {} }))

		expect(response.body).toBeDefined()
		const reader = response.body!.getReader()
		const decoder = new TextDecoder()

		// Call send to simulate data push
		expect(sendData).toBeDefined()
		sendData!({ message: 'hello' })
		sendData!({ message: 'world' })

		// Read first frame
		const chunk1 = await reader.read()
		expect(chunk1.done).toBe(false)
		expect(decoder.decode(chunk1.value)).toBe('data: {"message":"hello"}\n\n')

		// Read second frame
		const chunk2 = await reader.read()
		expect(chunk2.done).toBe(false)
		expect(decoder.decode(chunk2.value)).toBe('data: {"message":"world"}\n\n')
	})

	it('should call cleanup when stream is closed', async () => {
		const cleanupMock = vi.fn()
		const handler = defineStreamRoute(() => {
			return cleanupMock
		})

		const mockReq = new Request('http://localhost')
		const response = expectResponse(await handler({ request: mockReq, params: {} }))

		expect(response.body).toBeDefined()

		// Cancel the stream to trigger cleanup
		await response.body!.cancel()

		expect(cleanupMock).toHaveBeenCalledTimes(1)
	})
})
