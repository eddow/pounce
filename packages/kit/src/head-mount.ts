import { type Children, type Env, h, rootEnv } from '@pounce/core'
import { effect, isReactive, link, type ScopedCallback, unlink, unwrap } from 'mutts'

function destroyNode(node: Node): void {
	let child = node.firstChild
	while (child) {
		const next = child.nextSibling
		destroyNode(child)
		child = next
	}
	unlink(node)
}

function collectRange(start: Comment, end: Comment): Node[] {
	const nodes: Node[] = []
	let current = start.nextSibling
	while (current && current !== end) {
		nodes.push(current)
		current = current.nextSibling
	}
	return nodes
}

function reconcileRange(
	parent: Node,
	start: Comment,
	end: Comment,
	children: Node | readonly Node[],
	onChange?: () => void
): ScopedCallback {
	function sync(): void {
		const items = (Array.isArray(children) ? children : children ? [children] : []).map(
			(item) => unwrap(item) as Node
		)
		const currentNodes = collectRange(start, end)
		const itemsSet = new Set(items)
		let cursor = currentNodes[0] ?? end

		for (const item of items) {
			while (cursor !== end && !itemsSet.has(cursor)) {
				const doomed = cursor
				cursor = doomed.nextSibling ?? end
				parent.removeChild(doomed)
				destroyNode(doomed)
			}
			if (cursor !== item) {
				parent.insertBefore(item, cursor)
			} else {
				cursor = cursor.nextSibling ?? end
			}
		}

		while (cursor !== end) {
			const doomed = cursor
			cursor = doomed.nextSibling ?? end
			parent.removeChild(doomed)
			destroyNode(doomed)
		}

		onChange?.()
	}

	if (isReactive(children)) {
		const stop = effect`head:reconcile`(sync)
		link(children, stop)
		return stop
	}

	sync()
	return () => {}
}

export function mountHeadContent(
	target: Node,
	content: Children,
	env: Env = rootEnv,
	onChange?: () => void
): ScopedCallback {
	const documentNode = target.ownerDocument ?? (target as Document)
	const start = documentNode.createComment('pounce-head:start')
	const end = documentNode.createComment('pounce-head:end')
	target.appendChild(start)
	target.appendChild(end)

	const wrapped = h('fragment', {}, ...(Array.isArray(content) ? content : [content]))
	const nodes = wrapped.render(env)
	const stop = reconcileRange(target, start, end, nodes, onChange)
	link(start, nodes, stop)
	onChange?.()

	return () => {
		unlink(start)
		for (const node of collectRange(start, end)) {
			target.removeChild(node)
			destroyNode(node)
		}
		start.remove()
		end.remove()
		onChange?.()
	}
}
