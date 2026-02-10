const g = typeof globalThis !== 'undefined' ? globalThis : ({} as any)

export let window: Window = g.window
export let document: Document = g.document
export let Node: typeof globalThis.Node = g.Node
export let HTMLElement: typeof globalThis.HTMLElement = g.HTMLElement
export let Event: typeof globalThis.Event = g.Event
export let CustomEvent: typeof globalThis.CustomEvent = g.CustomEvent
export let Text: typeof globalThis.Text = g.Text
export let DocumentFragment: typeof globalThis.DocumentFragment = g.DocumentFragment
export let crypto: Crypto = g.crypto

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
