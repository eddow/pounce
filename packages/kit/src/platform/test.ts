import { reactive } from 'mutts'
import type { Client, PlatformAdapter } from './types.js'

/**
 * Test platform adapter — global reactive client, no ALS, no proxies.
 * Head injection: use `latch(document.head, ...)` from @pounce/core directly.
 */
export function createTestAdapter(url?: string | URL): PlatformAdapter {
	const parsedUrl = url ? new URL(url) : new URL('http://localhost/')

	const client = reactive({
		url: {
			href: parsedUrl.href,
			origin: parsedUrl.origin,
			pathname: parsedUrl.pathname,
			search: parsedUrl.search,
			hash: parsedUrl.hash,
			segments: parsedUrl.pathname.split('/').filter((s) => s.length > 0),
			query: Object.fromEntries(parsedUrl.searchParams.entries()),
		},
		viewport: { width: 1920, height: 1080 },
		history: { length: 1 },
		focused: false,
		visibilityState: 'hidden' as const,
		devicePixelRatio: 1,
		online: true,
		language: 'en-US',
		timezone: 'UTC',
		direction: 'ltr' as const,
		navigate: () => {
			throw new Error('client.navigate() is not available in test context')
		},
		replace: () => {
			throw new Error('client.replace() is not available in test context')
		},
		reload: () => {
			throw new Error('client.reload() is not available in test context')
		},
		dispose: () => {},
		prefersDark: false,
	}) as Client

	return { client }
}
