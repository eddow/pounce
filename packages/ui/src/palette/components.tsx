import { rootEnv } from '@sursaut/core'
import { effect } from 'mutts'
import {
	localDragAxisEnd,
	localDragAxisStart,
	measureLocalDragTarget,
	resolveLocalDragCandidate,
	resolveLocalDragSplit,
	startLocalDragSession,
} from '../directives'
import type { ArrangedOrientation } from '../shared/types'
import { arranged } from '../shared/utils'
import {
	isEditableTool,
	isEditing,
	isRunTool,
	PaletteError,
	palettes,
	paletteTool,
	resolvePaletteEditor,
} from './palette'
import type {
	Palette,
	PaletteBorder,
	PaletteRegion,
	PaletteScope,
	PaletteToolbar,
	PaletteTrack,
} from './types'

type PaletteTrackSpace = {
	border: PaletteBorder
	direction: ArrangedOrientation
	index: number
	region: PaletteRegion
	track: PaletteTrack
	trackIndex: number
}

type PaletteStackSpace = {
	border: PaletteBorder
	direction: ArrangedOrientation
	index: number
	region: PaletteRegion
}

type PaletteTrackDragTarget = PaletteTrackSpace & {
	contained: boolean
	element: HTMLElement
	kind: 'track-space'
	split: number
}

type PaletteStackDragTarget = PaletteStackSpace & {
	contained: boolean
	element: HTMLElement
	kind: 'stack-space'
}

type PaletteDragTarget = PaletteTrackDragTarget | PaletteStackDragTarget

type PaletteToolbarDrag = {
	border: PaletteBorder
	direction: ArrangedOrientation
	palette: Palette
	region: PaletteRegion
	toolbar: PaletteToolbar
	track: PaletteTrack
	trackIndex: number
}

function clampUnit(value: number): number {
	return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	)
		return true
	return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function dragAxis(direction: ArrangedOrientation): 'horizontal' | 'vertical' {
	return direction === 'horizontal' ? 'horizontal' : 'vertical'
}

function rectContainsPoint(
	rect: Pick<DOMRectReadOnly, 'left' | 'right' | 'top' | 'bottom'>,
	point: {
		x: number
		y: number
	}
): boolean {
	return (
		point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
	)
}

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
	return Math.hypot(a.x - b.x, a.y - b.y)
}

function rectDistanceToPoint(
	rect: Pick<DOMRectReadOnly, 'left' | 'right' | 'top' | 'bottom'>,
	point: { x: number; y: number }
): number {
	const dx =
		point.x < rect.left ? rect.left - point.x : point.x > rect.right ? point.x - rect.right : 0
	const dy =
		point.y < rect.top ? rect.top - point.y : point.y > rect.bottom ? point.y - rect.bottom : 0
	return Math.hypot(dx, dy)
}

function expandStackSpaceRect(
	rect: Pick<DOMRectReadOnly, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>,
	direction: ArrangedOrientation
): Pick<DOMRectReadOnly, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'> {
	const halo = 12
	return direction === 'horizontal'
		? {
				left: rect.left,
				right: rect.right,
				top: rect.top - halo,
				bottom: rect.bottom + halo,
				width: rect.width,
				height: rect.height + halo * 2,
			}
		: {
				left: rect.left - halo,
				right: rect.right + halo,
				top: rect.top,
				bottom: rect.bottom,
				width: rect.width + halo * 2,
				height: rect.height,
			}
}

function actualTrackSpaceAt(track: PaletteTrack, index: number): number {
	return index < track.length
		? clampUnit(track[index].space)
		: index === track.length
			? clampUnit(track.reduce((remaining, slot) => remaining - slot.space, 1))
			: 0
}

function actualTrackSpaces(track: PaletteTrack): number[] {
	const spaces = track.map((slot) => clampUnit(slot.space))
	const trailing = clampUnit(1 - spaces.reduce((sum, space) => sum + space, 0))
	return [...spaces, trailing]
}

