import { createApiClientFactory, type RequestExecutor, type ApiClient, type ApiClientInstance } from '../api/base-client.js'
import { ApiError } from '../api/core.js'

const fetchExecutor: RequestExecutor = async (req: Request, timeout: number) => {
    const controller = new AbortController()
    const id = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined
    
    try {
        const response = await fetch(req, {
            signal: controller.signal
        })
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

// Export the singleton API instance configured with Fetch
const domApi = createApiClientFactory(fetchExecutor)
export { domApi as api }
export * from '../api/base-client.js'

// Re-export helper functions bound to this api instance
export function get<T>(params?: Record<string, string>): Promise<T> {
	return domApi.get<T>(params)
}
export function post<T>(body: unknown): Promise<T> {
	return domApi.post<T>(body)
}
export function put<T>(body: unknown): Promise<T> {
	return domApi.put<T>(body)
}
export function del<T>(params?: Record<string, string>): Promise<T> {
	return domApi.del<T>(params)
}
export function patch<T>(body: unknown): Promise<T> {
	return domApi.patch<T>(body)
}
