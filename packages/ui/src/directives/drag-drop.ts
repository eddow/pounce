import { resolveElement } from './shared'

// Internal shared state to hold the payload being dragged
let activeDragPayload: any

export interface DragOptions {
	payload: any | (() => any)
	onStart?: (payload: any) => void
	onEnd?: (payload: any) => void
}

export function drag(
	target: Node | Node[],
	value: any | (() => any) | DragOptions
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	element.setAttribute('draggable', 'true')

	let options: DragOptions =
		value && typeof value === 'object' && 'payload' in value
			? (value as DragOptions)
			: { payload: value }

	const onDragStart = () => {
		const payload = typeof options.payload === 'function' ? options.payload() : options.payload
		activeDragPayload = payload
		if (options.onStart) {
			options.onStart(payload)
		}
	}

	const onDragEnd = () => {
		const payload = activeDragPayload
		activeDragPayload = undefined
		if (options.onEnd) {
			options.onEnd(payload)
		}
	}

	element.addEventListener('dragstart', onDragStart)
	element.addEventListener('dragend', onDragEnd)

	return () => {
		element.removeEventListener('dragstart', onDragStart)
		element.removeEventListener('dragend', onDragEnd)
		element.removeAttribute('draggable')
	}
}

export function drop(
	target: Node | Node[],
	value: (payload: any) => void
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const onDragOver = (e: DragEvent) => {
		if (activeDragPayload !== undefined) {
			e.preventDefault()
		}
	}

	const onDrop = (e: DragEvent) => {
		if (activeDragPayload !== undefined) {
			e.preventDefault()
			e.stopPropagation()
			value(activeDragPayload)
		}
	}

	element.addEventListener('dragover', onDragOver)
	element.addEventListener('drop', onDrop)

	return () => {
		element.removeEventListener('dragover', onDragOver)
		element.removeEventListener('drop', onDrop)
	}
}

export type DraggingCallback = (
	payload: any,
	isEnter: boolean,
	element: HTMLElement
) => boolean | (() => void) | void

export function dragging(target: Node | Node[], value: DraggingCallback): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	let enterCount = 0
	let isAccepted = false
	// We store the cleanup returned by the callback (if any)
	let activeCleanup: (() => void) | void

	const handleDragEnter = (e: DragEvent) => {
		if (activeDragPayload === undefined) return

		enterCount++

		if (enterCount === 1) {
			const result = value(activeDragPayload, true, element)
			if (result === false) {
				isAccepted = false
			} else {
				isAccepted = true
				if (typeof result === 'function') {
					activeCleanup = result
				}
			}
		}

		if (isAccepted) {
			e.preventDefault()
		}
	}

	const handleDragOver = (e: DragEvent) => {
		if (activeDragPayload === undefined) return

		if (isAccepted) {
			// Must preventDefault on dragover to indicate we are a valid drop target
			e.preventDefault()
			// We can also set dropEffect to indicate visually what will happen
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move' // Common for our use cases, but could be configurable if needed eventually
			}
		}
	}

	const handleDragLeave = (_e: DragEvent) => {
		if (activeDragPayload === undefined) return

		enterCount--

		if (enterCount === 0) {
			if (isAccepted) {
				if (typeof activeCleanup === 'function') {
					activeCleanup()
				} else {
					value(activeDragPayload, false, element)
				}
				activeCleanup = undefined
			}
			isAccepted = false
		}
	}

	const handleDrop = (_e: DragEvent) => {
		if (activeDragPayload === undefined) return

		// Treat drop as a leave for styling/cleanup purposes
		enterCount = 0
		if (isAccepted) {
			if (typeof activeCleanup === 'function') {
				activeCleanup()
			} else {
				value(activeDragPayload, false, element)
			}
			activeCleanup = undefined
		}
		isAccepted = false

		// (The actual drop execution is handled by the `drop` directive)
	}

	element.addEventListener('dragenter', handleDragEnter)
	element.addEventListener('dragover', handleDragOver)
	element.addEventListener('dragleave', handleDragLeave)
	element.addEventListener('drop', handleDrop)

	return () => {
		element.removeEventListener('dragenter', handleDragEnter)
		element.removeEventListener('dragover', handleDragOver)
		element.removeEventListener('dragleave', handleDragLeave)
		element.removeEventListener('drop', handleDrop)
	}
}
