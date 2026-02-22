import { resolveElement } from './shared'

export type IntersectOptions = {
	onEnter?: (entry: IntersectionObserverEntry) => void
	onLeave?: (entry: IntersectionObserverEntry) => void
	onChange?: (entry: IntersectionObserverEntry) => void
	root?: HTMLElement | null
	rootMargin?: string
	threshold?: number | number[]
}

/**
 * `use:intersect` directive — IntersectionObserver wrapper.
 *
 * @example
 * ```tsx
 * <div use:intersect={{ onEnter: () => load() }} />
 * ```
 */
export function intersect(
	target: Node | Node[],
	value: IntersectOptions
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				value.onChange?.(entry)
				if (entry.isIntersecting) value.onEnter?.(entry)
				else value.onLeave?.(entry)
			}
		},
		{
			root: value.root ?? null,
			rootMargin: value.rootMargin ?? '0px',
			threshold: value.threshold ?? 0,
		}
	)
	observer.observe(element)
	return () => observer.disconnect()
}
