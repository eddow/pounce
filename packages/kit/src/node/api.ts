import { createApiClientFactory, type RequestExecutor } from '../api/base-client.js'
import { ApiError } from '../api/core.js'

/**
 * Node server executor.
 * For local requests, falls back to fetch (Node 18+ has global fetch).
 * Server-side dispatch (route registry) is board's concern.
 */
const serverExecutor: RequestExecutor = async (req: Request, timeout: number) => {
	const controller = new AbortController()
	const id = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined

	try {
		const response = await fetch(req, { signal: controller.signal })
		return response
	} catch (error: any) {
		if (error.name === 'AbortError') {
			throw new ApiError(408, 'Request Timeout', null, req.url)
		}
		throw error
	} finally {
		if (id) clearTimeout(id)
	}
}

const serverApi = createApiClientFactory(serverExecutor)
export { serverApi as api }
export * from '../api/base-client.js'

export function get<T>(params?: Record<string, string>): Promise<T> {
	return serverApi.get<T>(params)
}
export function post<T>(body: unknown): Promise<T> {
	return serverApi.post<T>(body)
}
export function put<T>(body: unknown): Promise<T> {
	return serverApi.put<T>(body)
}
export function del<T>(params?: Record<string, string>): Promise<T> {
	return serverApi.del<T>(params)
}
export function patch<T>(body: unknown): Promise<T> {
	return serverApi.patch<T>(body)
}