function applyTrackSpaces(track: PaletteTrack, spaces: readonly number[]): void {
	for (let index = 0; index < track.length; index += 1)
		track[index].space = clampUnit(spaces[index] ?? 0)
}

function removeToolbar(track: PaletteTrack, toolbar: PaletteToolbar): number {
	const index = track.findIndex((slot) => slot.toolbar === toolbar)
	if (index < 0) return -1
	const spaces = actualTrackSpaces(track)
	const merged = (spaces[index] ?? 0) + (spaces[index + 1] ?? 0)
	spaces.splice(index, 2, merged)
	track.splice(index, 1)
	applyTrackSpaces(track, spaces)
	return index
}

function removeToolbarFromBorder(
	border: PaletteBorder,
	track: PaletteTrack,
	toolbar: PaletteToolbar
): { index: number; removedTrack: boolean; trackIndex: number } | undefined {
	const trackIndex = border.indexOf(track)
	if (trackIndex < 0) return undefined
	const index = removeToolbar(track, toolbar)
	if (index < 0) return undefined
	if (track.length > 0) return { index, removedTrack: false, trackIndex }
	border.splice(trackIndex, 1)
	return { index, removedTrack: true, trackIndex }
}

function removeToolbarFromDragTrack(
	dragging: PaletteDragging,
	toolbar: PaletteToolbar
): { index: number; removedTrack: boolean; trackIndex: number } | undefined {
	const trackIndex = dragging.border.indexOf(dragging.track)
	if (trackIndex < 0) return undefined
	const index = removeToolbar(dragging.track, toolbar)
	if (index < 0) return undefined
	if (dragging.track.length > 0) return { index, removedTrack: false, trackIndex }
	const isSessionCreated = dragging.createdTracks.includes(dragging.track)
	dragging.border.splice(trackIndex, 1)
	if (isSessionCreated) {
		const createdIndex = dragging.createdTracks.indexOf(dragging.track)
		if (createdIndex >= 0) dragging.createdTracks.splice(createdIndex, 1)
	}
	return { index, removedTrack: true, trackIndex }
}

function removeEmptyTrack(border: PaletteBorder, track: PaletteTrack): void {
	if (track.length > 0) return
	const trackIndex = border.indexOf(track)
	if (trackIndex < 0) return
	border.splice(trackIndex, 1)
}

function collapseDeferredSourceTrack(dragging: PaletteDragging | undefined): void {
	if (!dragging?.sourceTrackWasSingleton) return
	removeEmptyTrack(dragging.sourceBorder, dragging.sourceTrack)
	for (const track of [...dragging.createdTracks]) removeEmptyTrack(dragging.border, track)
}

function insertTrackWithToolbar(
	border: PaletteBorder,
	index: number,
	toolbar: PaletteToolbar
): { track: PaletteTrack; trackIndex: number } {
	const trackIndex = Math.min(Math.max(index, 0), border.length)
	const track: PaletteTrack = [{ space: 0, toolbar }]
	border.splice(trackIndex, 0, track)
	return { track, trackIndex }
}

function insertToolbar(
	track: PaletteTrack,
	index: number,
	toolbar: PaletteToolbar,
	split: number
): void {
	const insertionIndex = Math.min(Math.max(index, 0), track.length)
	const spaces = actualTrackSpaces(track)
	const merged = spaces[insertionIndex] ?? 0
	const before = merged * clampUnit(split)
	const after = merged - before
	spaces.splice(insertionIndex, 1, before, after)
	track.splice(insertionIndex, 0, { space: 0, toolbar })
	applyTrackSpaces(track, spaces)
}

function resizeToolbar(track: PaletteTrack, index: number, split: number): void {
	if (index < 0 || index >= track.length) return
	const spaces = actualTrackSpaces(track)
	const merged = (spaces[index] ?? 0) + (spaces[index + 1] ?? 0)
	const before = merged * clampUnit(split)
	const after = merged - before
	spaces.splice(index, 2, before, after)
	applyTrackSpaces(track, spaces)
}

