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
	direction: ArrangedOrientation
	index: number
	track: PaletteTrack
}

type PaletteDragTarget = PaletteTrackSpace & {
	contained: boolean
	element: HTMLElement
	split: number
}

type PaletteToolbarDrag = {
	direction: ArrangedOrientation
	palette: Palette
	toolbar: PaletteToolbar
	track: PaletteTrack
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

function trackSpaceTargets() {
	return Array.from(trackSpaces).flatMap((element) => {
		if (!element.isConnected) {
			trackSpaces.delete(element)
			return []
		}
		const target = trackSpaceMeta.get(element)
		if (!target) return []
		return [measureLocalDragTarget({ ...target, element }, element)]
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

function resolveTrackSpaceTarget(point: { x: number; y: number }): PaletteDragTarget | undefined {
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
	paletteToolbarDrag(element: HTMLElement, target: PaletteToolbarDrag): (() => void) | undefined {
		const handleMove = (
			snapshot: { current: { x: number; y: number } },
			activeTarget: PaletteDragTarget | undefined,
			grabOffset: number,
			toolbarSpan: number
		) => {
			if (!palettes.dragging) return activeTarget
			const currentTrack = palettes.dragging.track
			const currentIndex = palettes.dragging.index
			if (currentIndex < 0) return activeTarget
			const nextTarget = resolveTrackSpaceTarget(snapshot.current)
			const resolvedTarget =
				nextTarget && !isIgnoredDropZone(nextTarget, palettes.dragging) ? nextTarget : undefined
			const reorderTarget = resolvedTarget?.contained ? resolvedTarget : undefined
			const adjacent =
				reorderTarget?.track === currentTrack &&
				(reorderTarget.index === currentIndex || reorderTarget.index === currentIndex + 1)
			if (activeTarget?.element !== resolvedTarget?.element) {
				setTargetState(activeTarget, {})
				activeTarget = resolvedTarget
			}
			if (activeTarget) {
				setTargetState(activeTarget, {
					active: activeTarget.contained,
					proximity: true,
				})
			}
			if (!reorderTarget) {
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
			if (adjacent) {
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
			const removedIndex = removeToolbar(currentTrack, target.toolbar)
			if (removedIndex < 0) return activeTarget
			const targetIndex =
				currentTrack === reorderTarget.track && reorderTarget.index > removedIndex
					? reorderTarget.index - 1
					: reorderTarget.index
			insertToolbar(reorderTarget.track, targetIndex, target.toolbar, reorderTarget.split)
			palettes.dragging = {
				index: targetIndex,
				palette: target.palette,
				toolbar: target.toolbar,
				track: reorderTarget.track,
			}
			resizeToolbarFromPointer(
				reorderTarget.track,
				targetIndex,
				target.direction,
				snapshot.current,
				grabOffset,
				toolbarSpan
			)
			return activeTarget
		}

		const onPointerDown = (event: PointerEvent) => {
			if (!isEditing(target.palette)) return
			if (event.button !== 0) return
			if (isEditableTarget(event.target)) return
			event.preventDefault()
			const rect = element.getBoundingClientRect()
			const grabOffset =
				target.direction === 'vertical' ? event.clientY - rect.top : event.clientX - rect.left
			const toolbarSpan = target.direction === 'vertical' ? rect.height : rect.width
			let activeTarget: PaletteDragTarget | undefined
			const index = target.track.findIndex((slot) => slot.toolbar === target.toolbar)
			if (index < 0) return
			palettes.dragging = {
				index,
				palette: target.palette,
				toolbar: target.toolbar,
				track: target.track,
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
					activeTarget = undefined
					if (palettes.dragging?.palette === target.palette) delete palettes.dragging
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
		toolbar: PaletteToolbar
		track?: PaletteTrack
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
							direction: props.direction,
							palette,
							toolbar: props.toolbar,
							track: props.track,
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
		space: number
		track: PaletteTrack
		index: number
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
	},
	_scope: PaletteScope
) {
	return (
		<div
			{...props.el}
			class={['toolbar-track-space', props.el?.class]}
			use:paletteTrackSpace={{ direction: props.direction, index: props.index, track: props.track }}
			style={{ flexBasis: `${props.space * 100}%`, flexGrow: `${Math.max(props.space, 0.0001)}` }}
		/>
	)
}

export function ToolbarTrack(
	props: {
		track: PaletteTrack
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
		space?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	_scope: PaletteScope
) {
	return (
		<div {...props.el} class="toolbar-track">
			<DropZone
				space={actualTrackSpaceAt(props.track, 0)}
				track={props.track}
				index={0}
				direction={props.direction}
				el={props.space}
			/>
			<for each={props.track}>
				{(item) => {
					const index = props.track.indexOf(item)
					return (
						<>
							<div class="toolbar-track-slot">
								<Toolbar
									toolbar={item.toolbar}
									track={props.track}
									direction={props.direction}
									el={props.toolbar}
								/>
							</div>
							<DropZone
								space={actualTrackSpaceAt(props.track, index + 1)}
								track={props.track}
								index={index + 1}
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
	const list = props.inverse ? props.border.toReversed() : props.border
	return (
		<div
			{...props.el}
			class={['toolbar-border', `palette-${props.direction}`]}
			use:toolbarsContainer={props.direction}
		>
			<for each={list}>
				{(item) => (
					<ToolbarTrack
						track={item}
						direction={props.direction}
						el={props.track}
						space={props.space}
						toolbar={props.toolbar}
					/>
				)}
			</for>
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
				{(toolbar) => <Toolbar toolbar={toolbar} direction={props.direction} el={props.toolbar} />}
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
