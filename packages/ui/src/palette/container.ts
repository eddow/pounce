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

type MutablePaletteContainerToolbarStack = {
	-readonly [Region in keyof PaletteContainerToolbarStack]: PaletteContainerToolbarStack[Region]
}

type MutablePaletteToolbarTrack = {
	-readonly [Key in keyof PaletteToolbarTrack]: PaletteToolbarTrack[Key]
}

type MutablePaletteToolbarSlot = {
	-readonly [Key in keyof PaletteToolbarSlot]: PaletteToolbarSlot[Key]
}

interface MutablePaletteContainerConfiguration {
	toolbarStack: {
		[Region in keyof MutablePaletteContainerToolbarStack]: MutablePaletteToolbarTrack
	}
	editMode: boolean
}

export interface PaletteContainerModel {
	readonly editMode: boolean
	readonly toolbarStack: PaletteContainerToolbarStack
	readonly insertionPoints: readonly PaletteInsertionPoint[]

	enterEditMode(): void
	exitEditMode(): void
	createToolbar(region: PaletteContainerRegion, title?: string): PaletteToolbar
	removeToolbar(toolbar: PaletteToolbar): void
	resizeToolbar(region: PaletteContainerRegion, index: number, split: number): void
	moveToolbar(
		toolbar: PaletteToolbar,
		targetRegion: PaletteContainerRegion,
		targetIndex?: number,
		targetSplit?: number
	): void
	renameToolbar(toolbar: PaletteToolbar, title: string): void
	getToolbarsInRegion(region: PaletteContainerRegion): readonly PaletteToolbar[]
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
	if (spaces?.length === toolbarCount) {
		return spaces.map(clampUnit)
	}
	if (spaces?.length === toolbarCount + 1) {
		return leadingSpacesFromActual(toolbarCount, spaces)
	}
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

	function getRegionTrack(region: PaletteContainerRegion): MutablePaletteToolbarTrack {
		return container.toolbarStack[region]
	}

	function setRegionTrack(region: PaletteContainerRegion, track: PaletteToolbarTrack): void {
		container.toolbarStack[region] = normalizeRegionTrackSpaces(track)
	}

	function setRegionSpaces(region: PaletteContainerRegion, spaces: readonly number[]): void {
		const track = getRegionTrack(region)
		const normalizedSpaces = normalizeSpaces(track.slots.length, spaces)
		for (let index = 0; index < track.slots.length; index += 1) {
			const slot = track.slots[index] as MutablePaletteToolbarSlot | undefined
			if (!slot) continue
			slot.space = normalizedSpaces[index] ?? 0
		}
	}

	function findToolbarLocation(
		toolbar: PaletteToolbar
	): { region: PaletteContainerRegion; index: number } | undefined {
		const identity = getToolbarIdentity(toolbar)
		for (const region of regions()) {
			const index = toolbarsInTrack(container.toolbarStack[region]).findIndex(
				(entry) => getToolbarIdentity(entry) === identity
			)
			if (index >= 0) {
				return { region, index }
			}
		}
		return undefined
	}

	function enterEditMode(): void {
		container.editMode = true
	}

	function exitEditMode(): void {
		container.editMode = false
	}

