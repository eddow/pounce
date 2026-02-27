import { JSDOM } from 'jsdom'
import { isTest } from 'mutts'
import { setPlatformAPIs } from '../shared'
import { createAlsProxy } from './proxy-factory'

/**
 * Bootstraps the platform for the Node.js/SSR environment.
 * Redirects platform calls into context-aware proxies for request isolation.
 * In Vitest environments with DOM, uses the provided DOM directly.
 */

// If Vitest provided a DOM environment, use it directly (no ALS proxies needed)
if (typeof window !== 'undefined') {
	setPlatformAPIs('Test/DOM', {
		window: globalThis.window,
		document: globalThis.document,
		crypto: globalThis.crypto,
	})
} else if (isTest) {
	// Test environment without Vitest DOM (e.g., core package's own tests)
	// Set up JSDOM manually
	const jsdom = new JSDOM(
		'<!DOCTYPE html><html><body><div id="root"></div><div id="mini"></div><div id="app"></div><div id="tests"></div></body></html>',
		{
			url: 'http://localhost',
			pretendToBeVisual: true,
		}
	)
	const { window } = jsdom
	const config = {
		window: window as unknown as Window,
		document: window.document,
		crypto: window.crypto,
	}

	// Safely assign properties, skipping read-only ones like crypto in newer Node versions
	for (const [key, value] of Object.entries(config)) {
		try {
			if (key in globalThis) continue
			// @ts-expect-error
			globalThis[key] = value
		} catch (_e) {
			// Ignore assignment errors for read-only properties
		}
	}

	setPlatformAPIs('Test/Node', config)
} else {
	// Otherwise, set up ALS proxies for SSR with request isolation
	setPlatformAPIs('Node/SSR', {
		window: createAlsProxy<Window>('window'),
		document: createAlsProxy<Document>('document'),
		crypto: createAlsProxy<Crypto>('crypto'),
	})
}

// Re-export the core API
export * from '..'

import setGlobals from '../init'

setGlobals()

// Also export the withSSR helper which is Node-specific
export { renderToString, renderToStringAsync, withSSR } from './server'
