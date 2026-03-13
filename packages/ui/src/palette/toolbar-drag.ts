import {
	type LocalDragAxis,
	type LocalDragPoint,
	type LocalDragTarget,
	localDragAxisEnd,
	localDragAxisStart,
	measureLocalDragTarget,
	resolveLocalDragCandidate,
	resolveLocalDragSplit,
} from '../directives'
import type { PaletteContainerRegion } from './types'

export type PaletteToolbarSpaceDropTarget = {
	readonly kind: 'space'
	readonly region: PaletteContainerRegion
	readonly track: number
	readonly index: number
	readonly split: number
	readonly element: HTMLElement
}

export type PaletteToolbarParkDropTarget = {
	readonly kind: 'park'
	readonly element: HTMLElement
}

export type PaletteToolbarDropTarget = PaletteToolbarSpaceDropTarget | PaletteToolbarParkDropTarget

export type PaletteToolbarSpaceDropTargetId = {
	readonly kind: 'space'
	readonly region: PaletteContainerRegion
	readonly track: number
	readonly index: number
	readonly element: HTMLElement
}

export type PaletteToolbarParkDropTargetId = {
	readonly kind: 'park'
	readonly element: HTMLElement
}

export type PaletteToolbarDropTargetId =
	| PaletteToolbarSpaceDropTargetId
	| PaletteToolbarParkDropTargetId

export function isVerticalPaletteRegion(region: PaletteContainerRegion): boolean {
	return region === 'left' || region === 'right'
}

export function paletteRegionAxis(region: PaletteContainerRegion): LocalDragAxis {
	return isVerticalPaletteRegion(region) ? 'vertical' : 'horizontal'
}

export function measurePaletteToolbarDropTargets(options: {
	readonly spaceElements: Iterable<HTMLElement>
	readonly parkElements?: Iterable<HTMLElement>
}): readonly LocalDragTarget<PaletteToolbarDropTargetId>[] {
	const spaceTargets = Array.from(options.spaceElements).flatMap((element) => {
		const { region, track, index } = element.dataset
		if (region === undefined || track === undefined || index === undefined) return []
		return [
			measureLocalDragTarget(
				{
					kind: 'space' as const,
					region: region as PaletteContainerRegion,
					track: Number(track),
					index: Number(index),
					element,
				},
				element
			),
		]
	})
	const parkTargets = Array.from(options.parkElements ?? []).map((element) =>
		measureLocalDragTarget({ kind: 'park' as const, element }, element)
	)
	return [...spaceTargets, ...parkTargets]
}

export function resolvePaletteToolbarDropTarget(
	targets: readonly LocalDragTarget<PaletteToolbarDropTargetId>[],
	point: LocalDragPoint
): PaletteToolbarDropTarget | undefined {
	const candidate = resolveLocalDragCandidate(targets, point, (target, state) => {
		if (target.id.kind === 'park') return state.contained ? target.id : undefined
		const axis = paletteRegionAxis(target.id.region)
		return {
			...target.id,
			split: resolveLocalDragSplit(
				axis,
				point,
				localDragAxisStart(target.rect, axis),
				localDragAxisEnd(target.rect, axis)
			),
		}
	})
	return candidate?.value
}

export function resolvePaletteToolbarSpaceDropTarget(
	targets: readonly LocalDragTarget<PaletteToolbarDropTargetId>[],
	point: LocalDragPoint
): PaletteToolbarDropTarget | undefined {
	const candidate = resolveLocalDragCandidate(targets, point, (target, state) => {
		if (target.id.kind !== 'space' || !state.contained) return undefined
		const axis = paletteRegionAxis(target.id.region)
		return {
			...target.id,
			split: resolveLocalDragSplit(
				axis,
				point,
				localDragAxisStart(target.rect, axis),
				localDragAxisEnd(target.rect, axis)
			),
		}
	})
	return candidate?.value
}

export function samePaletteToolbarDropTarget(
	left: PaletteToolbarDropTarget | undefined,
	right: PaletteToolbarDropTarget | undefined
): boolean {
	return left?.kind === right?.kind && left?.element === right?.element
}

export function activatePaletteToolbarDropTarget(
	target: PaletteToolbarDropTarget | undefined
): void {
	if (!target) return
	if (target.kind === 'park') {
		target.element.dataset.activeParkZone = 'true'
		return
	}
	target.element.dataset.active = 'true'
}

export function clearPaletteToolbarDropTarget(target: PaletteToolbarDropTarget | undefined): void {
	if (!target) return
	if (target.kind === 'park') {
		delete target.element.dataset.activeParkZone
		return
	}
	delete target.element.dataset.active
}
