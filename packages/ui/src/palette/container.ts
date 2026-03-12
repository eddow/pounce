import { lift } from 'mutts'
import type { PaletteModel } from './model'
import type {
	PaletteContainerDropTarget,
	PaletteContainerRegion,
	PaletteContainerSurface,
	PaletteInsertionPoint,
	PaletteSurfaceType,
	PaletteToolbarSurface,
} from './types'

// Internal mutable version of container configuration for reactive updates
interface MutablePaletteContainerConfiguration {
	surfaces: PaletteContainerSurface[]
	editMode: boolean
	dropTargets?: PaletteContainerDropTarget[]
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
	let nextSurfaceId =
		container.surfaces.reduce((maxId, surface) => {
			const numericId = Number.parseInt(surface.id, 10)
			return Number.isNaN(numericId) ? maxId : Math.max(maxId, numericId)
		}, 0) + 1

	function enterEditMode(): void {
		container.editMode = true
	}

	function exitEditMode(): void {
		container.editMode = false
	}

	const dropTargets = lift`paletteContainerModel.dropTargets`(() => {
		if (!container.editMode) {
			return []
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

		return targets
	})

	function createSurface(
		region: PaletteContainerRegion,
		type: PaletteSurfaceType,
		label?: string
	): PaletteContainerSurface {
		const id = generateSurfaceId(type)
		if (type === 'toolbar') {
			const surface: PaletteToolbarSurface = {
				id,
				type: 'toolbar',
				region,
				visible: true,
				position: getSurfacesInRegion(region).length,
				label: label ?? generateDefaultLabel(id, type),
				items: [],
			}
			container.surfaces = [...container.surfaces, surface]
			return surface
		}

		if (type === 'status') {
			const surface: PaletteContainerSurface = {
				id,
				type: 'status',
				region,
				visible: true,
				position: getSurfacesInRegion(region).length,
				label: label ?? generateDefaultLabel(id, type),
				items: [],
			}
			container.surfaces = [...container.surfaces, surface]
			return surface
		}

		const surface: PaletteContainerSurface = {
			id,
			type,
			region,
			visible: true,
			position: getSurfacesInRegion(region).length,
			label: label ?? generateDefaultLabel(id, type),
		}
		container.surfaces = [...container.surfaces, surface]
		return surface
	}

	function removeSurface(surfaceId: string): void {
		const surface = container.surfaces.find((s) => s.id === surfaceId)
		if (!surface) {
			throw new Error(`Surface '${surfaceId}' not found`)
		}

		container.surfaces = container.surfaces.filter((s) => s.id !== surfaceId)
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
		void type
		return String(nextSurfaceId++)
	}

	function generateDefaultLabel(id: string, type: PaletteSurfaceType): string {
		switch (type) {
			case 'toolbar':
				return `Toolbar ${id}`
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
			return dropTargets
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
