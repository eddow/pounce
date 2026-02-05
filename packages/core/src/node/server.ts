import { JSDOM } from 'jsdom'
import { bindChildren, rootScope, type Scope } from '../lib/renderer'
import { AsyncLocalStorage } from 'node:async_hooks'


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

	return als.run(jsdom, () =>
		fn({
			document: document as unknown as Document,
			window: window as unknown as Window,
		})
	)
}

/**
 * Renders a @pounce/core element to a string synchronously.
 * Useful for basic SSR.
 */
export function renderToString(element: JSX.Element, scope: Scope = rootScope): string {
	return withSSR(({ document }) => {
		const container = document.getElementById('root')!
		const mountable = element.render(scope)
		bindChildren(container as unknown as HTMLElement, mountable)
		return container.innerHTML
	})
}

/**
 * Renders a @pounce/core element to a string asynchronously.
 * It waits for any promises collected via the provided callback.
 */
export async function renderToStringAsync(
	element: JSX.Element,
	scope: Scope = rootScope,
	options: { collectPromises?: () => Promise<unknown>[] } = {}
): Promise<string> {
	return await withSSR(async ({ document }) => {
		const container = document.getElementById('root')!
		const mountable = element.render(scope)
		bindChildren(container as unknown as HTMLElement, mountable)

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
