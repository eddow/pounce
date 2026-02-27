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
/**
 * Checks if a node is currently mounted in the DOM.
 * @param node The node to check.
 * @returns True if the node is mounted, false otherwise.
 * @remarks
 * This function is reactive and will trigger updates if the node's mounted state changes.
 */
export function isMounted(node: Node) {
	// TODO: proxy `node.isConnected` here, test `await when(()=> node.isConnected)` as it might lead to async abort + rerun of the effect - find a nice way to manage mounting
	return mountedNodes.has(node)
}
