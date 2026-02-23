const _g = globalThis as any
export let window: Window = _g.window
export let document: Document = _g.document
export let Node: typeof globalThis.Node = _g.Node
export let HTMLElement: typeof globalThis.HTMLElement = _g.HTMLElement
export let Event: typeof globalThis.Event = _g.Event
export let CustomEvent: typeof globalThis.CustomEvent = _g.CustomEvent
export let Text: typeof globalThis.Text = _g.Text
export let DocumentFragment: typeof globalThis.DocumentFragment = _g.DocumentFragment
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
		Node?: typeof globalThis.Node
		HTMLElement?: typeof globalThis.HTMLElement
		Event?: typeof globalThis.Event
		CustomEvent?: typeof globalThis.CustomEvent
		Text?: typeof globalThis.Text
		DocumentFragment?: typeof globalThis.DocumentFragment
		crypto?: Crypto
	}
) => {
	entryPoint = name
	if (apis.window !== undefined) window = apis.window
	if (apis.document !== undefined) document = apis.document
	if (apis.Node !== undefined) Node = apis.Node
	if (apis.HTMLElement !== undefined) HTMLElement = apis.HTMLElement
	if (apis.Event !== undefined) Event = apis.Event
	if (apis.CustomEvent !== undefined) CustomEvent = apis.CustomEvent
	if (apis.Text !== undefined) Text = apis.Text
	if (apis.DocumentFragment !== undefined) DocumentFragment = apis.DocumentFragment
	if (apis.crypto !== undefined) crypto = apis.crypto
}

export let entryPoint = 'non-initialized'
