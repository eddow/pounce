import type { PaletteModel } from './model'
import type {
	PaletteContainerDropTarget,
	PaletteContainerRegion,
	PaletteContainerSurface,
	PaletteDisplayItem,
	PaletteInsertionPoint,
	PaletteSurfaceType,
	PaletteToolbarDefinition,
} from './types'

// Internal mutable version of container configuration for reactive updates
interface MutablePaletteContainerConfiguration {
	surfaces: PaletteContainerSurface[]
	editMode: boolean
	dropTargets?: PaletteContainerDropTarget[]
}

// Internal mutable version of display configuration for reactive updates
interface MutablePaletteDisplayConfiguration {
	toolbars: PaletteToolbarDefinition[]
	statusbar?: PaletteDisplayItem[]
	container?: MutablePaletteContainerConfiguration
}

export interface PaletteContainerModel {
	readonly editMode: boolean
	readonly surfaces: readonly PaletteContainerSurface[]
	readonly dropTargets: readonly PaletteContainerDropTarget[]
	readonly insertionPoints: readonly PaletteInsertionPoint[]

	enterEditMode(): void
	exitEditMode(): void
	createSurface(
		region: PaletteContainerRegion,
		type: PaletteSurfaceType,
		label?: string
	): PaletteContainerSurface
	removeSurface(surfaceId: string): void
	moveSurface(surfaceId: string, targetRegion: PaletteContainerRegion, targetIndex?: number): void
	renameSurface(surfaceId: string, label: string): void
	showSurface(surfaceId: string): void
	hideSurface(surfaceId: string): void
	getSurfacesInRegion(region: PaletteContainerRegion): readonly PaletteContainerSurface[]
	getInsertionPointsInRegion(region: PaletteContainerRegion): readonly PaletteInsertionPoint[]
}

