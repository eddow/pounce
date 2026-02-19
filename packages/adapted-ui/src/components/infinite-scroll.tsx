import { componentStyle } from '@pounce/kit'
import { effect, reactive } from 'mutts'
import { getAdapter } from '../adapter/registry'
import { resize } from '../directives/resize'
import { scroll } from '../directives/scroll'
import { perf } from '../perf'

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

.pounce-infinite-scroll-item--fixed
	contain: strict
`

// ── Prefix-sum helpers (variable-height mode) ──────────────────────────

/** Binary search: find the index whose offset range contains `scrollTop`. */
function findStartIndex(offsets: Float64Array, scrollTop: number, count: number): number {
	let lo = 0
	let hi = count - 1
	while (lo < hi) {
		const mid = (lo + hi) >>> 1
		if (offsets[mid + 1] <= scrollTop) lo = mid + 1
		else hi = mid
	}
	return lo
}

/** Rebuild offsets[fromIndex+1 .. count] from heightCache. O(n-i). */
function rebuildOffsets(
	heightCache: Float64Array,
	offsets: Float64Array,
	fromIndex: number,
	count: number
) {
	for (let i = fromIndex; i < count; i++) {
		offsets[i + 1] = offsets[i] + heightCache[i]
	}
}

/** Ensure Float64Arrays are large enough, copying existing data. */
function ensureCapacity(
	heightCache: Float64Array<ArrayBuffer>,
	offsets: Float64Array<ArrayBuffer>,
	needed: number
): [Float64Array<ArrayBuffer>, Float64Array<ArrayBuffer>] {
	if (heightCache.length >= needed) return [heightCache, offsets]
	const newSize = Math.max(needed, heightCache.length * 2)
	const newHeights = new Float64Array(newSize)
	newHeights.set(heightCache)
	const newOffsets = new Float64Array(newSize + 1)
	newOffsets.set(offsets)
	return [newHeights, newOffsets]
}

// ── Props ──────────────────────────────────────────────────────────────

/** Props for {@link InfiniteScroll}. Generic over item type `T`. */
export type InfiniteScrollProps<T> = {
	/** Data array to render. */
	items: T[]
	/**
	 * Row height in pixels.
	 * - **number** — fixed height (fast path, no measurement overhead).
	 * - **function** — estimated height per item; actual heights are measured
	 *   via ResizeObserver and the offset table is corrected on the fly.
	 */
	itemHeight: number | ((item: T, index: number) => number)
	/** Scalar fallback for unmeasured items when `itemHeight` is a function. @default 40 */
	estimatedItemHeight?: number
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
 * // Fixed height (fast path)
 * <InfiniteScroll items={rows} itemHeight={40} stickyLast>
 *   {(item, i) => <div>{i}: {item.name}</div>}
 * </InfiniteScroll>
 *
 * // Variable height with estimator
 * <InfiniteScroll items={messages} itemHeight={(msg) => msg.hasImage ? 200 : 48}>
 *   {(msg) => <MessageBubble message={msg} />}
 * </InfiniteScroll>
 * ```
 *
 * Adapter key: `InfiniteScroll` (BaseAdaptation)
 */
