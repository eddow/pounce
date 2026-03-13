import type { PaletteModel } from './model'
import { getToolbarIdentity } from './toolbar-identity'
import type {
	PaletteContainerRegion,
	PaletteContainerToolbarStack,
	PaletteInsertionPoint,
	PaletteToolbar,
	PaletteToolbarSlot,
	PaletteToolbarTrack,
} from './types'

type MutablePaletteToolbarTrack = {
	-readonly [Key in keyof PaletteToolbarTrack]: PaletteToolbarTrack[Key]
}

type MutablePaletteToolbarSlot = {
	-readonly [Key in keyof PaletteToolbarSlot]: PaletteToolbarSlot[Key]
}

type MutablePaletteContainerToolbarStack = {
	-readonly [Region in keyof PaletteContainerToolbarStack]: MutablePaletteToolbarTrack[]
}

interface MutablePaletteContainerConfiguration {
	toolbarStack: MutablePaletteContainerToolbarStack
	editMode: boolean
	parkedToolbars?: PaletteToolbar[]
}

type PaletteToolbarPath = {
	region: PaletteContainerRegion
	track: number
	index: number
}

export interface PaletteContainerModel {
	readonly editMode: boolean
	readonly toolbarStack: PaletteContainerToolbarStack
	readonly parkedToolbars: readonly PaletteToolbar[]
	readonly insertionPoints: readonly PaletteInsertionPoint[]

	enterEditMode(): void
	exitEditMode(): void
	createToolbar(region: PaletteContainerRegion, track?: number, title?: string): PaletteToolbar
	addParkedToolbar(toolbar: PaletteToolbar, index?: number): PaletteToolbar
	parkToolbar(toolbar: PaletteToolbar, index?: number): void
	removeToolbar(toolbar: PaletteToolbar): void
	resizeToolbar(region: PaletteContainerRegion, track: number, index: number, split: number): void
	moveToolbar(
		toolbar: PaletteToolbar,
		target: { region: PaletteContainerRegion; track: number; index: number; split?: number }
	): void
	renameToolbar(toolbar: PaletteToolbar, title: string): void
	getToolbarsInTrack(region: PaletteContainerRegion, track: number): readonly PaletteToolbar[]
	getToolbarsInRegion(region: PaletteContainerRegion): readonly PaletteToolbar[]
	getInsertionPointsInTrack(
		region: PaletteContainerRegion,
		track: number
	): readonly PaletteInsertionPoint[]
	getInsertionPointsInRegion(region: PaletteContainerRegion): readonly PaletteInsertionPoint[]
}

function regions(): readonly PaletteContainerRegion[] {
	return ['top', 'right', 'bottom', 'left']
}

