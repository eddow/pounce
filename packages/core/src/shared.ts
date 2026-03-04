import { reactive } from 'mutts'

const _g = globalThis as any
export let window: Window = _g.window
export let document: Document = _g.document
export let crypto: Crypto = _g.crypto

/**
 * Sets the active window and derives all other DOM globals from it.
 * This is the primary entry point for environment binding.
 *
 * In Node.js, the passed 'impl' should contain proxies for each property
 * to ensure context-aware resolution.
 */

/**
 * Set platform APIs individually for more granular control.
 * Useful when you need to set up specific APIs without a full PlatformWindow.
 */
export const setPlatformAPIs = (
	name: string,
	apis: {
		window?: Window
		document?: Document
		crypto?: Crypto
	}
) => {
	entryPoint = name
	if (apis.window !== undefined) window = apis.window
	if (apis.document !== undefined) document = apis.document
	if (apis.crypto !== undefined) crypto = apis.crypto
}

export let entryPoint = 'non-initialized'

export const mountedNodes = reactive(new WeakSet<Node>())
