import { resolveElement } from './shared'

export type PointerState = {
	x: number
	y: number
	buttons: number
}

export type PointerBinding = { value: PointerState | undefined }

/**
 * `use:pointer` directive — tracks pointer position and button state.
 *
 * @example
 * ```tsx
 * const ptr = reactive({ value: undefined as PointerState | undefined })
 * <div use:pointer={ptr} />
 * ```
 */
export function pointer(target: Node | Node[], value: PointerBinding): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const handleMove = (e: PointerEvent) => {
		value.value = { x: e.offsetX, y: e.offsetY, buttons: e.buttons }
	}
	const handleLeave = () => {
		value.value = undefined
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
