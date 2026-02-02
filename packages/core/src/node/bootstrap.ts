import { AsyncLocalStorage } from 'node:async_hooks'
import type { JSDOM } from 'jsdom'
import * as shared from '../shared'
import { createAlsProxy } from './proxy-factory'

/**
 * Global storage for the JSDOM instance associated with the current execution context (e.g., an SSR request).
 */
export const als = new AsyncLocalStorage<JSDOM>()

let bootstrapped = false

/**
 * Bootstraps the platform for the Node.js/SSR environment.
 * Redirects platform calls into context-aware proxies.
 */
export function bootstrap() {
	if (bootstrapped) return
	
	// If we're in a jsdom environment (e.g., vitest with jsdom), don't overwrite the DOM bootstrap
	// Check if window and document are already real DOM objects (not proxies)
	if (typeof globalThis.window !== 'undefined' && typeof globalThis.document !== 'undefined') {
		// We're in a jsdom environment, skip Node bootstrap
		bootstrapped = true
		return
	}
	
	bootstrapped = true

	shared.setWindow({
		window: createAlsProxy<shared.PlatformWindow>('window'),
		document: createAlsProxy<Document>('document'),
		Node: createAlsProxy<typeof Node>('Node'),
		HTMLElement: createAlsProxy<typeof HTMLElement>('HTMLElement'),
		Event: createAlsProxy<typeof Event>('Event'),
		CustomEvent: createAlsProxy<typeof CustomEvent>('CustomEvent'),
		Text: createAlsProxy<typeof Text>('Text'),
		DocumentFragment: createAlsProxy<typeof DocumentFragment>('DocumentFragment'),
		crypto: createAlsProxy<Crypto>('crypto'),
	})
}
