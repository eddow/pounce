export * from './base-client'
export * from './context'
export * from './core'
export * from './inference'
export * from './response'

import { createApiClientFactory } from './base-client'

export const api = createApiClientFactory(async (req: Request, timeout: number) => {
	const controller = new AbortController()
	const id = setTimeout(() => controller.abort(), timeout)

	try {
		return await fetch(req, {
			signal: controller.signal as RequestInit['signal'],
		})
	} finally {
		clearTimeout(id)
	}
})
