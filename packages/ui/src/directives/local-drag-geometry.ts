import type { LocalDragAxis, LocalDragPoint } from './local-drag'

export type LocalDragRect = Pick<
	DOMRectReadOnly,
	'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'
>

export interface LocalDragTarget<TId = unknown> {
	id: TId
	rect: LocalDragRect
}

export interface LocalDragResolvedTarget<TId = unknown> {
	targetId: TId
	targetIndex: number
	distance: number
	contained: boolean
}

export interface LocalDragCandidate<TId = unknown, TValue = unknown>
	extends LocalDragResolvedTarget<TId> {
	value: TValue
}

export type LocalDragCandidateResolver<TId, TValue> = (
	target: LocalDragTarget<TId>,
	state: LocalDragResolvedTarget<TId>
) => TValue | undefined

export type LocalDragPlacement = 'before' | 'after'

export interface LocalDragInsertion<TId = unknown> {
	targetId: TId
	targetIndex: number
	index: number
	placement: LocalDragPlacement
	distance: number
}

export function localDragAxisStart(rect: LocalDragRect, axis: LocalDragAxis): number {
	return axis === 'horizontal' ? rect.left : rect.top
}

export function localDragAxisEnd(rect: LocalDragRect, axis: LocalDragAxis): number {
	return axis === 'horizontal' ? rect.right : rect.bottom
}

export function localDragAxisSize(rect: LocalDragRect, axis: LocalDragAxis): number {
	return axis === 'horizontal' ? rect.width : rect.height
}

export function localDragPointOnAxis(point: LocalDragPoint, axis: LocalDragAxis): number {
	return axis === 'horizontal' ? point.x : point.y
}

export function localDragRectContainsPoint(rect: LocalDragRect, point: LocalDragPoint): boolean {
	return (
		point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
	)
}

export function localDragDistanceToRect(rect: LocalDragRect, point: LocalDragPoint): number {
	const dx =
		point.x < rect.left ? rect.left - point.x : point.x > rect.right ? point.x - rect.right : 0
	const dy =
		point.y < rect.top ? rect.top - point.y : point.y > rect.bottom ? point.y - rect.bottom : 0
	return Math.hypot(dx, dy)
}

export function measureLocalDragTarget<TId>(id: TId, element: Element): LocalDragTarget<TId> {
	return {
		id,
		rect: element.getBoundingClientRect(),
	}
}

export function resolveLocalDragTarget<TId>(
	targets: readonly LocalDragTarget<TId>[],
	point: LocalDragPoint
): LocalDragResolvedTarget<TId> | undefined {
	let best: LocalDragResolvedTarget<TId> | undefined
	for (const [targetIndex, target] of targets.entries()) {
		const contained = localDragRectContainsPoint(target.rect, point)
		const distance = contained ? 0 : localDragDistanceToRect(target.rect, point)
		if (
			!best ||
			(contained && !best.contained) ||
			(contained === best.contained && distance < best.distance)
		) {
			best = {
				targetId: target.id,
				targetIndex,
				distance,
				contained,
			}
		}
	}
	return best
}

export function resolveLocalDragCandidate<TId, TValue>(
	targets: readonly LocalDragTarget<TId>[],
	point: LocalDragPoint,
	resolve: LocalDragCandidateResolver<TId, TValue>
): LocalDragCandidate<TId, TValue> | undefined {
	let best: LocalDragCandidate<TId, TValue> | undefined
	for (const [targetIndex, target] of targets.entries()) {
		const state: LocalDragResolvedTarget<TId> = {
			targetId: target.id,
			targetIndex,
			distance: localDragDistanceToRect(target.rect, point),
			contained: localDragRectContainsPoint(target.rect, point),
		}
		const value = resolve(target, state)
		if (value === undefined) continue
		const candidate: LocalDragCandidate<TId, TValue> = {
			...state,
			distance: state.contained ? 0 : state.distance,
			value,
		}
		if (
			!best ||
			(candidate.contained && !best.contained) ||
			(candidate.contained === best.contained && candidate.distance < best.distance)
		) {
			best = candidate
		}
	}
	return best
}

export function resolveLocalDragSplit(
	axis: LocalDragAxis,
	point: LocalDragPoint,
	start: number,
	end: number
): number {
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
	const position = localDragPointOnAxis(point, axis)
	return Math.min(1, Math.max(0, (position - start) / (end - start)))
}

export function resolveLocalDragInsertion<TId>(
	targets: readonly LocalDragTarget<TId>[],
	point: LocalDragPoint,
	axis: LocalDragAxis
): LocalDragInsertion<TId> | undefined {
	if (targets.length === 0) return undefined
	const position = localDragPointOnAxis(point, axis)
	let best: LocalDragInsertion<TId> | undefined
	for (const [targetIndex, target] of targets.entries()) {
		const start = localDragAxisStart(target.rect, axis)
		const end = localDragAxisEnd(target.rect, axis)
		const midpoint = start + (end - start) / 2
		const placement: LocalDragPlacement = position < midpoint ? 'before' : 'after'
		const distance = Math.abs(position - midpoint)
		if (!best || distance < best.distance) {
			best = {
				targetId: target.id,
				targetIndex,
				index: placement === 'before' ? targetIndex : targetIndex + 1,
				placement,
				distance,
			}
		}
	}
	return best
}
