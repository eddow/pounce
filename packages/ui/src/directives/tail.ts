import { resolveElement } from './shared'

/**
 * `use:tail` directive — keeps a scrollable container pinned to the bottom
 * as content grows, unless the user scrolls away. Re-engages when the user
 * scrolls back to the bottom.
 *
 * @example
 * ```tsx
 * <div use:tail style="overflow-y: auto; height: 300px">
 *   <for each={messages}>{(msg) => <p>{msg.text}</p>}</for>
 * </div>
 * ```
 */
export function tail(target: Node | Node[], value?: boolean): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return
	if (value === false) return

	const THRESHOLD = 30
	let trailing = true

	const isAtBottom = () =>
		element.scrollHeight - element.scrollTop - element.clientHeight < THRESHOLD

	const onScroll = () => {
		trailing = isAtBottom()
	}

	const scrollToEnd = () => {
		if (trailing) element.scrollTop = element.scrollHeight
	}

	const observer = new MutationObserver(() => {
		requestAnimationFrame(scrollToEnd)
	})

	element.addEventListener('scroll', onScroll)
	observer.observe(element, { childList: true, subtree: true })

	return () => {
		element.removeEventListener('scroll', onScroll)
		observer.disconnect()
	}
}
