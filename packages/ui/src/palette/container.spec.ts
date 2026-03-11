import { beforeEach, describe, expect, it } from 'vitest'
import { paletteContainerModel, resolveContainerSurface } from './container'
import { createPaletteModel } from './model'
import type { PaletteContainerRegion, PaletteSurfaceType, PaletteToolbarDefinition } from './types'

describe('paletteContainerModel', () => {
	let palette: ReturnType<typeof createPaletteModel>

	beforeEach(() => {
		palette = createPaletteModel({
			definitions: [
				{
					id: 'test.boolean',
					label: 'Test Boolean',
					schema: { type: 'boolean' },
				},
			],
			intents: [
				{
					id: 'test.boolean:toggle',
					targetId: 'test.boolean',
					mode: 'toggle',
				},
			],
		})
	})

	it('should initialize with empty container configuration', () => {
		const container = paletteContainerModel({ palette })

		expect(container.editMode).toBe(false)
		expect(container.surfaces).toEqual([])
		expect(container.dropTargets).toEqual([])
		expect(container.insertionPoints).toHaveLength(4) // One for each region
	})

	it('should enter and exit edit mode', () => {
		const container = paletteContainerModel({ palette })

		container.enterEditMode()
		expect(container.editMode).toBe(true)
		expect(container.dropTargets.length).toBeGreaterThan(0)

		container.exitEditMode()
		expect(container.editMode).toBe(false)
		expect(container.dropTargets).toEqual([])
	})

	it('should create surfaces in different regions', () => {
		const container = paletteContainerModel({ palette })

		const toolbar = container.createSurface('top', 'toolbar', 'Main Toolbar')
		const command = container.createSurface('right', 'command')
		const settings = container.createSurface('bottom', 'settings', 'App Settings')

		expect(toolbar).toEqual({
			id: 'toolbar-1',
			type: 'toolbar',
			region: 'top',
			visible: true,
			position: 0,
			label: 'Main Toolbar',
		})

		expect(command).toEqual({
			id: 'command-1',
			type: 'command',
			region: 'right',
			visible: true,
			position: 0,
			label: 'Command Palette',
		})

		expect(settings).toEqual({
			id: 'settings-1',
			type: 'settings',
			region: 'bottom',
			visible: true,
			position: 0,
			label: 'App Settings',
		})

		expect(container.surfaces).toHaveLength(3)
	})

	it('should remove surfaces', () => {
		const container = paletteContainerModel({ palette })

		const surface = container.createSurface('top', 'toolbar')
		expect(container.surfaces).toHaveLength(1)

		container.removeSurface(surface.id)
		expect(container.surfaces).toHaveLength(0)
	})

	it('should move surfaces within the same region', () => {
		const container = paletteContainerModel({ palette })

		const surface1 = container.createSurface('top', 'toolbar', 'Toolbar 1')
		const surface2 = container.createSurface('top', 'toolbar', 'Toolbar 2')
		const surface3 = container.createSurface('top', 'toolbar', 'Toolbar 3')

		// Move surface3 to position 0 (beginning)
		container.moveSurface(surface3.id, 'top', 0)

		const topSurfaces = container.getSurfacesInRegion('top')
		expect(topSurfaces.map((s) => s.id)).toEqual([surface3.id, surface1.id, surface2.id])
	})

	it('should move surfaces between regions', () => {
		const container = paletteContainerModel({ palette })

		const surface = container.createSurface('top', 'toolbar')
		expect(container.getSurfacesInRegion('top')).toHaveLength(1)
		expect(container.getSurfacesInRegion('right')).toHaveLength(0)

		container.moveSurface(surface.id, 'right')

		expect(container.getSurfacesInRegion('top')).toHaveLength(0)
		expect(container.getSurfacesInRegion('right')).toHaveLength(1)

		const movedSurface = container.getSurfacesInRegion('right')[0]
		expect(movedSurface.id).toBe(surface.id)
		expect(movedSurface.region).toBe('right')
	})

	it('should rename surfaces', () => {
		const container = paletteContainerModel({ palette })

		const surface = container.createSurface('top', 'toolbar', 'Original Name')
		expect(surface.label).toBe('Original Name')

		container.renameSurface(surface.id, 'New Name')

		const renamedSurface = container.surfaces.find((s) => s.id === surface.id)
		expect(renamedSurface?.label).toBe('New Name')
	})

	it('should show and hide surfaces', () => {
		const container = paletteContainerModel({ palette })

		const surface = container.createSurface('top', 'toolbar')
		expect(surface.visible).toBe(true)

		container.hideSurface(surface.id)
		let hiddenSurface = container.surfaces.find((s) => s.id === surface.id)
		expect(hiddenSurface?.visible).toBe(false)

		container.showSurface(surface.id)
		let shownSurface = container.surfaces.find((s) => s.id === surface.id)
		expect(shownSurface?.visible).toBe(true)
	})

	it('should get surfaces in region with correct ordering', () => {
		const container = paletteContainerModel({ palette })

		const surface1 = container.createSurface('top', 'toolbar')
		const surface2 = container.createSurface('top', 'toolbar')
		const surface3 = container.createSurface('right', 'toolbar')

		const topSurfaces = container.getSurfacesInRegion('top')
		expect(topSurfaces).toHaveLength(2)
		expect(topSurfaces[0].id).toBe(surface1.id)
		expect(topSurfaces[1].id).toBe(surface2.id)

		const rightSurfaces = container.getSurfacesInRegion('right')
		expect(rightSurfaces).toHaveLength(1)
		expect(rightSurfaces[0].id).toBe(surface3.id)
	})

	it('should generate insertion points correctly', () => {
		const container = paletteContainerModel({ palette })

		const surface1 = container.createSurface('top', 'toolbar')
		const surface2 = container.createSurface('top', 'toolbar')

		const insertionPoints = container.getInsertionPointsInRegion('top')
		expect(insertionPoints).toHaveLength(3) // Before first, between, after last

		expect(insertionPoints[0]).toEqual({
			region: 'top',
			index: 0,
			after: undefined,
			before: surface1,
		})

		expect(insertionPoints[1]).toEqual({
			region: 'top',
			index: 1,
			after: surface1,
			before: surface2,
		})

		expect(insertionPoints[2]).toEqual({
			region: 'top',
			index: 2,
			after: surface2,
			before: undefined,
		})
	})

	it('should keep insertion points reactive after mutations', () => {
		const container = paletteContainerModel({ palette })

		// Initial state
		const initialInsertionPoints = container.insertionPoints
		expect(initialInsertionPoints).toHaveLength(4) // One per region

		// Create surfaces
		const surface1 = container.createSurface('top', 'toolbar')
		const surface2 = container.createSurface('top', 'toolbar')

		// Insertion points should update
		const updatedInsertionPoints = container.insertionPoints
		expect(updatedInsertionPoints).toHaveLength(6) // More insertion points with surfaces

		// Remove a surface
		container.removeSurface(surface1.id)

		// Insertion points should update again
		const finalInsertionPoints = container.insertionPoints
		expect(finalInsertionPoints).toHaveLength(5) // Back to fewer insertion points
	})

	it('should couple toolbar surfaces with toolbar definitions', () => {
		const container = paletteContainerModel({ palette })

		// Create a toolbar surface
		const surface = container.createSurface('top', 'toolbar', 'Test Toolbar')

		// Should create corresponding toolbar definition
		expect(palette.display.toolbars).toHaveLength(1)
		expect(palette.display.toolbars[0]).toEqual({
			id: surface.id,
			items: [],
		})

		// Remove the surface
		container.removeSurface(surface.id)

		// Should also remove toolbar definition
		expect(palette.display.toolbars).toHaveLength(0)
	})

	it('should handle cross-region moves with populated destinations', () => {
		const container = paletteContainerModel({ palette })

		// Create surfaces in multiple regions
		const surface1 = container.createSurface('top', 'toolbar')
		const surface2 = container.createSurface('right', 'toolbar')
		const surface3 = container.createSurface('right', 'toolbar')

		// Move surface1 to right region at position 1 (between surface2 and surface3)
		container.moveSurface(surface1.id, 'right', 1)

		const rightSurfaces = container.getSurfacesInRegion('right')
		expect(rightSurfaces.map((s) => s.id)).toEqual([surface2.id, surface1.id, surface3.id])

		// Verify position normalization
		expect(rightSurfaces[0].position).toBe(0)
		expect(rightSurfaces[1].position).toBe(1)
		expect(rightSurfaces[2].position).toBe(2)
	})

	it('should support status surface type', () => {
		const container = paletteContainerModel({ palette })

		const statusSurface = container.createSurface('bottom', 'status', 'Status Bar')

		expect(statusSurface.type).toBe('status')
		expect(statusSurface.label).toBe('Status Bar')
		expect(container.surfaces).toEqual(expect.arrayContaining([statusSurface]))
	})

	it('should handle errors for invalid operations', () => {
		const container = paletteContainerModel({ palette })

		expect(() => container.removeSurface('non-existent')).toThrow(
			"Surface 'non-existent' not found"
		)
		expect(() => container.moveSurface('non-existent', 'right')).toThrow(
			"Surface 'non-existent' not found"
		)
		expect(() => container.renameSurface('non-existent', 'New Name')).toThrow(
			"Surface 'non-existent' not found"
		)
		expect(() => container.hideSurface('non-existent')).toThrow("Surface 'non-existent' not found")
		expect(() => container.showSurface('non-existent')).toThrow("Surface 'non-existent' not found")
	})
})

