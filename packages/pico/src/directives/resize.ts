import { biDi } from 'mutts'

function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

export function resize(target: Node | Node[], value: any, _scope: Record<PropertyKey, any>) {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	// Bi-directional binding for size
	// Reactive -> DOM
	// We handle this via biDi if value is an object with width/height properties
	let provideWidth: ((v: number) => void) | undefined
	let provideHeight: ((v: number) => void) | undefined

	if (value && typeof value === 'object' && !isFunction(value)) {
		// Setup biDi for width
		if ('width' in value) {
			provideWidth = biDi(
				(w) => {
					element.style.width = `${w}px`
				},
				() => value.width,
				(w) => {
					value.width = w
				}
			)
		}
		// Setup biDi for height
		if ('height' in value) {
			provideHeight = biDi(
				(h) => {
					element.style.height = `${h}px`
				},
				() => value.height,
				(h) => {
					value.height = h
				}
			)
		}
	}

	const observer = new ResizeObserver((entries) => {
		const entry = entries[0]
		let width: number
		let height: number

		if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
			width = Math.round(entry.borderBoxSize[0].inlineSize)
			height = Math.round(entry.borderBoxSize[0].blockSize)
		} else {
			width = Math.round(entry.contentRect.width)
			height = Math.round(entry.contentRect.height)
		}

		if (isFunction(value)) {
			// Support two shapes:
			// - callback: (w, h) => void
			// - getter: () => { width, height }
			if (value.length >= 2) value(width, height)
			else {
				const next = value()
				if (next && typeof next === 'object') {
					next.width = width
					next.height = height
				}
			}
		} else if (value && typeof value === 'object') {
			// Update reactive state from DOM change
			// Strictly check if valid change to avoid loops
			if (typeof width === 'number' && !Number.isNaN(width) && value.width !== width) {
				if (provideWidth) provideWidth(width)
				else value.width = width
			}

			if (typeof height === 'number' && !Number.isNaN(height) && value.height !== height) {
				if (provideHeight) provideHeight(height)
				else value.height = height
			}
		}
	})
	observer.observe(element)
	return () => observer.disconnect()
}
