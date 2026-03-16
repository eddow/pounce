import { walk } from '../lib/node'
import { mountedNodes } from '../shared'

export function markMounted(root: Node) {
	for (const node of walk(root)) mountedNodes.add(node)
	if (!(root instanceof Element)) mountedNodes.add(root)
	return root
}

export function markUnmounted(root: Node) {
	for (const node of walk(root)) mountedNodes.delete(node)
	mountedNodes.delete(root)
	return root
}

// TODO: e2e test element.isConnected tracks reactive isConnected in browser (I saw it not working)
