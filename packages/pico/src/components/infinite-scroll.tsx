import { effect, reactive } from 'mutts'
import { compose } from '@pounce/core'
import { resize } from '../directives/resize'
import { scroll } from '../directives/scroll'
import { css } from '@pounce/toolbox/entry-dom'

css`
.pp-infinite-scroll {
	position: relative;
	overflow-y: auto;
	contain: strict;
    height: 100%;
    width: 100%;
}

.pp-infinite-scroll-content {
	position: relative;
    width: 100%;
}

.pp-infinite-scroll-item {
	position: absolute;
	left: 0;
    width: 100%;
    contain: strict;
}
`

export type InfiniteScrollProps<T> = {
	/** Array of items to render */
	items: T[]

	/** Fixed height of each item in pixels */
	itemHeight: number

	/**
	 * If true, automatically scrolls to the bottom when new items are added,
	 * but ONLY if the user was already at the bottom.
	 * Default: true
	 */
	stickyLast?: boolean

	/**
	 * Element attributes to forward to the container
	 */
	el?: JSX.GlobalHTMLAttributes

	/**
	 * Render callback for each item
	 */
	children: (item: T, index: number) => JSX.Element
}

export const InfiniteScroll = <T,>(props: InfiniteScrollProps<T>, scope: any) => {
	// Inject directives into scope
	Object.assign(scope, { resize, scroll })

	const state = compose(
		{
			stickyLast: true,
			// Viewport state
			scroll: { value: 0, max: 0 },
			size: { width: 0, height: 0 },
		},
		props
	)

	// Computed visibility
	const visibleState = reactive({
		get startNode() {
			return Math.floor(state.scroll.value / state.itemHeight)
		},
		get visibleCount() {
			// Ensure height is valid to avoid rendering issues
			// Fallback to 500px if size is not yet observed to prevent empty state
			const height = state.size.height || 500
			return Math.ceil(height / state.itemHeight)
		},
		get items() {
			const start = Math.max(0, this.startNode - 2)
			const end = Math.min(state.items.length, start + this.visibleCount + 4)
			const slice = []
			for (let i = start; i < end; i++) {
				slice.push({ item: state.items[i], index: i })
			}
			return slice
		},
		get offset() {
			// Offset the inner container to the start of the visible range
			return Math.max(0, this.startNode - 2) * state.itemHeight
		},
	})

	// Sticky Last Logic
	let wasAtBottom = false
	let previousMax = 0
	let previousValue = 0

	effect(() => {
		const value = state.scroll.value
		const max = state.scroll.max

		const isAtBottom = max > 0 && Math.abs(value - max) < 5

		if (isAtBottom) {
			wasAtBottom = true
		} else {
			// Not at bottom
			if (wasAtBottom && state.stickyLast) {
				// If max grew but value stayed the same, it implies content was added
				// and we should stick to bottom
				// Note: using loose equality/epsilon for value might be safer but strict is usually fine for "no change"
				if (max > previousMax && Math.abs(value - previousValue) < 1) {
					// Snap to new max
					// We need to do this asynchronously? No, immediate is better if possible.
					// But writing to state.scroll.value inside effect might trigger loop?
					// Yes, but next run isAtBottom will be true, so it stabilizes.
					state.scroll.value = max
				} else {
					// User scrolled up or other change
					wasAtBottom = false
				}
			} else {
				wasAtBottom = false
			}
		}

		previousMax = max
		previousValue = value
	})

	// Defensive unwrapping of children
	const getRenderer = () => {
		let child = Array.isArray(props.children) ? props.children[0] : props.children
		// Unwrap reactive thunks (length 0) but preserve callbacks (length > 0)
		while (typeof child === 'function' && child.length === 0) child = child()
		return child
	}

	return (
		<div
			class={['pp-infinite-scroll', state.el?.class]}
			{...state.el}
			use:resize={(w: number, h: number) => {
				// Unidirectional update: DOM -> State
				state.size.width = w
				state.size.height = h
			}}
			use:scroll={{ y: state.scroll }}
		>
			<div
				class="pp-infinite-scroll-content"
				style={`height: ${state.items.length * state.itemHeight}px; position: relative;`}
			>
				<div
					style={`
                        position: absolute;
                        top: ${visibleState.offset}px;
                        width: 100%;
                        left: 0;
                    `}
				>
					{() =>
						visibleState.items.map((wrapper) => {
							const { item, index } = wrapper
							const renderer = getRenderer()
							return (
								<div
									class="pp-infinite-scroll-item"
									style={`height: ${state.itemHeight}px; position: relative;`}
								>
									{renderer(item, index)}
								</div>
							)
						})
					}
				</div>
			</div>
		</div>
	)
}
