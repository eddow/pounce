import type { Children, Env } from '@sursaut/core'
import type { ScopedCallback } from 'mutts'
import { mountHeadContent } from '../head-mount.js'
import type { Client, HeadMount, PlatformAdapter } from './types.js'

let _platform: PlatformAdapter | null = null
let _headMount: HeadMount | null = null

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

export const setHeadMount = (impl: HeadMount | null) => {
	_headMount = impl
}

function ensure(operation: string): PlatformAdapter {
	if (!_platform)
		throw new Error(
			`[@sursaut/kit] No platform adapter set (${operation}). Import @sursaut/kit/dom (browser) or call setPlatform() with an SSR/test adapter.`
		)
	return _platform
}

/** Reactive client state — delegates to the active platform adapter. */
export const client: Client = new Proxy({} as Client, {
	get(_, prop) {
		const c = ensure('client.get').client
		return (c as any)[prop]
	},
	set(_, prop, value) {
		return Reflect.set(ensure('client.set').client, prop, value)
	},
})

export function mountHead(content: Children, env?: Env): ScopedCallback {
	if (_headMount) return _headMount(content, env)
	const platformMount = _platform?.mountHead
	if (platformMount) return platformMount(content, env)
	if (typeof document !== 'undefined') return mountHeadContent(document.head, content, env)
	throw new Error(
		'[@sursaut/kit] No head mount configured. Import @sursaut/kit/dom, provide a platform adapter with mountHead(), or call setHeadMount().'
	)
}
