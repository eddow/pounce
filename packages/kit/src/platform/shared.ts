import type { Scope } from '@pounce/core'
import type { ScopedCallback } from 'mutts'
import type { Client, PlatformAdapter } from './types.js'

let _platform: PlatformAdapter | null = null

/**
 * Set the active platform adapter.
 * Called once by the environment-specific entry point:
 * - `kit/dom/` for browsers
 * - board (or any SSR engine) for server
 * - test setup for unit tests
 */
export const setPlatform = (impl: PlatformAdapter) => {
	_platform = impl
}

function ensure(operation: string): PlatformAdapter {
	if (!_platform) throw new Error(`[@pounce/kit] No platform adapter set (${operation}). Import @pounce/kit/dom (browser) or call setPlatform() with an SSR/test adapter.`)
	return _platform
}

/** Reactive client state — delegates to the active platform adapter. */
export const client: Client = new Proxy({} as Client, {
	get(_, prop, receiver) {
		if (!_platform) return undefined
		return Reflect.get(_platform.client, prop, receiver)
	},
	set(_, prop, value) { return Reflect.set(ensure('client.set').client, prop, value) },
})

/**
 * Inject JSX children into `<head>`, return cleanup.
 * Delegates to the active platform adapter.
 */
export function head(children: JSX.Element, scope?: Scope): ScopedCallback {
	return ensure('head').head(children, scope)
}