function resizeToolbarFromPointer(
	track: PaletteTrack,
	index: number,
	direction: ArrangedOrientation,
	point: { x: number; y: number },
	grabOffset: number,
	toolbarSpan: number
): void {
	const beforeSpace = trackSpaceElement(track, index)
	const afterSpace = trackSpaceElement(track, index + 1)
	if (!beforeSpace || !afterSpace) return
	if (direction === 'vertical') {
		const start = beforeSpace.getBoundingClientRect().top
		const end = afterSpace.getBoundingClientRect().bottom
		if (end <= start) return
		const available = end - start - toolbarSpan
		if (available <= 0) return
		const toolbarStart = Math.min(Math.max(point.y - grabOffset, start), end - toolbarSpan)
		const split = clampUnit((toolbarStart - start) / available)
		resizeToolbar(track, index, split)
		return
	}
	const start = beforeSpace.getBoundingClientRect().left
	const end = afterSpace.getBoundingClientRect().right
	if (end <= start) return
	const available = end - start - toolbarSpan
	if (available <= 0) return
	const toolbarStart = Math.min(Math.max(point.x - grabOffset, start), end - toolbarSpan)
	const split = clampUnit((toolbarStart - start) / available)
	resizeToolbar(track, index, split)
}

const trackSpaces = new Set<HTMLElement>()
const trackSpaceMeta = new WeakMap<HTMLElement, PaletteTrackSpace>()
const stackSpaces = new Set<HTMLElement>()
const stackSpaceMeta = new WeakMap<HTMLElement, PaletteStackSpace>()

function trackSpaceTargets() {
	return Array.from(trackSpaces).flatMap((element) => {
		if (!element.isConnected) {
			trackSpaces.delete(element)
			return []
		}
		const target = trackSpaceMeta.get(element)
		if (!target) return []
		return [measureLocalDragTarget({ ...target, kind: 'track-space' as const, element }, element)]
	})
}

function stackSpaceTargets() {
	return Array.from(stackSpaces).flatMap((element) => {
		if (!element.isConnected) {
			stackSpaces.delete(element)
			return []
		}
		const target = stackSpaceMeta.get(element)
		if (!target) return []
		return [measureLocalDragTarget({ ...target, kind: 'stack-space' as const, element }, element)]
	})
}

function trackSpaceElement(track: PaletteTrack, index: number): HTMLElement | undefined {
	for (const element of trackSpaces) {
		if (!element.isConnected) continue
		const target = trackSpaceMeta.get(element)
		if (!target) continue
		if (target.track !== track) continue
		if (target.index !== index) continue
		return element
	}
	return undefined
}

function resolveTrackSpaceTarget(point: {
	x: number
	y: number
}): PaletteTrackDragTarget | undefined {
	return resolveLocalDragCandidate(trackSpaceTargets(), point, (target, state) => {
		const axis = dragAxis(target.id.direction)
		return {
			contained: state.contained,
			...target.id,
			split: resolveLocalDragSplit(
				axis,
				point,
				localDragAxisStart(target.rect, axis),
				localDragAxisEnd(target.rect, axis)
			),
		}
	})?.value
}

function resolveStackSpaceTarget(point: {
	x: number
	y: number
}): PaletteStackDragTarget | undefined {
	let best:
		| {
				distance: number
				value: PaletteStackDragTarget
		  }
		| undefined
	for (const target of stackSpaceTargets()) {
		const proximityRect = expandStackSpaceRect(target.rect, target.id.direction)
		const proximityDistance = rectDistanceToPoint(proximityRect, point)
		if (!rectContainsPoint(proximityRect, point) && proximityDistance > 0) continue
		const candidate: PaletteStackDragTarget = {
			contained: rectContainsPoint(target.rect, point),
			...target.id,
		}
		if (!best || proximityDistance < best.distance)
			best = { distance: proximityDistance, value: candidate }
	}
	return best?.value
}