export function paletteContainerModel(props: { palette: PaletteModel }): PaletteContainerModel {
	const { palette } = props

	// Container configuration should already be initialized by createPaletteModel
	const container = palette.display.container as MutablePaletteContainerConfiguration

	function enterEditMode(): void {
		container.editMode = true
		updateDropTargets()
	}

	function exitEditMode(): void {
		container.editMode = false
		container.dropTargets = []
	}

	function updateDropTargets(): void {
		if (!container.editMode) {
			container.dropTargets = []
			return
		}

		const targets: PaletteContainerDropTarget[] = []
		const regions: PaletteContainerRegion[] = ['top', 'right', 'bottom', 'left']

		for (const region of regions) {
			const regionSurfaces = getSurfacesInRegion(region)

			// Add drop target at the beginning of region
			targets.push({ region, position: 0 })

			// Add drop targets between surfaces
			for (let i = 0; i < regionSurfaces.length; i++) {
				targets.push({
					region,
					position: i + 1,
					surfaceId: regionSurfaces[i].id,
				})
			}
		}

		container.dropTargets = targets
	}

	function createSurface(
		region: PaletteContainerRegion,
		type: PaletteSurfaceType,
		label?: string
	): PaletteContainerSurface {
		const id = generateSurfaceId(type)
		const surface: PaletteContainerSurface = {
			id,
			type,
			region,
			visible: true,
			position: getSurfacesInRegion(region).length,
			label: label ?? generateDefaultLabel(id, type),
		}

		// If creating a toolbar surface, also create a corresponding toolbar definition
		if (type === 'toolbar') {
			const mutableDisplay = palette.display as MutablePaletteDisplayConfiguration
			const newToolbar: PaletteToolbarDefinition = {
				id,
				items: [],
			}
			mutableDisplay.toolbars = [...palette.display.toolbars, newToolbar]
		}

		container.surfaces = [...container.surfaces, surface]
		updateDropTargets()
		return surface
	}

	function removeSurface(surfaceId: string): void {
		const surface = container.surfaces.find((s) => s.id === surfaceId)
		if (!surface) {
			throw new Error(`Surface '${surfaceId}' not found`)
		}

		// If removing a toolbar surface, also remove the corresponding toolbar definition
		if (surface.type === 'toolbar') {
			const mutableDisplay = palette.display as MutablePaletteDisplayConfiguration
			mutableDisplay.toolbars = palette.display.toolbars.filter((t) => t.id !== surfaceId)
		}

		container.surfaces = container.surfaces.filter((s) => s.id !== surfaceId)
		updateDropTargets()
	}

	function moveSurface(
		surfaceId: string,
		targetRegion: PaletteContainerRegion,
		targetIndex?: number
	): void {
		const surface = container.surfaces.find((s) => s.id === surfaceId)
		if (!surface) {
			throw new Error(`Surface '${surfaceId}' not found`)
		}

		// Remove surface from current position
		const otherSurfaces = container.surfaces.filter((s) => s.id !== surfaceId)

		// Normalize positions: remove gap from removed surface
		const normalizedSurfaces = otherSurfaces.map((s) => {
			if (s.region === surface.region && (s.position ?? 0) > (surface.position ?? 0)) {
				return { ...s, position: (s.position ?? 0) - 1 }
			}
			return s
		})

		// Insert surface at new position and normalize target region
		const targetRegionSurfaces = normalizedSurfaces.filter((s) => s.region === targetRegion)
		const finalIndex = Math.min(
			targetIndex ?? targetRegionSurfaces.length,
			targetRegionSurfaces.length
		)

		// Shift surfaces in target region to make room
		const shiftedSurfaces = normalizedSurfaces.map((s) => {
			if (s.region === targetRegion && (s.position ?? 0) >= finalIndex) {
				return { ...s, position: (s.position ?? 0) + 1 }
			}
			return s
		})

		// Insert the moved surface
		const updatedSurface = { ...surface, region: targetRegion, position: finalIndex }
		const newSurfaces = [...shiftedSurfaces, updatedSurface]

		// Sort by region and position for consistent ordering
		newSurfaces.sort((a, b) => {
			const regionOrder = ['top', 'right', 'bottom', 'left']
			const aRegionIndex = regionOrder.indexOf(a.region)
			const bRegionIndex = regionOrder.indexOf(b.region)

			if (aRegionIndex !== bRegionIndex) {
				return aRegionIndex - bRegionIndex
			}

			return (a.position ?? 0) - (b.position ?? 0)
		})

		container.surfaces = newSurfaces
		updateDropTargets()
	}

	function renameSurface(surfaceId: string, label: string): void {
		const surface = container.surfaces.find((s) => s.id === surfaceId)
		if (!surface) {
			throw new Error(`Surface '${surfaceId}' not found`)
		}

		container.surfaces = container.surfaces.map((s) => (s.id === surfaceId ? { ...s, label } : s))
	}

	function showSurface(surfaceId: string): void {
		const surface = container.surfaces.find((s) => s.id === surfaceId)
		if (!surface) {
			throw new Error(`Surface '${surfaceId}' not found`)
		}

		container.surfaces = container.surfaces.map((s) =>
			s.id === surfaceId ? { ...s, visible: true } : s
		)
	}

	function hideSurface(surfaceId: string): void {
		const surface = container.surfaces.find((s) => s.id === surfaceId)
		if (!surface) {
			throw new Error(`Surface '${surfaceId}' not found`)
		}

		container.surfaces = container.surfaces.map((s) =>
			s.id === surfaceId ? { ...s, visible: false } : s
		)
	}

	function getSurfacesInRegion(region: PaletteContainerRegion): readonly PaletteContainerSurface[] {
		return container.surfaces
			.filter((s) => s.region === region)
			.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
	}

	function getInsertionPointsInRegion(
		region: PaletteContainerRegion
	): readonly PaletteInsertionPoint[] {
		const regionSurfaces = getSurfacesInRegion(region)
		const points: PaletteInsertionPoint[] = []

		// Add insertion point at the beginning
		points.push({
			region,
			index: 0,
			after: undefined,
			before: regionSurfaces[0],
		})

		// Add insertion points between surfaces
		for (let i = 0; i < regionSurfaces.length - 1; i++) {
			points.push({
				region,
				index: i + 1,
				after: regionSurfaces[i],
				before: regionSurfaces[i + 1],
			})
		}

		// Add insertion point at the end
		if (regionSurfaces.length > 0) {
			points.push({
				region,
				index: regionSurfaces.length,
				after: regionSurfaces[regionSurfaces.length - 1],
				before: undefined,
			})
		}

		return points
	}

	function generateSurfaceId(type: PaletteSurfaceType): string {
		const existingSurfaces = container.surfaces.filter((s) => s.type === type)
		const counter = existingSurfaces.length + 1
		return `${type}-${counter}`
	}

	function generateDefaultLabel(id: string, type: PaletteSurfaceType): string {
		switch (type) {
			case 'toolbar':
				return `Toolbar ${id.split('-')[1] ?? '1'}`
			case 'command':
				return 'Command Palette'
			case 'settings':
				return 'Settings'
			default:
				return id
		}
	}

	// Reactive insertion points computed on demand
	function getInsertionPoints(): readonly PaletteInsertionPoint[] {
		const points: PaletteInsertionPoint[] = []
		const regions: PaletteContainerRegion[] = ['top', 'right', 'bottom', 'left']

		for (const region of regions) {
			points.push(...getInsertionPointsInRegion(region))
		}

		return points
	}

	return {
		get editMode() {
			return container.editMode
		},
		get surfaces() {
			return container.surfaces
		},
		get dropTargets() {
			return container.dropTargets ?? []
		},
		get insertionPoints() {
			return getInsertionPoints()
		},

		enterEditMode,
		exitEditMode,
		createSurface,
		removeSurface,
		moveSurface,
		renameSurface,
		showSurface,
		hideSurface,
		getSurfacesInRegion,
		getInsertionPointsInRegion,
	}
}

// Helper function to link toolbar definitions with container surfaces
export interface PaletteContainerSurfaceModel {
	readonly surface: PaletteContainerSurface
	readonly toolbar?: PaletteToolbarDefinition
	readonly isLinked: boolean
}

export function resolveContainerSurface(
	surface: PaletteContainerSurface,
	palette: PaletteModel
): PaletteContainerSurfaceModel {
	if (surface.type === 'toolbar') {
		const toolbar = palette.display.toolbars.find((t) => t.id === surface.id)
		return {
			surface,
			toolbar,
			isLinked: toolbar !== undefined,
		}
	}

	return {
		surface,
		isLinked: false,
	}
}
