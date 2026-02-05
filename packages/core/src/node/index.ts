import { setPlatformAPIs } from '../shared'
import { createAlsProxy } from './proxy-factory'
import { JSDOM } from 'jsdom'

/**
 * Checks if we're running in Vitest with a DOM environment provided.
 */
function isVitestWithDOM(): boolean {
	return (
		typeof globalThis.window !== 'undefined' &&
		typeof globalThis.document !== 'undefined' &&
		(process.env.VITEST === 'true' || typeof (globalThis as any).__vitest_worker__ !== 'undefined')
	)
}

/**
 * Bootstraps the platform for the Node.js/SSR environment.
 * Redirects platform calls into context-aware proxies for request isolation.
 * In Vitest environments with DOM, uses the provided DOM directly.
 */

// If Vitest provided a DOM environment, use it directly (no ALS proxies needed)
if (isVitestWithDOM()) {
	setPlatformAPIs('Node for Vitest with DOM environment', {
		window: globalThis.window,
		document: globalThis.document,
		Node: globalThis.Node,
		HTMLElement: globalThis.HTMLElement,
		Event: globalThis.Event,
		CustomEvent: globalThis.CustomEvent,
		Text: globalThis.Text,
		DocumentFragment: globalThis.DocumentFragment,
		crypto: globalThis.crypto,
	})
	console.log()
} else if(process.env.NODE_ENV === 'test') {
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
	
	setPlatformAPIs('Node for test environment (manual JSDOM)', {
		window: window as any,
		document: window.document as any,
		Node: window.Node as any,
		HTMLElement: window.HTMLElement as any,
		Event: window.Event as any,
		CustomEvent: window.CustomEvent as any,
		Text: window.Text as any,
		DocumentFragment: window.DocumentFragment as any,
		crypto: window.crypto as any,
	})
} else {
	// Otherwise, set up ALS proxies for SSR with request isolation
	setPlatformAPIs('Node for SSR', {
		window: createAlsProxy<Window>('window'),
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


// Re-export the core API
export * from '..'
// Also export the withSSR helper which is Node-specific
export { withSSR, renderToString, renderToStringAsync } from './server'