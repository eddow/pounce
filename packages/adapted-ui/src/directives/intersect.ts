export interface IntersectOptions {
	onEnter?: (entry: IntersectionObserverEntry) => void
	onLeave?: (entry: IntersectionObserverEntry) => void
	onChange?: (entry: IntersectionObserverEntry) => void
	root?: HTMLElement | null
	rootMargin?: string
	threshold?: number | number[]
}

export function intersect(
	target: Node | Node[],
	value: IntersectOptions,
	_scope: Record<PropertyKey, any>
) {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	const options = {
		root: value.root || null,
		rootMargin: value.rootMargin || '0px',
		threshold: value.threshold || 0,
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (value.onChange) value.onChange(entry)

			if (entry.isIntersecting) {
				if (value.onEnter) value.onEnter(entry)
			} else {
				if (value.onLeave) value.onLeave(entry)
			}
		})
	}, options)

	observer.observe(element)

	return () => {
		observer.disconnect()
	}
}
