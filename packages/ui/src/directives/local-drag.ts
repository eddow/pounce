export type LocalDragAxis = 'horizontal' | 'vertical'

export type LocalDragSource = 'mouse' | 'pointer'

export type LocalDragStopReason = 'up' | 'buttons' | 'cancel' | 'blur' | 'hidden' | 'manual'

export type LocalDragPoint = {
	x: number
	y: number
}

export type LocalDragSnapshot<TPayload = unknown> = {
	axis: LocalDragAxis | undefined
	payload: TPayload | undefined
	grabOffset: number
	start: LocalDragPoint
	current: LocalDragPoint
	delta: LocalDragPoint
	buttons: number
	source: LocalDragSource
	pointerId: number | undefined
}

export type LocalDragMoveHandler<TPayload = unknown> = (
	snapshot: LocalDragSnapshot<TPayload>,
	event: MouseEvent | PointerEvent
) => void

export type LocalDragStopHandler<TPayload = unknown> = (
	snapshot: LocalDragSnapshot<TPayload> & {
		reason: LocalDragStopReason
		cancelled: boolean
	},
	event: Event | undefined
) => void

export type LocalDragCapturePolicy = 'none' | 'pointer'

export interface LocalDragSessionOptions<TPayload = unknown> {
	event: MouseEvent | PointerEvent
	axis?: LocalDragAxis
	payload?: TPayload
	grabOffset?: number
	capture?: LocalDragCapturePolicy
	onMove?: LocalDragMoveHandler<TPayload>
	onStop?: LocalDragStopHandler<TPayload>
}

export interface LocalDragSession<TPayload = unknown> {
	readonly snapshot: LocalDragSnapshot<TPayload>
	stop: (reason?: LocalDragStopReason) => void
}

function eventPoint(event: MouseEvent | PointerEvent): LocalDragPoint {
	return { x: event.clientX, y: event.clientY }
}

function isPointerEvent(event: MouseEvent | PointerEvent): event is PointerEvent {
	return 'pointerId' in event
}

function eventButtons(event: Event | undefined, fallback: number): number {
	if (!event || !(event instanceof MouseEvent)) return fallback
	return event.buttons
}

function releasePointerCapture(
	element: HTMLElement,
	pointerId: number | undefined,
	capture: LocalDragCapturePolicy
): void {
	if (capture !== 'pointer' || pointerId === undefined) return
	if (!element.isConnected) return
	if (!element.hasPointerCapture(pointerId)) return
	try {
		element.releasePointerCapture(pointerId)
	} catch {
		return
	}
}

export function startLocalDragSession<TPayload = unknown>(
	options: LocalDragSessionOptions<TPayload>
): LocalDragSession<TPayload> {
	const sourceEvent = options.event
	const element =
		sourceEvent.currentTarget instanceof HTMLElement
			? sourceEvent.currentTarget
			: sourceEvent.target instanceof HTMLElement
				? sourceEvent.target
				: undefined
	const ownerDocument = element?.ownerDocument ?? document
	const ownerWindow = ownerDocument.defaultView ?? window
	const source = isPointerEvent(sourceEvent) ? 'pointer' : 'mouse'
	const pointerId = isPointerEvent(sourceEvent) ? sourceEvent.pointerId : undefined
	const capture = options.capture ?? 'none'
	const snapshot: LocalDragSnapshot<TPayload> = {
		axis: options.axis,
		payload: options.payload,
		grabOffset: options.grabOffset ?? 0,
		start: eventPoint(sourceEvent),
		current: eventPoint(sourceEvent),
		delta: { x: 0, y: 0 },
		buttons: sourceEvent.buttons,
		source,
		pointerId,
	}
	let stopped = false

	const updateSnapshot = (event: MouseEvent | PointerEvent): void => {
		const current = eventPoint(event)
		snapshot.current = current
		snapshot.delta = {
			x: current.x - snapshot.start.x,
			y: current.y - snapshot.start.y,
		}
		snapshot.buttons = event.buttons
	}

	const stop = (reason: LocalDragStopReason = 'manual', event?: Event): void => {
		if (stopped) return
		stopped = true
		if (source === 'pointer') {
			ownerWindow.removeEventListener('pointermove', handlePointerMove)
			ownerWindow.removeEventListener('pointerup', handlePointerUp)
			ownerWindow.removeEventListener('pointercancel', handlePointerCancel)
		} else {
			ownerWindow.removeEventListener('mousemove', handleMouseMove)
			ownerWindow.removeEventListener('mouseup', handleMouseUp)
		}
		ownerWindow.removeEventListener('blur', handleBlur)
		ownerDocument.removeEventListener('visibilitychange', handleVisibilityChange)
		releasePointerCapture(element ?? ownerDocument.body, pointerId, capture)
		options.onStop?.(
			{
				...snapshot,
				buttons: eventButtons(event, snapshot.buttons),
				reason,
				cancelled: reason !== 'up' && reason !== 'buttons' && reason !== 'manual',
			},
			event
		)
	}

	const handleBlur = (): void => {
		stop('blur')
	}

	const handleVisibilityChange = (): void => {
		if (ownerDocument.visibilityState === 'visible') return
		stop('hidden')
	}

	const handlePointerMove = (event: PointerEvent): void => {
		if (event.pointerId !== pointerId) return
		updateSnapshot(event)
		if (event.buttons === 0) {
			stop('buttons', event)
			return
		}
		options.onMove?.(snapshot, event)
	}

	const handlePointerUp = (event: PointerEvent): void => {
		if (event.pointerId !== pointerId) return
		updateSnapshot(event)
		stop('up', event)
	}

	const handlePointerCancel = (event: PointerEvent): void => {
		if (event.pointerId !== pointerId) return
		updateSnapshot(event)
		stop('cancel', event)
	}

	const handleMouseMove = (event: MouseEvent): void => {
		updateSnapshot(event)
		if (event.buttons === 0) {
			stop('buttons', event)
			return
		}
		options.onMove?.(snapshot, event)
	}

	const handleMouseUp = (event: MouseEvent): void => {
		updateSnapshot(event)
		stop('up', event)
	}

	if (capture === 'pointer' && source === 'pointer' && element && pointerId !== undefined) {
		if (element.isConnected) {
			try {
				element.setPointerCapture(pointerId)
			} catch {
				// Ignore capture failures when the pointer source is removed during drag startup.
			}
		}
	}

	if (source === 'pointer') {
		ownerWindow.addEventListener('pointermove', handlePointerMove)
		ownerWindow.addEventListener('pointerup', handlePointerUp)
		ownerWindow.addEventListener('pointercancel', handlePointerCancel)
	} else {
		ownerWindow.addEventListener('mousemove', handleMouseMove)
		ownerWindow.addEventListener('mouseup', handleMouseUp)
	}
	ownerWindow.addEventListener('blur', handleBlur)
	ownerDocument.addEventListener('visibilitychange', handleVisibilityChange)

	return { snapshot, stop }
}
