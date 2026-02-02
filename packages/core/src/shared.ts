export interface PlatformWindow {
	window: PlatformWindow
	document: Document
	crypto: Crypto
	Node: typeof Node
	HTMLElement: typeof HTMLElement
	Event: typeof Event
	CustomEvent: typeof CustomEvent
	Text: typeof Text
	DocumentFragment: typeof DocumentFragment
}

export let window: PlatformWindow = null!
export let document: Document = null!
export let Node: typeof globalThis.Node = null!
export let HTMLElement: typeof globalThis.HTMLElement = null!
export let Event: typeof globalThis.Event = null!
export let CustomEvent: typeof globalThis.CustomEvent = null!
export let Text: typeof globalThis.Text = null!
export let DocumentFragment: typeof globalThis.DocumentFragment = null!
export let crypto: Crypto = null!

/**
 * Sets the active window and derives all other DOM globals from it.
 * This is the primary entry point for environment binding.
 * 
 * In Node.js, the passed 'impl' should contain proxies for each property
 * to ensure context-aware resolution.
 */
export const setWindow = (impl: PlatformWindow) => {
	// TODO: Finally, make separate `set...`, window does not have a crypto, Node, ... typed
	window = impl
	if (impl) {
		document = impl.document
		Node = impl.Node
		HTMLElement = impl.HTMLElement
		Event = impl.Event
		CustomEvent = impl.CustomEvent
		Text = impl.Text
		DocumentFragment = impl.DocumentFragment
		crypto = impl.crypto
	}
}
