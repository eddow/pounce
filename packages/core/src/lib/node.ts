import { reactive, unlink } from 'mutts'
import { document } from '../shared'
import { latchOwners } from './reconciler'

export const mountedNodes = reactive(new WeakSet<Node>())
const originalIsConnected = Object.getOwnPropertyDescriptor(Node.prototype, 'isConnected')

Object.defineProperty(Node.prototype, 'isConnected', {
	...originalIsConnected,
	get() {
		// TODO latchOwners should be tracked with a MutationObserver and treated here normally
		const nodeTruth = originalIsConnected?.get?.call(this)
		if (latchOwners.has(this)) return nodeTruth
		if (nodeTruth !== mountedNodes.has(this)) {
			if (nodeTruth) mountedNodes.add(this)
			else mountedNodes.delete(this)
			// third-party modification recovered silently
		}
		return nodeTruth
	},
})

export function* walk(root: Node) {
	if (root instanceof Element) {
		yield root
		const doc = root.ownerDocument || document
		// 2. Walk the descendants
		const walker = doc.createTreeWalker(
			root,
			NodeFilter.SHOW_ELEMENT, // Skip text/comments entirely
			null
		)

		let currentNode: Node | null
		while ((currentNode = walker.nextNode())) yield currentNode
	}
}

export function syncRegistry(root: Node, action: 'add' | 'delete', connecting: boolean) {
	//shortcut
	if (!connecting && action === 'add') return
	for (const node of walk(root)) {
		if (connecting) mountedNodes[action](node)
		if (action === 'delete') unlink(node, { type: 'stopped', detail: 'node removal' })
	}
}