describe('resolveContainerSurface', () => {
	let palette: ReturnType<typeof createPaletteModel>

	beforeEach(() => {
		palette = createPaletteModel({
			display: {
				toolbars: [
					{
						id: 'toolbar-1',
						items: [],
					},
				],
			},
		})
	})

	it('should resolve toolbar surfaces', () => {
		const surface = {
			id: 'toolbar-1',
			type: 'toolbar' as PaletteSurfaceType,
			region: 'top' as PaletteContainerRegion,
			visible: true,
		}

		const resolved = resolveContainerSurface(surface, palette)

		expect(resolved.isLinked).toBe(true)
		expect(resolved.surface).toEqual(surface)
		expect(resolved.toolbar).toEqual({
			id: 'toolbar-1',
			items: [],
		})
	})

	it('should resolve unlinked toolbar surfaces', () => {
		const surface = {
			id: 'toolbar-2',
			type: 'toolbar' as PaletteSurfaceType,
			region: 'top' as PaletteContainerRegion,
			visible: true,
		}

		const resolved = resolveContainerSurface(surface, palette)

		expect(resolved.isLinked).toBe(false)
		expect(resolved.surface).toEqual(surface)
		expect(resolved.toolbar).toBeUndefined()
	})

	it('should resolve non-toolbar surfaces', () => {
		const commandSurface = {
			id: 'command-1',
			type: 'command' as PaletteSurfaceType,
			region: 'right' as PaletteContainerRegion,
			visible: true,
		}

		const settingsSurface = {
			id: 'settings-1',
			type: 'settings' as PaletteSurfaceType,
			region: 'bottom' as PaletteContainerRegion,
			visible: true,
		}

		const commandResolved = resolveContainerSurface(commandSurface, palette)
		expect(commandResolved.isLinked).toBe(false)
		expect(commandResolved.toolbar).toBeUndefined()

		const settingsResolved = resolveContainerSurface(settingsSurface, palette)
		expect(settingsResolved.isLinked).toBe(false)
		expect(settingsResolved.toolbar).toBeUndefined()
	})
})
