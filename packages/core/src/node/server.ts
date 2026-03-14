import { AsyncLocalStorage } from 'node:async_hooks'
import { JSDOM } from 'jsdom'
import { type Env, reconcile, rootEnv } from '../lib'
import {
	entryPoint,
	setPlatformAPIs,
	crypto as sharedCrypto,
	document as sharedDocument,
	window as sharedWindow,
} from '../shared'

/**
 * Global storage for the JSDOM instance associated with the current execution context (e.g., an SSR request).
 */
export const als = new AsyncLocalStorage<JSDOM>()
/**
 * Runs a function within an SSR DOM environment.
 * Sets up global document, window, Node, etc.
 */
export function withSSR<T>(fn: (dom: { document: Document; window: Window }) => T): T {
	const jsdom = new JSDOM(
		'<!DOCTYPE html><html><body><div id="root"></div><div id="mini"></div><div id="app"></div><div id="tests"></div></body></html>',
		{
			url: 'http://localhost',
			pretendToBeVisual: true,
		}
	)

	const { window } = jsdom
	const { document } = window
	const previousPlatform = {
		window: sharedWindow,
		document: sharedDocument,
		crypto: sharedCrypto,
		entryPoint,
	}
	const globalKeys = [
		'window',
		'document',
		'Node',
		'Element',
		'HTMLElement',
		'Text',
		'Comment',
		'DocumentFragment',
		'NodeFilter',
	] as const
	const previous = new Map<string, { existed: boolean; value: unknown }>()

	for (const key of globalKeys) {
		previous.set(key, {
			existed: key in globalThis,
			value: (globalThis as Record<string, unknown>)[key],
		})
		;(globalThis as Record<string, unknown>)[key] = (window as unknown as Record<string, unknown>)[
			key
		]
	}

	setPlatformAPIs('Node/SSR/Request', {
		window: window as unknown as Window,
		document: document as Document,
		crypto: window.crypto,
	})

	try {
		return als.run(jsdom, () =>
			fn({
				document: document as Document,
				window: window as unknown as Window,
			})
		)
	} finally {
		setPlatformAPIs(previousPlatform.entryPoint, {
			window: previousPlatform.window,
			document: previousPlatform.document,
			crypto: previousPlatform.crypto,
		})

		for (const key of globalKeys) {
			const saved = previous.get(key)
			if (!saved) continue
			if (saved.existed) {
				;(globalThis as Record<string, unknown>)[key] = saved.value
			} else {
				delete (globalThis as Record<string, unknown>)[key]
			}
		}
	}
}

/**
 * Renders a @sursaut/core element to a string synchronously.
 * Useful for basic SSR.
 */
export function renderToString(element: JSX.Element, env: Env = rootEnv): string {
	return withSSR(({ document }) => {
		const container = document.getElementById('root')!
		const mountable = element.render(env)
		reconcile(container as HTMLElement, mountable)
		return container.innerHTML
	})
}

/**
 * Renders a @sursaut/core element to a string asynchronously.
 * It waits for any promises collected via the provided callback.
 */
export async function renderToStringAsync(
	element: JSX.Element,
	env: Env = rootEnv,
	options: { collectPromises?: () => Promise<unknown>[] } = {}
): Promise<string> {
	return await withSSR(async ({ document }) => {
		const container = document.getElementById('root')!
		const mountable = element.render(env)
		reconcile(container as HTMLElement, mountable)

		// If we have a way to collect promises, wait for them
		if (options.collectPromises) {
			let promises = options.collectPromises()
			while (promises.length > 0) {
				await Promise.all(promises)
				// Yield multiple times to ensure all reactive effects (microtasks) have run
				for (let i = 0; i < 10; i++) await Promise.resolve()
				promises = options.collectPromises()
			}
		}

		// Final yield to ensure last-nanosecond reactive updates are applied to the DOM
		for (let i = 0; i < 10; i++) await Promise.resolve()

		return container.innerHTML
	})
}