function resolvePaletteTarget(point: { x: number; y: number }): PaletteDragTarget | undefined {
	const trackTarget = resolveTrackSpaceTarget(point)
	const stackTarget = resolveStackSpaceTarget(point)
	if (!trackTarget) return stackTarget
	if (!stackTarget) return trackTarget
	if (trackTarget.contained && !stackTarget.contained) return trackTarget
	if (stackTarget.contained && !trackTarget.contained) return stackTarget
	return trackTarget
}

function setTargetState(
	target: PaletteDragTarget | undefined,
	state: { active?: boolean; proximity?: boolean }
): void {
	if (!target) return
	if (state.active) target.element.dataset.active = 'true'
	else delete target.element.dataset.active
	if (state.proximity) target.element.dataset.proximity = 'true'
	else delete target.element.dataset.proximity
}

type PaletteDragging = NonNullable<typeof palettes.dragging>

function isIgnoredDropZone(target: PaletteTrackSpace, dragged: PaletteDragging): boolean {
	if (target.track !== dragged.track) return false
	const { index } = dragged
	if (index < 0) return false
	return target.index === index || target.index === index + 1
}

function isIgnoredStackSpace(
	target: PaletteStackSpace,
	point: { x: number; y: number },
	origin: {
		border: PaletteBorder
		sourceRegion?: PaletteRegion
		sourceTrackWasSingleton?: boolean
		start: { x: number; y: number }
		region: PaletteRegion
		trackIndex: number
	}
): boolean {
	const originRegion = origin.sourceRegion ?? origin.region
	if (target.border !== origin.border || target.region !== originRegion) return false
	if (origin.sourceTrackWasSingleton)
		return target.index === origin.trackIndex || target.index === origin.trackIndex + 1
	if (pointDistance(origin.start, point) > 12) return false
	return target.index === origin.trackIndex || target.index === origin.trackIndex + 1
}

function moveToolbarToTrack(
	dragging: PaletteDragging,
	target: PaletteToolbarDrag,
	reorderTarget: PaletteTrackDragTarget
): PaletteDragging | undefined {
	const removal = removeToolbarFromDragTrack(dragging, target.toolbar)
	if (!removal) return undefined
	const targetTrackIndex =
		dragging.border === reorderTarget.border &&
		dragging.track === reorderTarget.track &&
		reorderTarget.trackIndex === removal.trackIndex &&
		reorderTarget.index > removal.index
			? reorderTarget.index - 1
			: reorderTarget.index
	insertToolbar(reorderTarget.track, targetTrackIndex, target.toolbar, reorderTarget.split)
	return {
		border: reorderTarget.border,
		createdTracks: dragging.createdTracks,
		index: targetTrackIndex,
		palette: target.palette,
		region: reorderTarget.region,
		sourceBorder: reorderTarget.border,
		sourceRegion: reorderTarget.region,
		sourceTrack: reorderTarget.track,
		sourceTrackIndex: reorderTarget.trackIndex,
		sourceTrackWasSingleton: reorderTarget.track.length === 1,
		toolbar: target.toolbar,
		track: reorderTarget.track,
		trackIndex: reorderTarget.trackIndex,
	}
}

function moveToolbarToStack(
	dragging: PaletteDragging,
	target: PaletteToolbarDrag,
	stackTarget: PaletteStackDragTarget
): PaletteDragging | undefined {
	const removal = removeToolbarFromDragTrack(dragging, target.toolbar)
	if (!removal) return undefined
	const targetTrackIndex =
		dragging.border === stackTarget.border && stackTarget.index > removal.trackIndex
			? stackTarget.index - 1
			: stackTarget.index
	const insertion = insertTrackWithToolbar(stackTarget.border, targetTrackIndex, target.toolbar)
	dragging.createdTracks.push(insertion.track)
	return {
		border: stackTarget.border,
		createdTracks: dragging.createdTracks,
		index: 0,
		palette: target.palette,
		region: stackTarget.region,
		sourceBorder: stackTarget.border,
		sourceRegion: stackTarget.region,
		sourceTrack: insertion.track,
		sourceTrackIndex: insertion.trackIndex,
		sourceTrackWasSingleton: true,
		toolbar: target.toolbar,
		track: insertion.track,
		trackIndex: insertion.trackIndex,
	}
}

