import { atomic } from 'mutts'
import { resolveElement } from './shared'

export type ResizeValue =
	| ((width: number, height: number) => void)
	| (() => { width?: number; height?: number })
	| { width?: number; height?: number }

/**
 * `use:resize` directive — observes element size via ResizeObserver.
 *
 * Value shapes:
 * - `(w, h) => void` — callback
 * - `() => { width, height }` — getter returning a reactive object to write into
 * - `{ width, height }` — reactive object written directly
 *
 * @example
 * ```tsx
 * const size = reactive({ width: 0, height: 0 })
 * <div use:resize={size} />
 * ```
 */
export function resize(target: Node | Node[], value: ResizeValue): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const observer = new ResizeObserver(
		atomic((entries: ResizeObserverEntry[]) => {
			const entry = entries[0]
			if (!entry) return
			let width: number
			let height: number
			if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
				width = Math.round(entry.borderBoxSize[0]!.inlineSize)
				height = Math.round(entry.borderBoxSize[0]!.blockSize)
			} else {
				width = Math.round(entry.contentRect.width)
				height = Math.round(entry.contentRect.height)
			}

			if (typeof value === 'function') {
				if (value.length >= 2) {
					;(value as (w: number, h: number) => void)(width, height)
				} else {
					const next = (value as () => { width?: number; height?: number })()
					if (next && typeof next === 'object') {
						next.width = width
						next.height = height
					}
				}
			} else if (value && typeof value === 'object') {
				if (typeof width === 'number' && !Number.isNaN(width) && value.width !== width)
					value.width = width
				if (typeof height === 'number' && !Number.isNaN(height) && value.height !== height)
					value.height = height
			}
		})
	)
	observer.observe(element)
	return () => observer.disconnect()
}
