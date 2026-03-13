import { beforeEach, describe, expect, it } from 'vitest'
import { paletteContainerModel } from './container'
import { createPaletteModel } from './model'
import type { PaletteToolbar } from './types'

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
		expect(container.getToolbarsInRegion('top')).toEqual([])
		expect(container.getToolbarsInRegion('right')).toEqual([])
		expect(container.getToolbarsInRegion('bottom')).toEqual([])
		expect(container.getToolbarsInRegion('left')).toEqual([])
		expect(container.insertionPoints).toHaveLength(4)
	})

	it('should enter and exit edit mode', () => {
		const container = paletteContainerModel({ palette })

		container.enterEditMode()
		expect(container.editMode).toBe(true)

		container.exitEditMode()
		expect(container.editMode).toBe(false)
	})

	it('should create toolbars in different regions', () => {
		const container = paletteContainerModel({ palette })

		const toolbar = container.createToolbar('top', 0, 'Main Toolbar')

		expect(toolbar).toEqual({
			title: 'Main Toolbar',
			items: [],
		})
		expect(container.getToolbarsInRegion('top')).toHaveLength(1)
	})

	it('should remove toolbars', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top')
		const toolbar = container.getToolbarsInRegion('top')[0]
		expect(container.getToolbarsInRegion('top')).toHaveLength(1)

		container.removeToolbar(toolbar)
		expect(container.getToolbarsInRegion('top')).toHaveLength(0)
	})

	it('should park toolbars', () => {
		const container = paletteContainerModel({ palette })
		container.createToolbar('top', 0, 'Park Me')
		const toolbar = container.getToolbarsInRegion('top')[0]

		container.parkToolbar(toolbar)

		expect(container.getToolbarsInRegion('top')).toHaveLength(0)
		expect(container.parkedToolbars).toEqual([toolbar])
	})

	it('should restore parked toolbars via moveToolbar', () => {
		const container = paletteContainerModel({ palette })
		const parked = container.addParkedToolbar({ title: 'Parked', items: [] })

		container.moveToolbar(parked, { region: 'left', track: 0, index: 0 })

		expect(container.parkedToolbars).toEqual([])
		expect(container.getToolbarsInRegion('left')).toEqual([parked])
	})

	it('should remove parked toolbars', () => {
		const container = paletteContainerModel({ palette })
		const parked = container.addParkedToolbar({ title: 'Parked', items: [] })

		container.removeToolbar(parked)

		expect(container.parkedToolbars).toEqual([])
	})

	it('should move toolbars within the same region', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top', 0, 'Toolbar 1')
		container.createToolbar('top', 0, 'Toolbar 2')
		container.createToolbar('top', 0, 'Toolbar 3')
		const toolbar3 = container.getToolbarsInRegion('top')[2]

		container.moveToolbar(toolbar3, { region: 'top', track: 0, index: 0 })

		const topToolbars = container.getToolbarsInRegion('top')
		expect(topToolbars.map((toolbar) => toolbar.title)).toEqual([
			'Toolbar 3',
			'Toolbar 1',
			'Toolbar 2',
		])
	})

	it('should move toolbars between regions', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top')
		const toolbar = container.getToolbarsInRegion('top')[0]
		expect(container.getToolbarsInRegion('top')).toHaveLength(1)
		expect(container.getToolbarsInRegion('right')).toHaveLength(0)

		container.moveToolbar(toolbar, { region: 'right', track: 0, index: 0 })

		expect(container.getToolbarsInRegion('top')).toHaveLength(0)
		expect(container.getToolbarsInRegion('right')).toHaveLength(1)

		const movedToolbar = container.getToolbarsInRegion('right')[0]
		expect(movedToolbar).toEqual(toolbar)
	})

	it('should rename toolbars', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top', 0, 'Original Name')
		const toolbar = container.getToolbarsInRegion('top')[0]
		expect(toolbar.title).toBe('Original Name')

		container.renameToolbar(toolbar, 'New Name')

		const renamedToolbar = container.getToolbarsInRegion('top')[0]
		expect(renamedToolbar?.title).toBe('New Name')
	})

	it('should get toolbars in region with correct ordering', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top')
		container.createToolbar('top')
		container.createToolbar('right')

		const topToolbars = container.getToolbarsInRegion('top')
		expect(topToolbars).toHaveLength(2)
		expect(topToolbars[0]).toEqual({ title: undefined, items: [] })
		expect(topToolbars[1]).toEqual({ title: undefined, items: [] })

		const rightToolbars = container.getToolbarsInRegion('right')
		expect(rightToolbars).toHaveLength(1)
		expect(rightToolbars[0]).toEqual({ title: undefined, items: [] })
	})

	it('should generate insertion points correctly', () => {
		const container = paletteContainerModel({ palette })

		const toolbar1 = container.createToolbar('top')
		const toolbar2 = container.createToolbar('top')

		const insertionPoints = container.getInsertionPointsInRegion('top')
		expect(insertionPoints).toHaveLength(3)

		expect(insertionPoints[0]).toEqual({
			region: 'top',
			track: 0,
			index: 0,
			after: undefined,
			before: toolbar1,
		})

		expect(insertionPoints[1]).toEqual({
			region: 'top',
			track: 0,
			index: 1,
			after: toolbar1,
			before: toolbar2,
		})

		expect(insertionPoints[2]).toEqual({
			region: 'top',
			track: 0,
			index: 2,
			after: toolbar2,
			before: undefined,
		})
	})

	it('should keep insertion points reactive after mutations', () => {
		const container = paletteContainerModel({ palette })

		const initialInsertionPoints = container.insertionPoints
		expect(initialInsertionPoints).toHaveLength(4)

		container.createToolbar('top')
		container.createToolbar('top')

		const updatedInsertionPoints = container.insertionPoints
		expect(updatedInsertionPoints).toHaveLength(6)

		container.removeToolbar(container.getToolbarsInRegion('top')[0])

		const finalInsertionPoints = container.insertionPoints
		expect(finalInsertionPoints).toHaveLength(5)
	})

	it('should create toolbars with embedded items', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top', 0, 'Test Toolbar')
		const toolbar = container.getToolbarsInRegion('top')[0]

		expect(toolbar.items).toEqual([])
		expect(container.getToolbarsInRegion('top')).toEqual(expect.arrayContaining([toolbar]))

		container.removeToolbar(toolbar)
		expect(container.getToolbarsInRegion('top')).toEqual([])
	})

	it('should handle cross-region moves with populated destinations', () => {
		const container = paletteContainerModel({ palette })

		container.createToolbar('top')
		container.createToolbar('right')
		container.createToolbar('right')
		const toolbar1 = container.getToolbarsInRegion('top')[0]

		container.moveToolbar(toolbar1, { region: 'right', track: 0, index: 1 })

		const rightToolbars = container.getToolbarsInRegion('right')
		expect(rightToolbars).toHaveLength(3)
		expect(container.toolbarStack.right[0].slots.map((slot) => slot.toolbar)).toEqual(rightToolbars)
		expect(container.toolbarStack.right[0].slots).toHaveLength(3)
	})

	it('should handle errors for invalid operations', () => {
		const container = paletteContainerModel({ palette })
		const missingToolbar = { items: [] } as PaletteToolbar

		expect(() => container.removeToolbar(missingToolbar)).toThrow('Toolbar not found')
		expect(() =>
			container.moveToolbar(missingToolbar, { region: 'right', track: 0, index: 0 })
		).toThrow('Toolbar not found')
		expect(() => container.renameToolbar(missingToolbar, 'New Name')).toThrow('Toolbar not found')
	})
})
