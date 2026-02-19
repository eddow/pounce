/**
 * `use:trail` directive — keeps a scrollable container pinned to the bottom
 * as content grows, unless the user scrolls away. Re-engages when the user
 * scrolls back to the bottom.
 *
 * Value: `boolean` (default `true`) — enables/disables trailing.
 *
 * @example
 * ```tsx
 * <div use:trail>
 *   <for each={messages}>{(msg) => <p>{msg.text}</p>}</for>
 * </div>
 * ```
 */
export function trail(
	target: Node | Node[],
	value: boolean | undefined,
	_scope: Record<PropertyKey, any>
): (() => void) | undefined {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	const enabled = value !== false
	if (!enabled) return

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

	// Observe content size changes to auto-scroll when content grows
	const observer = new MutationObserver(() => {
		requestAnimationFrame(scrollToEnd)
	})

	element.addEventListener('scroll', onScroll)
	observer.observe(element, { childList: true, subtree: true })

	// Initial scroll to bottom - avoid as mutation observer will handle it if there is content
	//requestAnimationFrame(scrollToEnd)

	return () => {
		element.removeEventListener('scroll', onScroll)
		observer.disconnect()
	}
}
