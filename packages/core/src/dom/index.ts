import { setPlatformAPIs } from '../shared'

// Auto-execute bootstrap when this module is imported in a browser environment
if (typeof window === 'undefined') throw new Error('window is undefined')

setPlatformAPIs('DOM/Browser', {
	window,
	document,
	Node,
	HTMLElement,
	Event,
	CustomEvent,
	Text,
	DocumentFragment,
	crypto,
})

// Re-export the core API
export * from '..'

import setGlobals from '../init'

setGlobals()

import { mountedNodes } from '../shared'

function syncRegistry(root: Node, action: 'add' | 'delete') {
	// 1. Handle the root node itself
	if (root instanceof Element) {
		mountedNodes[action](root)

		// 2. Walk the descendants
		const walker = document.createTreeWalker(
			root,
			NodeFilter.SHOW_ELEMENT, // Skip text/comments entirely
			null
		)

		let currentNode: Node | null
		while ((currentNode = walker.nextNode())) {
			// TypeScript now knows currentNode is an Element because of SHOW_ELEMENT
			mountedNodes[action](currentNode as Element)
		}
	}
}
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		mutation.addedNodes.forEach((node) => syncRegistry(node, 'add'))
		mutation.removedNodes.forEach((node) => syncRegistry(node, 'delete'))
	}
})

// Start observing the document
// We only care about childList changes; ignore attributes to keep it fast.
observer.observe(document.documentElement, {
	childList: true,
	subtree: true,
})