export const InfiniteScroll = <T,>(
	props: InfiniteScrollProps<T>,
	scope: Record<string, unknown>
) => {
	Object.assign(scope, { resize, scroll })
	const adapter = getAdapter('InfiniteScroll')
	const variableMode = typeof props.itemHeight === 'function'

	const scrollState = reactive({ value: 0, max: 0 })
	const sizeState = reactive({ width: 0, height: 0 })

	// ── Variable-height offset table ──────────────────────────────────

	let heightCache = new Float64Array(256)
	let offsets = new Float64Array(257)
	let itemCount = 0
	// Reactive trigger — bumped externally (rAF) when offsets change
	const offsetTrigger = reactive({ v: 0 })
	let scrollContainerEl: HTMLElement | null = null
	let rafPending = false
	const pendingMeasurements: Array<{ index: number; height: number }> = []

	/** Estimate height for item at index (non-reactive, pure). */
	function estimateHeight(items: T[], index: number): number {
		const fn = props.itemHeight as (item: T, index: number) => number
		const item = items[index]
		return item !== undefined ? fn(item, index) : (props.estimatedItemHeight ?? 40)
	}

	/** Sync offset table with current items length. Called from computeVisible effect. */
	function syncOffsets(items: T[]) {
		const n = items.length
		if (n === itemCount) return
		;[heightCache, offsets] = ensureCapacity(heightCache, offsets, n)
		for (let i = itemCount; i < n; i++) {
			heightCache[i] = estimateHeight(items, i)
		}
		const from = Math.min(itemCount, n)
		itemCount = n
		rebuildOffsets(heightCache, offsets, from, itemCount)
	}

	/** Called when ResizeObserver measures an item. Batched via rAF. */
	function onItemMeasured(index: number, measuredHeight: number) {
		pendingMeasurements.push({ index, height: measuredHeight })
		if (!rafPending) {
			rafPending = true
			requestAnimationFrame(flushMeasurements)
		}
	}

	function flushMeasurements() {
		rafPending = false
		if (pendingMeasurements.length === 0) return
		let minChanged = itemCount
		const scrollTop = scrollState.value
		const currentStart = itemCount > 0 ? findStartIndex(offsets, scrollTop, itemCount) : 0
		let totalDeltaAbove = 0

		for (const { index, height } of pendingMeasurements) {
			if (index >= itemCount) continue
			const delta = height - heightCache[index]
			if (Math.abs(delta) < 0.5) continue
			heightCache[index] = height
			if (index < minChanged) minChanged = index
			if (index < currentStart) totalDeltaAbove += delta
		}
		pendingMeasurements.length = 0

		if (minChanged < itemCount) {
			rebuildOffsets(heightCache, offsets, minChanged, itemCount)
			// Scroll anchor correction
			if (totalDeltaAbove !== 0 && scrollContainerEl) {
				scrollContainerEl.scrollTop += totalDeltaAbove
			}
			offsetTrigger.v++
		}
		perf?.mark('infinitescroll:flush:end')
		perf?.measure('infinitescroll:flush', 'infinitescroll:flush:start', 'infinitescroll:flush:end')
	}

	// ── Visible range computation (pure function, called inline) ──────

	function computeVisibleIndices(): number[] {
		perf?.mark('infinitescroll:compute:start')
		const items = props.items
		const n = items.length
		const scrollTop = scrollState.value
		const viewportH = sizeState.height || 500
		let startNode: number
		let endNode: number

		if (variableMode) {
			void offsetTrigger.v
			syncOffsets(items)
			if (itemCount === 0) {
				startNode = 0
				endNode = 0
			} else {
				startNode = findStartIndex(offsets, scrollTop, itemCount)
				endNode = Math.min(findStartIndex(offsets, scrollTop + viewportH, itemCount) + 1, itemCount)
			}
		} else {
			const h = props.itemHeight as number
			startNode = Math.floor(scrollTop / h)
			endNode = Math.min(n, startNode + Math.ceil(viewportH / h))
		}

		const start = Math.max(0, startNode - 2)
		const end = Math.min(n, endNode + 2)
		const result: number[] = []
		for (let i = start; i < end; i++) result.push(i)
		perf?.mark('infinitescroll:compute:end')
		perf?.measure(
			'infinitescroll:compute',
			'infinitescroll:compute:start',
			'infinitescroll:compute:end'
		)
		return result
	}

	function computeTotalHeight(): number {
		perf?.mark('infinitescroll:height:start')
		let result: number
		if (variableMode) {
			void offsetTrigger.v
			syncOffsets(props.items)
			result = itemCount > 0 ? offsets[itemCount] : 0
		} else {
			result = props.items.length * (props.itemHeight as number)
		}
		perf?.mark('infinitescroll:height:end')
		perf?.measure(
			'infinitescroll:height',
			'infinitescroll:height:start',
			'infinitescroll:height:end'
		)
		return result
	}

	// ── Sticky Last Logic ──────────────────────────────────────────────

	let wasAtBottom = false
	let previousMax = 0
	let previousValue = 0

	effect(() => {
		const value = scrollState.value
		const max = scrollState.max
		const isAtBottom = max > 0 && Math.abs(value - max) < 5

		if (isAtBottom) {
			wasAtBottom = true
		} else {
			if (wasAtBottom && (props.stickyLast ?? true)) {
				if (max > previousMax && Math.abs(value - previousValue) < 1) {
					scrollState.value = max
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

	// ── Renderer unwrap ────────────────────────────────────────────────

	const getRenderer = () => {
		let child = Array.isArray(props.children) ? props.children[0] : props.children
		while (typeof child === 'function' && child.length === 0) child = (child as () => unknown)()
		return child as (item: T, index: number) => JSX.Element
	}

	// ── ResizeObserver for variable-height items ───────────────────────

	const itemObserver = variableMode
		? new ResizeObserver((entries) => {
				for (const entry of entries) {
					const el = entry.target as HTMLElement
					const idx = Number(el.dataset.vindex)
					if (!Number.isNaN(idx)) {
						const height = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight
						onItemMeasured(idx, height)
					}
				}
			})
		: null

	// ── Per-item render ────────────────────────────────────────────────

	const itemClass = adapter.classes?.item || 'pounce-infinite-scroll-item'
	const fixedItemClass = `${itemClass} pounce-infinite-scroll-item--fixed`

	const renderItem = (index: number) => {
		const item = props.items[index]
		const renderer = getRenderer()
		if (variableMode) {
			void offsetTrigger.v
			const top = offsets[index] ?? 0
			const minH = heightCache[index] ?? props.estimatedItemHeight ?? 40
			return (
				<div
					class={itemClass}
					data-vindex={index}
					style={`top: ${top}px; min-height: ${minH}px;`}
					use={(el: HTMLElement) => {
						itemObserver!.observe(el)
						return () => itemObserver!.unobserve(el)
					}}
				>
					{renderer(item, index)}
				</div>
			)
		}
		const h = props.itemHeight as number
		return (
			<div class={fixedItemClass} style={`top: ${index * h}px; height: ${h}px;`}>
				{renderer(item, index)}
			</div>
		)
	}

	// ── JSX ────────────────────────────────────────────────────────────

	return (
		<div
			class={[adapter.classes?.base || 'pounce-infinite-scroll', props.el?.class]}
			{...props.el}
			use:resize={(w: number, h: number) => {
				sizeState.width = w
				sizeState.height = h
			}}
			use:scroll={{ y: scrollState }}
			use={(el: HTMLElement) => {
				scrollContainerEl = el
			}}
		>
			<div
				class={adapter.classes?.content || 'pounce-infinite-scroll-content'}
				style={`height: ${computeTotalHeight()}px; position: relative;`}
			>
				{() => {
					perf?.mark('infinitescroll:render:start')
					const result = computeVisibleIndices().map(renderItem)
					perf?.mark('infinitescroll:render:end')
					perf?.measure(
						'infinitescroll:render',
						'infinitescroll:render:start',
						'infinitescroll:render:end'
					)
					return result
				}}
			</div>
		</div>
	)
}
