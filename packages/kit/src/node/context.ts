/**
 * ALS-backed context for Node/SSR — Node EP only.
 * Hooks into the shared getContext via setGetContext().
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import { type RequestScope, setGetContext } from '../api/context.js'

const STORAGE_KEY = Symbol.for('__POUNCE_STORAGE__')

type PounceGlobals = {
	[STORAGE_KEY]?: AsyncLocalStorage<RequestScope>
}

const globals = globalThis as unknown as PounceGlobals

function getStorage(): AsyncLocalStorage<RequestScope> | undefined {
	return globals[STORAGE_KEY]
}

export function setStorage(storage: AsyncLocalStorage<RequestScope>) {
	globals[STORAGE_KEY] = storage
}

function alsGetContext(): RequestScope | null {
	const store = getStorage()?.getStore()
	if (store) return store
	return (globalThis as any)[Symbol.for('__POUNCE_CONTEXT__')] || null
}

// Install ALS-aware getContext immediately on import
setGetContext(alsGetContext)

export async function runWithContext<T>(scope: RequestScope, fn: () => Promise<T>): Promise<T> {
	let storage = getStorage()
	if (!storage) {
		storage = new AsyncLocalStorage<RequestScope>()
		globals[STORAGE_KEY] = storage
	}
	return storage.run(scope, fn)
}