function clampUnit(value: number): number {
	return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function defaultActualSpaces(toolbarCount: number): readonly number[] {
	return Array.from({ length: toolbarCount + 1 }, () => 1 / (toolbarCount + 1))
}

function emptyTrack(): PaletteToolbarTrack {
	return { slots: [] }
}

function toolbarsInTrack(track: PaletteToolbarTrack): readonly PaletteToolbar[] {
	return track.slots.map((slot) => slot.toolbar)
}

function spacesInTrack(track: PaletteToolbarTrack): readonly number[] {
	return track.slots.map((slot) => slot.space)
}

function createTrack(
	toolbars: readonly PaletteToolbar[],
	spaces: readonly number[]
): PaletteToolbarTrack {
	const normalizedSpaces = normalizeSpaces(toolbars.length, spaces)
	return {
		slots: toolbars.map((toolbar, index) => ({
			toolbar,
			space: normalizedSpaces[index] ?? 0,
		})),
	}
}

function actualSpacesFromLeading(
	toolbarCount: number,
	spaces: readonly number[]
): readonly number[] {
	const actualSpaces: number[] = []
	let remaining = 1
	for (let index = 0; index < toolbarCount; index++) {
		const actualSpace = remaining * clampUnit(spaces[index] ?? 0)
		actualSpaces.push(actualSpace)
		remaining -= actualSpace
	}
	actualSpaces.push(Math.max(remaining, 0))
	return actualSpaces
}

function leadingSpacesFromActual(
	toolbarCount: number,
	actualSpaces: readonly number[]
): readonly number[] {
	if (toolbarCount <= 0) return []
	const total = actualSpaces.reduce((sum, value) => sum + Math.max(value, 0), 0)
	const normalizedActualSpaces =
		total > 0
			? actualSpaces.map((value) => Math.max(value, 0) / total)
			: defaultActualSpaces(toolbarCount)
	const spaces: number[] = []
	let remaining = 1
	for (let index = 0; index < toolbarCount; index++) {
		const actualSpace = normalizedActualSpaces[index] ?? 0
		spaces.push(remaining > 0 ? clampUnit(actualSpace / remaining) : 0)
		remaining -= actualSpace
	}
	return spaces
}

function normalizeSpaces(toolbarCount: number, spaces?: readonly number[]): readonly number[] {
	if (toolbarCount <= 0) return []
	if (spaces?.length === toolbarCount) return spaces.map(clampUnit)
	if (spaces?.length === toolbarCount + 1) return leadingSpacesFromActual(toolbarCount, spaces)
	return leadingSpacesFromActual(toolbarCount, defaultActualSpaces(toolbarCount))
}

function cloneTrack(track: PaletteToolbarTrack): PaletteToolbarTrack {
	return {
		slots: track.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
	}
}

function normalizeRegionTrackSpaces(track: PaletteToolbarTrack): PaletteToolbarTrack {
	return createTrack(toolbarsInTrack(track), spacesInTrack(track))
}

export function paletteContainerModel(props: { palette: PaletteModel }): PaletteContainerModel {
	const { palette } = props
	const container = palette.display.container as unknown as MutablePaletteContainerConfiguration
	container.parkedToolbars ??= []

	function getRegionTracks(region: PaletteContainerRegion): MutablePaletteToolbarTrack[] {
		return container.toolbarStack[region]
	}

	function getRegionTrack(
		region: PaletteContainerRegion,
		track: number
	): MutablePaletteToolbarTrack {
		const regionTrack = getRegionTracks(region)[track]
		if (!regionTrack) throw new Error(`Track ${track} not found in region '${region}'`)
		return regionTrack
	}

	function setRegionTracks(
		region: PaletteContainerRegion,
		tracks: readonly PaletteToolbarTrack[]
	): void {
		container.toolbarStack[region] =
			tracks.length > 0 ? tracks.map((track) => normalizeRegionTrackSpaces(track)) : [emptyTrack()]
	}

	function setRegionTrack(
		region: PaletteContainerRegion,
		track: number,
		nextTrack: PaletteToolbarTrack
	): void {
		const regionTracks = getRegionTracks(region).map((entry) => cloneTrack(entry))
		regionTracks[track] = normalizeRegionTrackSpaces(nextTrack)
		setRegionTracks(region, regionTracks)
	}

	function setRegionSpaces(
		region: PaletteContainerRegion,
		track: number,
		spaces: readonly number[]
	): void {
		const regionTrack = getRegionTrack(region, track)
		const normalizedSpaces = normalizeSpaces(regionTrack.slots.length, spaces)
		for (let index = 0; index < regionTrack.slots.length; index += 1) {
			const slot = regionTrack.slots[index] as MutablePaletteToolbarSlot | undefined
			if (!slot) continue
			slot.space = normalizedSpaces[index] ?? 0
		}
	}

	function findToolbarLocation(toolbar: PaletteToolbar): PaletteToolbarPath | undefined {
		const identity = getToolbarIdentity(toolbar)
		for (const region of regions()) {
			for (let track = 0; track < getRegionTracks(region).length; track += 1) {
				const index = toolbarsInTrack(getRegionTrack(region, track)).findIndex(
					(entry) => getToolbarIdentity(entry) === identity
				)
				if (index >= 0) return { region, track, index }
			}
		}
		return undefined
	}

	function findParkedToolbarIndex(toolbar: PaletteToolbar): number {
		const identity = getToolbarIdentity(toolbar)
		return (
			container.parkedToolbars?.findIndex((entry) => getToolbarIdentity(entry) === identity) ?? -1
		)
	}

	function enterEditMode(): void {
		container.editMode = true
	}

	function exitEditMode(): void {
		container.editMode = false
	}

	function createToolbar(
		region: PaletteContainerRegion,
		track = 0,
		title?: string
	): PaletteToolbar {
		const toolbar: PaletteToolbar = { title, items: [] }
		const currentTrack = cloneTrack(getRegionTrack(region, track))
		const toolbars = [...toolbarsInTrack(currentTrack), toolbar]
		const nextActualSpaces = [
			...actualSpacesFromLeading(currentTrack.slots.length, spacesInTrack(currentTrack)),
		]
		nextActualSpaces.push(nextActualSpaces.pop() ?? 1)
		setRegionTrack(
			region,
			track,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, nextActualSpaces))
		)
		return toolbar
	}

	function addParkedToolbar(
		toolbar: PaletteToolbar,
		index = container.parkedToolbars?.length ?? 0
	): PaletteToolbar {
		const parkedToolbars = [...(container.parkedToolbars ?? [])]
		const insertionIndex = Math.min(Math.max(index, 0), parkedToolbars.length)
		parkedToolbars.splice(insertionIndex, 0, toolbar)
		container.parkedToolbars = parkedToolbars
		return (container.parkedToolbars ?? [])[insertionIndex] ?? toolbar
	}

	function parkToolbar(toolbar: PaletteToolbar, index?: number): void {
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = cloneTrack(getRegionTrack(location.region, location.track))
		const toolbars = toolbarsInTrack(track).filter((entry) => entry !== toolbar)
		const actualSpaces = [...actualSpacesFromLeading(track.slots.length, spacesInTrack(track))]
		const mergedSpace =
			(actualSpaces[location.index] ?? 0) + (actualSpaces[location.index + 1] ?? 0)
		actualSpaces.splice(location.index, 2, mergedSpace)
		setRegionTrack(
			location.region,
			location.track,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, actualSpaces))
		)
		addParkedToolbar(toolbar, index)
	}

	function removeToolbar(toolbar: PaletteToolbar): void {
		const parkedIndex = findParkedToolbarIndex(toolbar)
		if (parkedIndex >= 0) {
			const parkedToolbars = [...(container.parkedToolbars ?? [])]
			parkedToolbars.splice(parkedIndex, 1)
			container.parkedToolbars = parkedToolbars
			return
		}
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = cloneTrack(getRegionTrack(location.region, location.track))
		const toolbars = toolbarsInTrack(track).filter((entry) => entry !== toolbar)
		const actualSpaces = [...actualSpacesFromLeading(track.slots.length, spacesInTrack(track))]
		const mergedSpace =
			(actualSpaces[location.index] ?? 0) + (actualSpaces[location.index + 1] ?? 0)
		actualSpaces.splice(location.index, 2, mergedSpace)
		setRegionTrack(
			location.region,
			location.track,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, actualSpaces))
		)
	}

	function resizeToolbar(
		region: PaletteContainerRegion,
		track: number,
		index: number,
		split: number
	): void {
		const regionTrack = cloneTrack(getRegionTrack(region, track))
		if (index < 0 || index >= regionTrack.slots.length) throw new Error('Toolbar not found')
		const actualSpaces = [
			...actualSpacesFromLeading(regionTrack.slots.length, spacesInTrack(regionTrack)),
		]
		const mergedSpace = (actualSpaces[index] ?? 0) + (actualSpaces[index + 1] ?? 0)
		const beforeSpace = mergedSpace * clampUnit(split)
		const afterSpace = mergedSpace - beforeSpace
		actualSpaces.splice(index, 2, beforeSpace, afterSpace)
		setRegionSpaces(region, track, leadingSpacesFromActual(regionTrack.slots.length, actualSpaces))
	}

	function moveToolbar(
		toolbar: PaletteToolbar,
		target: { region: PaletteContainerRegion; track: number; index: number; split?: number }
	): void {
		const location = findToolbarLocation(toolbar)
		const parkedIndex = findParkedToolbarIndex(toolbar)
		if (!location && parkedIndex < 0) throw new Error('Toolbar not found')
		const targetSplit = target.split ?? 0.5
		let sameTrack = false
		let nextSourceTrack = getRegionTrack(target.region, target.track)
		if (location) {
			const sourceTrack = cloneTrack(getRegionTrack(location.region, location.track))
			const sourceToolbars = toolbarsInTrack(sourceTrack).filter((entry) => entry !== toolbar)
			const sourceActualSpaces = [
				...actualSpacesFromLeading(sourceTrack.slots.length, spacesInTrack(sourceTrack)),
			]
			const mergedSourceSpace =
				(sourceActualSpaces[location.index] ?? 0) + (sourceActualSpaces[location.index + 1] ?? 0)
			sourceActualSpaces.splice(location.index, 2, mergedSourceSpace)
			nextSourceTrack = createTrack(
				sourceToolbars,
				leadingSpacesFromActual(sourceToolbars.length, sourceActualSpaces)
			)
			setRegionTrack(location.region, location.track, nextSourceTrack)
			sameTrack = location.region === target.region && location.track === target.track
		} else {
			const parkedToolbars = [...(container.parkedToolbars ?? [])]
			parkedToolbars.splice(parkedIndex, 1)
			container.parkedToolbars = parkedToolbars
		}
		const targetTrack = cloneTrack(
			sameTrack ? nextSourceTrack : getRegionTrack(target.region, target.track)
		)
		const insertionIndex = Math.min(Math.max(target.index, 0), targetTrack.slots.length)
		const toolbars = [...toolbarsInTrack(targetTrack)]
		toolbars.splice(insertionIndex, 0, toolbar)
		const targetActualSpaces = [
			...actualSpacesFromLeading(targetTrack.slots.length, spacesInTrack(targetTrack)),
		]
		const splitSpace = targetActualSpaces[insertionIndex] ?? 0
		const beforeSpace = splitSpace * clampUnit(targetSplit)
		const afterSpace = splitSpace - beforeSpace
		targetActualSpaces.splice(insertionIndex, 1, beforeSpace, afterSpace)
		setRegionTrack(
			target.region,
			target.track,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, targetActualSpaces))
		)
	}

	function renameToolbar(toolbar: PaletteToolbar, title: string): void {
		const parkedIndex = findParkedToolbarIndex(toolbar)
		if (parkedIndex >= 0) {
			const parkedToolbars = [...(container.parkedToolbars ?? [])]
			parkedToolbars[parkedIndex] = { ...parkedToolbars[parkedIndex], title }
			container.parkedToolbars = parkedToolbars
			return
		}
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = cloneTrack(getRegionTrack(location.region, location.track))
		const toolbars = toolbarsInTrack(track).map((entry) =>
			entry === toolbar ? { ...entry, title } : entry
		)
		setRegionTrack(location.region, location.track, createTrack(toolbars, spacesInTrack(track)))
	}

	function getToolbarsInTrack(
		region: PaletteContainerRegion,
		track: number
	): readonly PaletteToolbar[] {
		return toolbarsInTrack(getRegionTrack(region, track))
	}

	function getToolbarsInRegion(region: PaletteContainerRegion): readonly PaletteToolbar[] {
		return getRegionTracks(region).flatMap((track) => toolbarsInTrack(track))
	}

	function getInsertionPointsInTrack(
		region: PaletteContainerRegion,
		track: number
	): readonly PaletteInsertionPoint[] {
		const toolbars = getToolbarsInTrack(region, track)
		const points: PaletteInsertionPoint[] = [
			{
				region,
				track,
				index: 0,
				after: undefined,
				before: toolbars[0],
			},
		]

		for (let index = 0; index < toolbars.length - 1; index++) {
			points.push({
				region,
				track,
				index: index + 1,
				after: toolbars[index],
				before: toolbars[index + 1],
			})
		}

		if (toolbars.length > 0) {
			points.push({
				region,
				track,
				index: toolbars.length,
				after: toolbars[toolbars.length - 1],
				before: undefined,
			})
		}

		return points
	}

	function getInsertionPointsInRegion(
		region: PaletteContainerRegion
	): readonly PaletteInsertionPoint[] {
		return getRegionTracks(region).flatMap((_, track) => getInsertionPointsInTrack(region, track))
	}

	function getInsertionPoints(): readonly PaletteInsertionPoint[] {
		return regions().flatMap((region) => getInsertionPointsInRegion(region))
	}

	return {
		get editMode() {
			return container.editMode
		},
		get toolbarStack() {
			return container.toolbarStack
		},
		get parkedToolbars() {
			return [...(container.parkedToolbars ?? [])]
		},
		get insertionPoints() {
			return [...getInsertionPoints()]
		},
		enterEditMode,
		exitEditMode,
		createToolbar,
		addParkedToolbar,
		parkToolbar,
		removeToolbar,
		resizeToolbar,
		moveToolbar,
		renameToolbar,
		getToolbarsInTrack,
		getToolbarsInRegion,
		getInsertionPointsInTrack,
		getInsertionPointsInRegion,
	}
}
