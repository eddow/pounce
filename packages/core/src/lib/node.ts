import { document, mountedNodes } from '../shared'
import { latchOwners } from './reconciler'

const NodeConstructor = globalThis.Node
const originalIsConnected = NodeConstructor
	? Object.getOwnPropertyDescriptor(NodeConstructor.prototype, 'isConnected')
	: undefined

if (NodeConstructor && originalIsConnected) {
	Object.defineProperty(NodeConstructor.prototype, 'isConnected', {
		...originalIsConnected,
		get() {
			const nodeTruth = originalIsConnected.get?.call(this)
			if (latchOwners.has(this)) return nodeTruth
			if (nodeTruth !== mountedNodes.has(this)) {
				if (nodeTruth) mountedNodes.add(this)
				else mountedNodes.delete(this)
			}
			return nodeTruth
		},
	})
}

export function* walk(root: Node) {
	yield root
	if (!(typeof Element !== 'undefined' && root instanceof Element)) return
	const doc = root.ownerDocument || document
	const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null)

	let currentNode: Node | null
	while ((currentNode = walker.nextNode())) yield currentNode
}

export function syncRegistry(root: Node, action: 'add' | 'delete', connecting: boolean) {
	if (connecting) for (const node of walk(root)) mountedNodes[action](node)
}
