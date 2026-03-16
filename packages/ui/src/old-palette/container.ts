import type { PaletteModel } from './model'
import type {
	PaletteContainerConfiguration,
	PaletteContainerRegion,
	PaletteContainerToolbarStack,
	PaletteInsertionPoint,
	PaletteToolbar,
	PaletteToolbarTrack,
} from './types'

type PaletteToolbarPath = {
	region: PaletteContainerRegion
	track: number
	index: number
}

export interface PaletteContainerModel {
	editMode: boolean
	readonly toolbarStack: PaletteContainerToolbarStack
	readonly parkedToolbars: readonly PaletteToolbar[]
	readonly insertionPoints: readonly PaletteInsertionPoint[]

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
	return []
}

function createTrack(
	toolbars: readonly PaletteToolbar[],
	spaces: readonly number[]
): PaletteToolbarTrack {
	const normalizedSpaces = normalizeSpaces(toolbars.length, spaces)
	return toolbars.map((toolbar, index) => ({
		toolbar,
		space: normalizedSpaces[index] ?? 0,
	}))
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

export function paletteContainerModel(props: { palette: PaletteModel }): PaletteContainerModel {
	const { palette } = props
	const container = palette.display.container as PaletteContainerConfiguration
	container.parkedToolbars ??= []

	function setRegionTrack(
		region: PaletteContainerRegion,
		track: number,
		nextTrack: PaletteToolbarTrack
	): void {
		const regionTracks = [...container.toolbarStack[region]]
		regionTracks[track] = nextTrack
		container.toolbarStack[region] = regionTracks.length > 0 ? regionTracks : [emptyTrack()]
	}

	function setRegionSpaces(
		region: PaletteContainerRegion,
		track: number,
		spaces: readonly number[]
	): void {
		const regionTrack = container.toolbarStack[region][track]
		if (!regionTrack) throw new Error(`Track ${track} not found in region '${region}'`)
		const normalizedSpaces = normalizeSpaces(regionTrack.length, spaces)
		for (let index = 0; index < regionTrack.length; index += 1) {
			const slot = regionTrack[index]
			if (!slot) continue
			slot.space = normalizedSpaces[index] ?? 0
		}
	}

	function trackFromActualSpaces(
		toolbars: readonly PaletteToolbar[],
		actualSpaces: readonly number[]
	): PaletteToolbarTrack {
		return createTrack(toolbars, leadingSpacesFromActual(toolbars.length, actualSpaces))
	}

	function findToolbarLocation(toolbar: PaletteToolbar): PaletteToolbarPath | undefined {
		for (const region of regions()) {
			const regionTracks = container.toolbarStack[region]
			for (let track = 0; track < regionTracks.length; track += 1) {
				const regionTrack = regionTracks[track]
				if (!regionTrack) continue
				const index = regionTrack.findIndex((slot) => slot.toolbar === toolbar)
				if (index >= 0) return { region, track, index }
			}
		}
		return undefined
	}

	function findParkedToolbarIndex(toolbar: PaletteToolbar): number {
		return container.parkedToolbars?.indexOf(toolbar) ?? -1
	}

	function createToolbar(
		region: PaletteContainerRegion,
		track = 0,
		title?: string
	): PaletteToolbar {
		const toolbar: PaletteToolbar = { title, items: [] }
		const currentTrack = container.toolbarStack[region][track]
		if (!currentTrack) throw new Error(`Track ${track} not found in region '${region}'`)
		const toolbars = [...currentTrack.map((slot) => slot.toolbar), toolbar]
		const nextActualSpaces = [
			...actualSpacesFromLeading(
				currentTrack.length,
				currentTrack.map((slot) => slot.space)
			),
		]
		nextActualSpaces.push(nextActualSpaces.pop() ?? 1)
		setRegionTrack(region, track, trackFromActualSpaces(toolbars, nextActualSpaces))
		return toolbar
	}

	function addParkedToolbar(
		toolbar: PaletteToolbar,
		index = container.parkedToolbars?.length ?? 0
	): PaletteToolbar {
		const parkedToolbars = container.parkedToolbars ?? []
		container.parkedToolbars ??= parkedToolbars
		const insertionIndex = Math.min(Math.max(index, 0), parkedToolbars.length)
		parkedToolbars.splice(insertionIndex, 0, toolbar)
		return parkedToolbars[insertionIndex] ?? toolbar
	}

	function parkToolbar(toolbar: PaletteToolbar, index?: number): void {
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = container.toolbarStack[location.region][location.track]
		if (!track) throw new Error(`Track ${location.track} not found in region '${location.region}'`)
		const toolbars = track.map((slot) => slot.toolbar).filter((entry) => entry !== toolbar)
		const actualSpaces = [
			...actualSpacesFromLeading(
				track.length,
				track.map((slot) => slot.space)
			),
		]
		const mergedSpace =
			(actualSpaces[location.index] ?? 0) + (actualSpaces[location.index + 1] ?? 0)
		actualSpaces.splice(location.index, 2, mergedSpace)
		setRegionTrack(location.region, location.track, trackFromActualSpaces(toolbars, actualSpaces))
		addParkedToolbar(toolbar, index)
	}

	function removeToolbar(toolbar: PaletteToolbar): void {
		const parkedIndex = findParkedToolbarIndex(toolbar)
		if (parkedIndex >= 0) {
			const parkedToolbars = container.parkedToolbars ?? []
			parkedToolbars.splice(parkedIndex, 1)
			return
		}
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		const track = container.toolbarStack[location.region][location.track]
		if (!track) throw new Error(`Track ${location.track} not found in region '${location.region}'`)
		const toolbars = track.map((slot) => slot.toolbar).filter((entry) => entry !== toolbar)
		const actualSpaces = [
			...actualSpacesFromLeading(
				track.length,
				track.map((slot) => slot.space)
			),
		]
		const mergedSpace =
			(actualSpaces[location.index] ?? 0) + (actualSpaces[location.index + 1] ?? 0)
		actualSpaces.splice(location.index, 2, mergedSpace)
		setRegionTrack(location.region, location.track, trackFromActualSpaces(toolbars, actualSpaces))
	}

	function resizeToolbar(
		region: PaletteContainerRegion,
		track: number,
		index: number,
		split: number
	): void {
		const regionTrack = container.toolbarStack[region][track]
		if (!regionTrack) throw new Error(`Track ${track} not found in region '${region}'`)
		if (index < 0 || index >= regionTrack.length) throw new Error('Toolbar not found')
		const actualSpaces = [
			...actualSpacesFromLeading(
				regionTrack.length,
				regionTrack.map((slot) => slot.space)
			),
		]
		const mergedSpace = (actualSpaces[index] ?? 0) + (actualSpaces[index + 1] ?? 0)
		const beforeSpace = mergedSpace * clampUnit(split)
		const afterSpace = mergedSpace - beforeSpace
		actualSpaces.splice(index, 2, beforeSpace, afterSpace)
		setRegionSpaces(region, track, leadingSpacesFromActual(regionTrack.length, actualSpaces))
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
		const initialTargetTrack = container.toolbarStack[target.region][target.track]
		if (!initialTargetTrack)
			throw new Error(`Track ${target.track} not found in region '${target.region}'`)
		let nextSourceTrack = initialTargetTrack
		if (location) {
			const sourceTrack = container.toolbarStack[location.region][location.track]
			if (!sourceTrack)
				throw new Error(`Track ${location.track} not found in region '${location.region}'`)
			const sourceToolbars = sourceTrack
				.map((slot) => slot.toolbar)
				.filter((entry) => entry !== toolbar)
			const sourceActualSpaces = [
				...actualSpacesFromLeading(
					sourceTrack.length,
					sourceTrack.map((slot) => slot.space)
				),
			]
			const mergedSourceSpace =
				(sourceActualSpaces[location.index] ?? 0) + (sourceActualSpaces[location.index + 1] ?? 0)
			sourceActualSpaces.splice(location.index, 2, mergedSourceSpace)
			nextSourceTrack = trackFromActualSpaces(sourceToolbars, sourceActualSpaces)
			setRegionTrack(location.region, location.track, nextSourceTrack)
			sameTrack = location.region === target.region && location.track === target.track
		} else {
			const parkedToolbars = container.parkedToolbars ?? []
			parkedToolbars.splice(parkedIndex, 1)
		}
		const targetTrack = sameTrack
			? nextSourceTrack
			: container.toolbarStack[target.region][target.track]
		if (!targetTrack)
			throw new Error(`Track ${target.track} not found in region '${target.region}'`)
		const insertionIndex = Math.min(Math.max(target.index, 0), targetTrack.length)
		const toolbars = [...targetTrack.map((slot) => slot.toolbar)]
		toolbars.splice(insertionIndex, 0, toolbar)
		const targetActualSpaces = [
			...actualSpacesFromLeading(
				targetTrack.length,
				targetTrack.map((slot) => slot.space)
			),
		]
		const splitSpace = targetActualSpaces[insertionIndex] ?? 0
		const beforeSpace = splitSpace * clampUnit(targetSplit)
		const afterSpace = splitSpace - beforeSpace
		targetActualSpaces.splice(insertionIndex, 1, beforeSpace, afterSpace)
		setRegionTrack(target.region, target.track, trackFromActualSpaces(toolbars, targetActualSpaces))
	}

	function renameToolbar(toolbar: PaletteToolbar, title: string): void {
		const parkedIndex = findParkedToolbarIndex(toolbar)
		if (parkedIndex >= 0) {
			const parkedToolbar = container.parkedToolbars?.[parkedIndex]
			if (!parkedToolbar) throw new Error('Toolbar not found')
			parkedToolbar.title = title
			return
		}
		const location = findToolbarLocation(toolbar)
		if (!location) throw new Error('Toolbar not found')
		toolbar.title = title
	}

	function getToolbarsInTrack(
		region: PaletteContainerRegion,
		track: number
	): readonly PaletteToolbar[] {
		const regionTrack = container.toolbarStack[region][track]
		if (!regionTrack) throw new Error(`Track ${track} not found in region '${region}'`)
		return regionTrack.map((slot) => slot.toolbar)
	}

	function getToolbarsInRegion(region: PaletteContainerRegion): readonly PaletteToolbar[] {
		return container.toolbarStack[region].flatMap((track) =>
			track.map((slot: PaletteToolbarTrack[number]) => slot.toolbar)
		)
	}

	function getInsertionPointsInTrack(
		region: PaletteContainerRegion,
		track: number
	): readonly PaletteInsertionPoint[] {
		const regionTrack = container.toolbarStack[region][track]
		if (!regionTrack) throw new Error(`Track ${track} not found in region '${region}'`)
		const toolbars = regionTrack.map((slot) => slot.toolbar)
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
		return container.toolbarStack[region].flatMap((_, track) =>
			getInsertionPointsInTrack(region, track)
		)
	}

	function getInsertionPoints(): readonly PaletteInsertionPoint[] {
		return regions().flatMap((region) => getInsertionPointsInRegion(region))
	}

	return {
		get editMode() {
			return container.editMode
		},
		set editMode(value: boolean) {
			container.editMode = value
		},
		get toolbarStack() {
			return container.toolbarStack
		},
		get parkedToolbars() {
			return container.parkedToolbars ?? []
		},
		get insertionPoints() {
			return [...getInsertionPoints()]
		},
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