function setPaletteRootClass(
	element: HTMLElement | null | undefined,
	name: string,
	enabled: boolean
): void {
	if (!element) return
	element.classList.toggle(name, enabled)
}

function setPaletteRootData(
	element: HTMLElement | null | undefined,
	name: string,
	enabled: boolean
): void {
	if (!element) return
	if (enabled) element.dataset[name] = 'true'
	else delete element.dataset[name]
}

Object.assign(rootEnv, {
	paletteRoot(element: HTMLElement, palette: Palette): (() => void) | undefined {
		if (!element.hasAttribute('tabindex')) {
			element.tabIndex = 0
		}
		const stopEditing = effect`palette.root.editing`(() => {
			const editing = isEditing(palette)
			setPaletteRootClass(element, 'palette-editing', editing)
			setPaletteRootData(element, 'editing', editing)
		})
		const stopDragging = effect`palette.root.dragging`(() => {
			const dragging = isEditing(palette) && !!palettes.dragging
			setPaletteRootClass(element, 'palette-dragging', dragging)
			setPaletteRootData(element, 'dragging', dragging)
		})

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return
			if (isEditableTarget(event.target)) return
			const toolId = palette.keys.resolve(event)
			if (!toolId) return
			event.preventDefault()
			event.stopPropagation()
			const tool = paletteTool(palette, toolId)
			if (isRunTool(tool)) {
				if (tool.can) tool.run()
			} else if (isEditableTool(tool) && tool.type === 'boolean') tool.value = !tool.value
			else throw new PaletteError(`Palette binding "${toolId}" did not resolve to a runnable tool`)
		}

		element.addEventListener('keydown', onKeyDown)
		return () => {
			stopEditing()
			stopDragging()
			element.removeEventListener('keydown', onKeyDown)
		}
	},
	paletteTrackSpace(element: HTMLElement, target: PaletteTrackSpace): (() => void) | undefined {
		trackSpaces.add(element)
		trackSpaceMeta.set(element, target)
		return () => {
			delete element.dataset.active
			delete element.dataset.proximity
			trackSpaces.delete(element)
		}
	},
	paletteStackSpace(element: HTMLElement, target: PaletteStackSpace): (() => void) | undefined {
		stackSpaces.add(element)
		stackSpaceMeta.set(element, target)
		return () => {
			delete element.dataset.active
			delete element.dataset.proximity
			stackSpaces.delete(element)
		}
	},
	paletteToolbarDrag(element: HTMLElement, target: PaletteToolbarDrag): (() => void) | undefined {
		let originRect: DOMRectReadOnly | undefined
		let dragStart: { x: number; y: number } | undefined
		let proximityTargets: PaletteDragTarget[] = []
		const handleMove = (
			snapshot: { current: { x: number; y: number } },
			activeTarget: PaletteDragTarget | undefined,
			grabOffset: number,
			toolbarSpan: number
		) => {
			if (!palettes.dragging) return activeTarget
			const dragging = palettes.dragging
			const currentTrack = dragging.track
			const currentIndex = dragging.index
			if (currentIndex < 0) return activeTarget
			const nextTrackTarget = resolveTrackSpaceTarget(snapshot.current)
			const trackTarget =
				nextTrackTarget && !isIgnoredDropZone(nextTrackTarget, dragging)
					? nextTrackTarget
					: undefined
			const nextStackTarget = resolveStackSpaceTarget(snapshot.current)
			const stackTarget =
				nextStackTarget &&
				!(
					originRect &&
					isIgnoredStackSpace(nextStackTarget, snapshot.current, {
						border: dragging.sourceBorder,
						sourceRegion: dragging.sourceRegion,
						sourceTrackWasSingleton: dragging.sourceTrackWasSingleton,
						start: dragStart ?? snapshot.current,
						region: dragging.sourceRegion,
						trackIndex: dragging.sourceTrackIndex,
					})
				)
					? nextStackTarget
					: undefined
			const resolvedTarget = !trackTarget
				? stackTarget
				: !stackTarget
					? trackTarget
					: stackTarget.contained
						? stackTarget
						: trackTarget.contained
							? trackTarget
							: trackTarget
			for (const proximityTarget of proximityTargets) {
				if (proximityTarget.element === resolvedTarget?.element) continue
				if (proximityTarget.element === trackTarget?.element) continue
				if (proximityTarget.element === stackTarget?.element) continue
				setTargetState(proximityTarget, {})
			}
			proximityTargets = [trackTarget, stackTarget].filter(
				(candidate): candidate is PaletteDragTarget => Boolean(candidate)
			)
			if (activeTarget?.element !== resolvedTarget?.element) {
				setTargetState(activeTarget, {})
				activeTarget = resolvedTarget
			}
			for (const proximityTarget of proximityTargets) {
				setTargetState(proximityTarget, {
					active: proximityTarget.element === resolvedTarget?.element && proximityTarget.contained,
					proximity: true,
				})
			}
			if (!resolvedTarget?.contained) {
				resizeToolbarFromPointer(
					currentTrack,
					currentIndex,
					target.direction,
					snapshot.current,
					grabOffset,
					toolbarSpan
				)
				return activeTarget
			}
			if (
				resolvedTarget.kind === 'track-space' &&
				resolvedTarget.track === currentTrack &&
				(resolvedTarget.index === currentIndex || resolvedTarget.index === currentIndex + 1)
			) {
				resizeToolbarFromPointer(
					currentTrack,
					currentIndex,
					target.direction,
					snapshot.current,
					grabOffset,
					toolbarSpan
				)
				return activeTarget
			}
			const nextDragging =
				resolvedTarget.kind === 'track-space'
					? moveToolbarToTrack(dragging, target, resolvedTarget)
					: moveToolbarToStack(dragging, target, resolvedTarget)
			if (!nextDragging) return activeTarget
			palettes.dragging = nextDragging
			if (resolvedTarget.kind === 'track-space') {
				resizeToolbarFromPointer(
					nextDragging.track,
					nextDragging.index,
					target.direction,
					snapshot.current,
					grabOffset,
					toolbarSpan
				)
			}
			return activeTarget
		}

		const onPointerDown = (event: PointerEvent) => {
			if (!isEditing(target.palette)) return
			if (event.button !== 0) return
			if (isEditableTarget(event.target)) return
			event.preventDefault()
			const rect = element.getBoundingClientRect()
			originRect = rect
			dragStart = { x: event.clientX, y: event.clientY }
			const grabOffset =
				target.direction === 'vertical' ? event.clientY - rect.top : event.clientX - rect.left
			const toolbarSpan = target.direction === 'vertical' ? rect.height : rect.width
			let activeTarget: PaletteDragTarget | undefined
			const index = target.track.findIndex((slot) => slot.toolbar === target.toolbar)
			if (index < 0) return
			palettes.dragging = {
				border: target.border,
				createdTracks: [],
				index,
				palette: target.palette,
				region: target.region,
				sourceBorder: target.border,
				sourceRegion: target.region,
				sourceTrack: target.track,
				sourceTrackIndex: target.trackIndex,
				sourceTrackWasSingleton: target.track.length === 1,
				toolbar: target.toolbar,
				track: target.track,
				trackIndex: target.trackIndex,
			}
			startLocalDragSession({
				event,
				axis: dragAxis(target.direction),
				capture: 'pointer',
				onMove(snapshot) {
					activeTarget = handleMove(snapshot, activeTarget, grabOffset, toolbarSpan)
				},
				onStop() {
					setTargetState(activeTarget, {})
					for (const proximityTarget of proximityTargets) setTargetState(proximityTarget, {})
					proximityTargets = []
					activeTarget = undefined
					dragStart = undefined
					if (palettes.dragging?.palette === target.palette) {
						collapseDeferredSourceTrack(palettes.dragging)
						delete palettes.dragging
					}
				},
			})
			activeTarget = handleMove(
				{ current: { x: event.clientX, y: event.clientY } },
				activeTarget,
				grabOffset,
				toolbarSpan
			)
		}

		element.addEventListener('pointerdown', onPointerDown)
		return () => {
			if (palettes.dragging?.palette === target.palette) delete palettes.dragging
			element.removeEventListener('pointerdown', onPointerDown)
		}
	},
})

