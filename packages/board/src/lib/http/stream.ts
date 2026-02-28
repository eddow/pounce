import type { RequestContext, RouteHandler } from './core.js'

export type StreamCleanup = () => void

export type StreamHandler = (
	context: RequestContext,
	send: <T>(data: T) => void
) => StreamCleanup | Promise<StreamCleanup>

/**
 * Defines a route handler that returns a Server-Sent Events stream.
 * Converts the custom stream handler into a standard RouteHandler returning a Response.
 */
export function defineStreamRoute(handler: StreamHandler): RouteHandler {
	return async (context: RequestContext) => {
		let cleanup: StreamCleanup | undefined

		const stream = new ReadableStream({
			async start(controller) {
				const send = <T>(data: T) => {
					try {
						const payload = `data: ${JSON.stringify(data)}\n\n`
						controller.enqueue(new TextEncoder().encode(payload))
					} catch (_) {
						// Ignored if controller is closed
					}
				}

				try {
					cleanup = await handler(context, send)
				} catch (error) {
					controller.error(error)
				}
			},
			cancel() {
				if (cleanup) {
					cleanup()
				}
			},
		})

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		})
	}
}
