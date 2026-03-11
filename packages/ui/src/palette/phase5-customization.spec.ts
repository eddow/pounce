import { describe, expect, it } from 'vitest'
import { paletteDisplayCustomizationModel } from './display'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem } from './types'

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
				toolbars: [
					{
						id: 'main',
						items: [],
					},
				],
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
		customization.addToToolbar('main', itemGroup)

		const toolbar = palette.display.toolbars[0]
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
				toolbars: [
					{
						id: 'main',
						items: [
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						],
					},
				],
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
		const itemId = 'group:ui.theme:enum-options:dark|light'

		// Remove from toolbar
		customization.removeFromToolbar('main', itemId, 'item-group')

		const toolbar = palette.display.toolbars[0]
		expect(toolbar.items).toHaveLength(0)
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
				toolbars: [
					{
						id: 'main',
						items: [
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
						],
					},
				],
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
		const itemGroupId = 'group:ui.theme:enum-options:dark|light'

		// Move from index 1 to index 0
		customization.moveWithinToolbar('main', itemGroupId, 'item-group', 0)

		const toolbar = palette.display.toolbars[0]
		expect(toolbar.items).toHaveLength(2)
		expect(toolbar.items[0].kind).toBe('item-group')
		expect(toolbar.items[1].kind).toBe('intent')
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
				toolbars: [
					{
						id: 'source',
						items: [
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						],
					},
					{
						id: 'target',
						items: [],
					},
				],
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
		const itemGroupId = 'group:ui.theme:enum-options:dark|light'

		// Move between toolbars
		customization.moveToToolbar('source', itemGroupId, 'item-group', 'target', 0)

		const sourceToolbar = palette.display.toolbars[0]
		const targetToolbar = palette.display.toolbars[1]

		expect(sourceToolbar.items).toHaveLength(0)
		expect(targetToolbar.items).toHaveLength(1)
		expect(targetToolbar.items[0].kind).toBe('item-group')
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
				toolbars: [
					{
						id: 'main',
						items: [
							{ kind: 'intent', intentId: 'ui.theme:set:light' },
							{ kind: 'intent', intentId: 'ui.theme:set:dark' },
						],
					},
				],
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
		customization.addToToolbar('main', itemGroup)

		const toolbar = palette.display.toolbars[0]
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
				toolbars: [
					{
						id: 'main',
						items: [
							{
								kind: 'item-group',
								group: {
									kind: 'enum-options',
									entryId: 'ui.theme',
									options: ['light', 'dark'],
									presenter: 'radio-group',
								},
							},
						],
					},
				],
			},
		})

		// Verify display data is serializable
		const serialized = JSON.stringify(palette.display)
		const deserialized = JSON.parse(serialized)

		expect(deserialized).toBeDefined()
		expect(deserialized.toolbars).toBeDefined()
		expect(deserialized.toolbars[0].items).toBeDefined()
		expect(deserialized.toolbars[0].items[0].kind).toBe('item-group')
		expect(deserialized.toolbars[0].items[0].group).toBeDefined()

		// Verify it's user-owned (not internal runtime state)
		expect(deserialized.toolbars[0].items[0].group.entryId).toBe('ui.theme')
		expect(deserialized.toolbars[0].items[0].group.options).toEqual(['light', 'dark'])
		expect(deserialized.toolbars[0].items[0].group.presenter).toBe('radio-group')
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
				toolbars: [
					{
						id: 'main',
						items: [{ kind: 'intent', intentId: 'ui.sidebar:toggle' }],
					},
					{
						id: 'secondary',
						items: [],
					},
				],
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

		customization.addToToolbar('main', itemGroup1)
		expect(palette.display.toolbars[0].items).toHaveLength(2)

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

		customization.addToToolbar('secondary', itemGroup2)
		expect(palette.display.toolbars[1].items).toHaveLength(1)

		// 3. Move item-group within toolbar
		const itemGroupId1 = 'group:ui.theme:enum-options:dark|light'
		customization.moveWithinToolbar('main', itemGroupId1, 'item-group', 0)

		const mainToolbar = palette.display.toolbars[0]
		expect(mainToolbar.items[0].kind).toBe('item-group')
		expect(mainToolbar.items[1].kind).toBe('intent')

		// 4. Move between toolbars
		customization.moveToToolbar('main', itemGroupId1, 'item-group', 'secondary', 1)

		expect(palette.display.toolbars[0].items).toHaveLength(1) // Only intent left
		expect(palette.display.toolbars[1].items).toHaveLength(2) // Both groups now

		// 5. Remove one group
		customization.removeFromToolbar('secondary', itemGroupId1, 'item-group')
		expect(palette.display.toolbars[1].items).toHaveLength(1) // Only second group left

		// 6. Change presenter
		const itemGroupId2 = 'group:ui.theme:enum-options:dark|light|system'
		customization.setPresenter('secondary', itemGroupId2, 'item-group', 'radio-group')

		const secondaryToolbar = palette.display.toolbars[1]
		if (secondaryToolbar.items[0].kind === 'item-group') {
			expect(secondaryToolbar.items[0].group.presenter).toBe('radio-group')
		}
	})
})