export function Toolbar(
	props: {
		border?: PaletteBorder
		region?: PaletteRegion
		toolbar: PaletteToolbar
		track?: PaletteTrack
		trackIndex?: number
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	const { palette } = scope
	if (!palette) throw new Error('No palette to expose')
	const o = arranged(scope, { density: 'compact' })
	return (
		<div
			{...props.el}
			class={['toolbar', o.class, props.el?.class]}
			use:paletteToolbarDrag={
				props.track
					? {
							border: props.border,
							direction: props.direction,
							palette,
							region: props.region,
							toolbar: props.toolbar,
							track: props.track,
							trackIndex: props.trackIndex,
						}
					: undefined
			}
		>
			<for each={props.toolbar.items}>
				{(item) => {
					const tool = paletteTool(palette, item.tool)
					const spec = resolvePaletteEditor(palette, item, tool)
					if (spec) {
						const Editor = spec.editor
						return <Editor item={item} tool={tool} scope={scope} flags={spec.flags ?? {}} />
					}
					if (palette.editor) return palette.editor(item, tool, scope)
					throw new PaletteError(`No editor available for palette tool "${item.tool}"`)
				}}
			</for>
		</div>
	)
}

export function DropZone(
	props: {
		border: PaletteBorder
		space: number
		region: PaletteRegion
		track: PaletteTrack
		index: number
		trackIndex: number
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
	},
	_scope: PaletteScope
) {
	return (
		<div
			{...props.el}
			class={['toolbar-track-space', props.el?.class]}
			use:paletteTrackSpace={{
				border: props.border,
				direction: props.direction,
				index: props.index,
				region: props.region,
				track: props.track,
				trackIndex: props.trackIndex,
			}}
			style={{ flexBasis: `${props.space * 100}%`, flexGrow: `${Math.max(props.space, 0.0001)}` }}
		/>
	)
}

export function StackDropZone(
	props: {
		border: PaletteBorder
		direction: ArrangedOrientation
		index: number
		region: PaletteRegion
		el?: JSX.IntrinsicElements['div']
	},
	_scope: PaletteScope
) {
	return (
		<div
			{...props.el}
			class={['toolbar-stack-space', 'toolbar-drop-zone', props.el?.class]}
			use:paletteStackSpace={{
				border: props.border,
				direction: props.direction,
				index: props.index,
				region: props.region,
			}}
		/>
	)
}

export function ToolbarTrack(
	props: {
		border: PaletteBorder
		region: PaletteRegion
		track: PaletteTrack
		trackIndex: number
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
		space?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	arranged(scope, { orientation: props.direction })
	return (
		<div {...props.el} class={['toolbar-track', props.el?.class]}>
			<DropZone
				border={props.border}
				region={props.region}
				space={actualTrackSpaceAt(props.track, 0)}
				track={props.track}
				index={0}
				trackIndex={props.trackIndex}
				direction={props.direction}
				el={props.space}
			/>
			<for each={props.track}>
				{(item, position) => {
					const index = position.index
					return (
						<>
							<div class="toolbar-track-slot">
								<Toolbar
									border={props.border}
									region={props.region}
									toolbar={item.toolbar}
									track={props.track}
									trackIndex={props.trackIndex}
									direction={props.direction}
									el={props.toolbar}
								/>
							</div>
							<DropZone
								border={props.border}
								region={props.region}
								space={actualTrackSpaceAt(props.track, index + 1)}
								track={props.track}
								index={index + 1}
								trackIndex={props.trackIndex}
								direction={props.direction}
								el={props.space}
							/>
						</>
					)
				}}
			</for>
		</div>
	)
}

export function ToolbarBorder(
	props: {
		border: PaletteBorder
		inverse?: boolean
		direction: ArrangedOrientation
		region: PaletteRegion
		el?: JSX.IntrinsicElements['div']
		track?: JSX.IntrinsicElements['div']
		space?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	arranged(scope, { orientation: props.direction })
	scope.region = props.region
	return (
		<div
			{...props.el}
			class={['toolbar-border', `palette-${props.direction}`]}
			use:toolbarsContainer={props.direction}
		>
			<StackDropZone
				if={!props.inverse}
				border={props.border}
				direction={props.direction}
				index={0}
				region={props.region}
				el={props.space}
			/>
			<for each={props.inverse ? props.border.toReversed() : props.border}>
				{(item, position) => {
					const trackIndex = position.index
					return (
						<>
							<StackDropZone
								if={props.inverse}
								border={props.border}
								direction={props.direction}
								index={trackIndex + 1}
								region={props.region}
								el={props.space}
							/>
							<ToolbarTrack
								border={props.border}
								region={props.region}
								track={item}
								trackIndex={trackIndex}
								direction={props.direction}
								el={props.track}
								space={props.space}
								toolbar={props.toolbar}
							/>
							<StackDropZone
								if={!props.inverse}
								border={props.border}
								direction={props.direction}
								index={trackIndex + 1}
								region={props.region}
								el={props.space}
							/>
						</>
					)
				}}
			</for>
			<StackDropZone
				if={props.inverse}
				border={props.border}
				direction={props.direction}
				index={0}
				region={props.region}
				el={props.space}
			/>
		</div>
	)
}

export function Parking(
	props: {
		toolbars: readonly PaletteToolbar[]
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	arranged(scope, { orientation: props.direction })
	return (
		<div
			{...props.el}
			class={['palette-parking', `palette-${props.direction}`]}
			use:toolbarsContainer={props.direction}
		>
			<for each={props.toolbars}>
				{(toolbar) => (
					<Toolbar
						border={[]}
						region="top"
						trackIndex={-1}
						toolbar={toolbar}
						direction={props.direction}
						el={props.toolbar}
					/>
				)}
			</for>
		</div>
	)
}

export interface IdeConfig {
	top?: PaletteBorder
	right?: PaletteBorder
	bottom?: PaletteBorder
	left?: PaletteBorder
}

export function Ide(
	props: {
		palette: Palette
		config: IdeConfig
		el?: JSX.IntrinsicElements['div']
		center?: JSX.IntrinsicElements['div']
		border?: JSX.IntrinsicElements['div']
		track?: JSX.IntrinsicElements['div']
		space?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
		parkingEl?: JSX.IntrinsicElements['div']
		children?: JSX.Children
	},
	scope: Record<string, unknown>
) {
	scope.palette = props.palette
	return (
		<div {...props.el} class="palette-ide" use:paletteRoot={props.palette}>
			<ToolbarBorder
				if={props.config.top !== undefined}
				border={props.config.top ?? []}
				direction="horizontal"
				region="top"
				el={props.border}
				track={props.track}
				space={props.space}
				toolbar={props.toolbar}
			/>
			<div class="palette-ide-middle">
				<ToolbarBorder
					if={props.config.left !== undefined}
					border={props.config.left ?? []}
					direction="vertical"
					region="left"
					el={props.border}
					track={props.track}
					space={props.space}
					toolbar={props.toolbar}
				/>
				<div {...props.center} class="palette-ide-center">
					{props.children}
				</div>
				<ToolbarBorder
					if={props.config.right !== undefined}
					border={props.config.right ?? []}
					inverse={true}
					direction="vertical"
					region="right"
					el={props.border}
					track={props.track}
					space={props.space}
					toolbar={props.toolbar}
				/>
			</div>
			<ToolbarBorder
				if={props.config.bottom !== undefined}
				border={props.config.bottom ?? []}
				inverse={true}
				direction="horizontal"
				region="bottom"
				el={props.border}
				track={props.track}
				space={props.space}
				toolbar={props.toolbar}
			/>
		</div>
	)
}
