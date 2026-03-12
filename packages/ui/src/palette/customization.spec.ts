import { describe, expect, it } from 'vitest'
import { paletteDisplayCustomizationModel } from './display'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem, PaletteToolbarSurface } from './types'

function toolbarSurface(id: string, items: readonly PaletteDisplayItem[]): PaletteToolbarSurface {
	return {
		id,
		type: 'toolbar',
		region: 'top',
		visible: true,
		items,
	}
}

function toolbarAt(
	palette: ReturnType<typeof createPaletteModel>,
	index: number
): PaletteToolbarSurface {
	return palette.display.container!.surfaces[index] as PaletteToolbarSurface
}

describe('Phase 5: Customization model support', () => {
	it('allows adding item-groups to toolbar-like surfaces', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
			display: {
				container: { editMode: false, dropTargets: [], surfaces: [toolbarSurface('main', [])] },
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })

		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		// Add to toolbar
		customization.addToToolbar(toolbarAt(palette, 0), itemGroup)

		const toolbar = toolbarAt(palette, 0)
		expect(toolbar.items).toHaveLength(1)
		expect(toolbar.items[0].kind).toBe('item-group')
	})

	it('allows removing item-groups from surfaces', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('main', [
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						]),
					],
				},
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
		const toolbar = toolbarAt(palette, 0)
		customization.removeFromToolbar(toolbar, toolbar.items[0])

		const updatedToolbar = toolbarAt(palette, 0)
		expect(updatedToolbar.items).toHaveLength(0)
	})

	it('allows moving item-groups within a surface', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
				{
					id: 'ui.sidebar',
					label: 'Sidebar',
					schema: { type: 'boolean' },
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('main', [
							{ kind: 'intent', intentId: 'ui.sidebar:toggle' },
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						]),
					],
				},
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
		const toolbar = toolbarAt(palette, 0)
		customization.moveWithinToolbar(toolbar, toolbar.items[1], 0)

		const updatedToolbar = toolbarAt(palette, 0)
		expect(updatedToolbar.items).toHaveLength(2)
		expect(updatedToolbar.items[0].kind).toBe('item-group')
		expect(updatedToolbar.items[1].kind).toBe('intent')
	})

	it('allows moving item-groups between surfaces', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('source', [
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						]),
						toolbarSurface('target', []),
					],
				},
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
		const sourceToolbar = toolbarAt(palette, 0)
		const targetToolbar = toolbarAt(palette, 1)
		customization.moveToToolbar(sourceToolbar, sourceToolbar.items[0], targetToolbar, 0)

		const updatedSourceToolbar = toolbarAt(palette, 0)
		const updatedTargetToolbar = toolbarAt(palette, 1)

		expect(updatedSourceToolbar.items).toHaveLength(0)
		expect(updatedTargetToolbar.items).toHaveLength(1)
		expect(updatedTargetToolbar.items[0].kind).toBe('item-group')
	})

	it('handles de-duplication between item-groups and atomic items', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('main', [
							{ kind: 'intent', intentId: 'ui.theme:set:light' },
							{ kind: 'intent', intentId: 'ui.theme:set:dark' },
						]),
					],
				},
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })

		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		// Add item-group even though atomic intents with same entry exist
		customization.addToToolbar(toolbarAt(palette, 0), itemGroup)

		const toolbar = toolbarAt(palette, 0)
		expect(toolbar.items).toHaveLength(3)

		// Should have both atomic intents and the item-group
		const intentItems = toolbar.items.filter((item: PaletteDisplayItem) => item.kind === 'intent')
		const groupItems = toolbar.items.filter(
			(item: PaletteDisplayItem) => item.kind === 'item-group'
		)

		expect(intentItems).toHaveLength(2)
		expect(groupItems).toHaveLength(1)
	})

	it('ensures item-group customization remains user-owned serializable display data', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('main', [
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						]),
					],
				},
			},
		})

		// Verify display data is serializable
		const serialized = JSON.stringify(palette.display)
		const deserialized = JSON.parse(serialized)

		expect(deserialized).toBeDefined()
		expect(deserialized.container).toBeDefined()
		expect(deserialized.container.surfaces[0].items).toBeDefined()
		expect(deserialized.container.surfaces[0].items[0].kind).toBe('item-group')
		expect(deserialized.container.surfaces[0].items[0].group).toBeDefined()

		// Verify it's user-owned (not internal runtime state)
		expect(deserialized.container.surfaces[0].items[0].group.entryId).toBe('ui.theme')
		expect(deserialized.container.surfaces[0].items[0].group.options).toEqual(['light', 'dark'])
		expect(deserialized.container.surfaces[0].items[0].group.presenter).toBe('radio-group')
	})

	it('demonstrates comprehensive customization workflow', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
				{
					id: 'ui.sidebar',
					label: 'Sidebar',
					schema: { type: 'boolean' },
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('main', [{ kind: 'intent', intentId: 'ui.sidebar:toggle' }]),
						toolbarSurface('secondary', []),
					],
				},
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })

		// 1. Add item-group to main toolbar
		const itemGroup1: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		customization.addToToolbar(toolbarAt(palette, 0), itemGroup1)
		expect(toolbarAt(palette, 0).items).toHaveLength(2)

		// 2. Add different subset to secondary toolbar
		const itemGroup2: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark', 'system'],
				presenter: 'segmented',
			},
		}

		customization.addToToolbar(toolbarAt(palette, 1), itemGroup2)
		expect(toolbarAt(palette, 1).items).toHaveLength(1)

		// 3. Move item-group within toolbar
		customization.moveWithinToolbar(toolbarAt(palette, 0), toolbarAt(palette, 0).items[1], 0)

		const mainToolbar = toolbarAt(palette, 0)
		expect(mainToolbar.items[0].kind).toBe('item-group')
		expect(mainToolbar.items[1].kind).toBe('intent')

		// 4. Move between toolbars
		customization.moveToToolbar(
			toolbarAt(palette, 0),
			toolbarAt(palette, 0).items[0],
			toolbarAt(palette, 1),
			1
		)

		expect(toolbarAt(palette, 0).items).toHaveLength(1)
		expect(toolbarAt(palette, 1).items).toHaveLength(2)

		// 5. Remove one group
		customization.removeFromToolbar(toolbarAt(palette, 1), toolbarAt(palette, 1).items[1])
		expect(toolbarAt(palette, 1).items).toHaveLength(1)

		// 6. Change presenter
		customization.setPresenter(toolbarAt(palette, 1), toolbarAt(palette, 1).items[0], 'radio-group')

		const secondaryToolbar = toolbarAt(palette, 1)
		if (secondaryToolbar.items[0].kind === 'item-group') {
			expect(secondaryToolbar.items[0].group.presenter).toBe('radio-group')
		}
	})
})
