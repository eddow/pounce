import { als } from './server'

/**
 * Creates a context-aware proxy that resolves properties from the JSDOM instance
 * stored in the current AsyncLocalStorage store.
 */
export function createAlsProxy<T>(name: string): T {
	return new Proxy({} as any, {
		get(_, prop) {
			const store = als.getStore()
			// If we're not in an ALS context, try to fallback to globalThis if it's available (helpful for some tests)
			// But primarily we expect a store.
			const target = (store?.window as any)?.[name] || (store?.window as any)

			if (!target && !store) {
				// Special case: if name is 'window', the target is the store.window itself
				if (name === 'window') {
					// wait, if store is null, we are out of context
				}
				throw new Error(`Accessing ${name}.${String(prop)} outside of a withSSR context.`)
			}

			// If name is 'window', the target is store.window
			const actualTarget = name === 'window' ? store!.window : (store!.window as any)[name]

			if (!actualTarget) {
				throw new Error(`Property ${name} not found on the current JSDOM instance.`)
			}

			const value = Reflect.get(actualTarget, prop)
			// Ensure methods are bound to the target instance (e.g., createElement)
			return typeof value === 'function' ? value.bind(actualTarget) : value
		},
		set(_, prop, value) {
			const store = als.getStore()
			if (!store) {
				throw new Error(`Setting ${name}.${String(prop)} outside of a withSSR context.`)
			}
			const actualTarget = name === 'window' ? store.window : (store.window as any)[name]
			return Reflect.set(actualTarget, prop, value)
		},
		// Add construct trap for classes like Node, HTMLElement
		construct(_, args) {
			const store = als.getStore()
			if (!store) {
				throw new Error(`Constructing ${name} outside of a withSSR context.`)
			}
			const actualTarget = (store.window as any)[name]
			return Reflect.construct(actualTarget, args)
		}
	})
}
