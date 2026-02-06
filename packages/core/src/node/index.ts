import { setPlatformAPIs } from '../shared'
import { createAlsProxy } from './proxy-factory'
import { JSDOM } from 'jsdom'

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
		Node: globalThis.Node,
		HTMLElement: globalThis.HTMLElement,
		Event: globalThis.Event,
		CustomEvent: globalThis.CustomEvent,
		Text: globalThis.Text,
		DocumentFragment: globalThis.DocumentFragment,
		crypto: globalThis.crypto,
	})
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
	const config = {
		window: window as unknown as Window,
		document: window.document,
		Node: window.Node,
		HTMLElement: window.HTMLElement,
		Event: window.Event,
		CustomEvent: window.CustomEvent,
		Text: window.Text,
		DocumentFragment: window.DocumentFragment,
		crypto: window.crypto,
	}
	Object.assign(globalThis, config)
	setPlatformAPIs('Test/Node', config)
} else {
	// Otherwise, set up ALS proxies for SSR with request isolation
	setPlatformAPIs('Node/SSR', {
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