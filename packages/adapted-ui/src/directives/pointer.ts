import { isObject } from 'mutts'

export type PointerState = {
	x: number
	y: number
	buttons: number
}

export type PointerOptions = {
	value: PointerState | undefined
}

export function pointer(target: Node | Node[], value: any, _scope: Record<PropertyKey, any>) {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	const handleMove = (e: PointerEvent) => {
		const state: PointerState = {
			x: e.offsetX,
			y: e.offsetY,
			buttons: e.buttons,
		}
		if (isObject(value) && 'value' in value) value.value = state
	}

	const handleLeave = () => {
		if (isObject(value) && 'value' in value) value.value = undefined
	}

	const handleDown = (e: PointerEvent) => {
		element.setPointerCapture(e.pointerId)
		handleMove(e)
	}

	const handleUp = (e: PointerEvent) => {
		element.releasePointerCapture(e.pointerId)
		handleMove(e)
	}

	element.addEventListener('pointermove', handleMove)
	element.addEventListener('pointerdown', handleDown)
	element.addEventListener('pointerup', handleUp)
	element.addEventListener('pointerleave', handleLeave)

	return () => {
		element.removeEventListener('pointermove', handleMove)
		element.removeEventListener('pointerdown', handleDown)
		element.removeEventListener('pointerup', handleUp)
		element.removeEventListener('pointerleave', handleLeave)
	}
}