	function createToolbar(region: PaletteContainerRegion, title?: string): PaletteToolbar {
		const toolbar: PaletteToolbar = {
			title,
			items: [],
		}
		const track = cloneTrack(getRegionTrack(region))
		const toolbars = [...toolbarsInTrack(track), toolbar]
		const nextActualSpaces = [...actualSpacesFromLeading(track.slots.length, spacesInTrack(track))]
		nextActualSpaces.push(nextActualSpaces.pop() ?? 1)
		setRegionTrack(
			region,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, nextActualSpaces))
		)
		return toolbar
	}

	function removeToolbar(toolbar: PaletteToolbar): void {
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = cloneTrack(getRegionTrack(location.region))
		const toolbars = toolbarsInTrack(track).filter((entry) => entry !== toolbar)
		const actualSpaces = [...actualSpacesFromLeading(track.slots.length, spacesInTrack(track))]
		const mergedSpace =
			(actualSpaces[location.index] ?? 0) + (actualSpaces[location.index + 1] ?? 0)
		actualSpaces.splice(location.index, 2, mergedSpace)
		setRegionTrack(
			location.region,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, actualSpaces))
		)
	}

	function resizeToolbar(region: PaletteContainerRegion, index: number, split: number): void {
		const track = cloneTrack(getRegionTrack(region))
		if (index < 0 || index >= track.slots.length) throw new Error('Toolbar not found')
		const actualSpaces = [...actualSpacesFromLeading(track.slots.length, spacesInTrack(track))]
		const mergedSpace = (actualSpaces[index] ?? 0) + (actualSpaces[index + 1] ?? 0)
		const beforeSpace = mergedSpace * clampUnit(split)
		const afterSpace = mergedSpace - beforeSpace
		actualSpaces.splice(index, 2, beforeSpace, afterSpace)
		setRegionSpaces(region, leadingSpacesFromActual(track.slots.length, actualSpaces))
	}

	function moveToolbar(
		toolbar: PaletteToolbar,
		targetRegion: PaletteContainerRegion,
		targetIndex?: number,
		targetSplit = 0.5
	): void {
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')

		const sourceTrack = cloneTrack(getRegionTrack(location.region))
		const sourceToolbars = toolbarsInTrack(sourceTrack).filter((entry) => entry !== toolbar)
		const sourceActualSpaces = [
			...actualSpacesFromLeading(sourceTrack.slots.length, spacesInTrack(sourceTrack)),
		]
		const mergedSourceSpace =
			(sourceActualSpaces[location.index] ?? 0) + (sourceActualSpaces[location.index + 1] ?? 0)
		sourceActualSpaces.splice(location.index, 2, mergedSourceSpace)
		setRegionTrack(
			location.region,
			createTrack(
				sourceToolbars,
				leadingSpacesFromActual(sourceToolbars.length, sourceActualSpaces)
			)
		)

		const targetTrack = cloneTrack(
			location.region === targetRegion
				? createTrack(
						sourceToolbars,
						leadingSpacesFromActual(sourceToolbars.length, sourceActualSpaces)
					)
				: getRegionTrack(targetRegion)
		)
		const insertionIndex = Math.min(
			Math.max(targetIndex ?? targetTrack.slots.length, 0),
			targetTrack.slots.length
		)
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
			targetRegion,
			createTrack(toolbars, leadingSpacesFromActual(toolbars.length, targetActualSpaces))
		)
	}

	function renameToolbar(toolbar: PaletteToolbar, title: string): void {
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = cloneTrack(getRegionTrack(location.region))
		const toolbars = toolbarsInTrack(track).map((entry) =>
			entry === toolbar ? { ...entry, title } : entry
		)
		setRegionTrack(location.region, createTrack(toolbars, spacesInTrack(track)))
	}

	function getToolbarsInRegion(region: PaletteContainerRegion): readonly PaletteToolbar[] {
		return toolbarsInTrack(getRegionTrack(region))
	}

	function getInsertionPointsInRegion(
		region: PaletteContainerRegion
	): readonly PaletteInsertionPoint[] {
		const toolbars = getToolbarsInRegion(region)
		const points: PaletteInsertionPoint[] = [
			{
				region,
				index: 0,
				after: undefined,
				before: toolbars[0],
			},
		]

		for (let index = 0; index < toolbars.length - 1; index++) {
			points.push({
				region,
				index: index + 1,
				after: toolbars[index],
				before: toolbars[index + 1],
			})
		}

		if (toolbars.length > 0) {
			points.push({
				region,
				index: toolbars.length,
				after: toolbars[toolbars.length - 1],
				before: undefined,
			})
		}

		return points
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
		get insertionPoints() {
			return [...getInsertionPoints()]
		},
		enterEditMode,
		exitEditMode,
		createToolbar,
		removeToolbar,
		resizeToolbar,
		moveToolbar,
		renameToolbar,
		getToolbarsInRegion,
		getInsertionPointsInRegion,
	}
}
