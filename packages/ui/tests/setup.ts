/**
 * Global test setup — polyfills for APIs missing in JSDOM.
 * Loaded via vitest.config.ts `setupFiles`.
 */

// ResizeObserver is not implemented in JSDOM.
// Provide a minimal mock that calls the callback once synchronously on observe()
// so components using `use:resize` can render without breaking the reactive system.
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class ResizeObserver {
		private callback: ResizeObserverCallback

		constructor(callback: ResizeObserverCallback) {
			this.callback = callback
		}

		observe(target: Element) {
			// Fire via microtask (like real ResizeObserver) so it doesn't interfere
			// with the render effect's batch. 800×600 default viewport for tests.
			queueMicrotask(() => {
				const entry = {
					target,
					contentRect: { x: 0, y: 0, width: 800, height: 600, top: 0, right: 800, bottom: 600, left: 0 } as DOMRectReadOnly,
					borderBoxSize: [{ inlineSize: 800, blockSize: 600 }] as readonly ResizeObserverSize[],
					contentBoxSize: [{ inlineSize: 800, blockSize: 600 }] as readonly ResizeObserverSize[],
					devicePixelContentBoxSize: [] as readonly ResizeObserverSize[],
				} as ResizeObserverEntry
				this.callback([entry], this)
			})
		}

		unobserve() {}
		disconnect() {}
	}
}
