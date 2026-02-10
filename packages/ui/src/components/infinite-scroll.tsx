import { effect, reactive } from 'mutts'
import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { resize } from '../directives/resize'
import { scroll } from '../directives/scroll'
import { getAdapter } from '../adapter/registry'

componentStyle.sass`
.pounce-infinite-scroll
	position: relative
	overflow-y: auto
	contain: strict
	height: 100%
	width: 100%

.pounce-infinite-scroll-content
	position: relative
	width: 100%

.pounce-infinite-scroll-item
	position: absolute
	left: 0
	width: 100%
	contain: strict
`

/** Props for {@link InfiniteScroll}. Generic over item type `T`. */
export type InfiniteScrollProps<T> = {
	/** Data array to render. */
	items: T[]
	/** Fixed row height in pixels — required for virtualization math. */
	itemHeight: number
	/** Auto-scroll to bottom when new items are appended. @default true */
	stickyLast?: boolean
	/** Pass-through HTML attributes for the scroll container. */
	el?: JSX.GlobalHTMLAttributes
	/** Row renderer — receives item and its index. */
	children: (item: T, index: number) => JSX.Element
}

/**
 * Virtualized scrollable list — renders only visible items plus a small buffer.
 *
 * Uses `resize` and `scroll` directives internally.
 *
 * @example
 * ```tsx
 * <InfiniteScroll items={rows} itemHeight={40} stickyLast>
 *   {(item, i) => <div>{i}: {item.name}</div>}
 * </InfiniteScroll>
 * ```
 *
 * Adapter key: `InfiniteScroll` (BaseAdaptation)
 */
export const InfiniteScroll = <T,>(props: InfiniteScrollProps<T>, scope: Record<string, unknown>) => {
	Object.assign(scope, { resize, scroll })
	const adapter = getAdapter('InfiniteScroll')

	const state = compose(
		{
			stickyLast: true,
			scroll: { value: 0, max: 0 },
			size: { width: 0, height: 0 },
		},
		props
	)

	const visibleState = reactive({
		get startNode() {
			return Math.floor(state.scroll.value / state.itemHeight)
		},
		get visibleCount() {
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
			if (wasAtBottom && state.stickyLast) {
				if (max > previousMax && Math.abs(value - previousValue) < 1) {
					state.scroll.value = max
				} else {
					wasAtBottom = false
				}
			} else {
				wasAtBottom = false
			}
		}
		previousMax = max
		previousValue = value
	})

	const getRenderer = () => {
		let child = Array.isArray(props.children) ? props.children[0] : props.children
		while (typeof child === 'function' && child.length === 0) child = (child as () => unknown)()
		return child as (item: T, index: number) => JSX.Element
	}

	return (
		<div
			class={[adapter.classes?.base || 'pounce-infinite-scroll', state.el?.class]}
			{...state.el}
			use:resize={(w: number, h: number) => {
				state.size.width = w
				state.size.height = h
			}}
			use:scroll={{ y: state.scroll }}
		>
			<div
				class={adapter.classes?.content || 'pounce-infinite-scroll-content'}
				style={`height: ${state.items.length * state.itemHeight}px; position: relative;`}
			>
				<div
					style={`position: absolute; top: ${visibleState.offset}px; width: 100%; left: 0;`}
				>
					{() =>
						visibleState.items.map((wrapper) => {
							const { item, index } = wrapper
							const renderer = getRenderer()
							return (
								<div
									class={adapter.classes?.item || 'pounce-infinite-scroll-item'}
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
