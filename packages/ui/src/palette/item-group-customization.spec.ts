import { describe, expect, it } from 'vitest'
import { paletteDisplayCustomizationModel } from './display'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem } from './types'

describe('item-group customization behavior', () => {
	it('setPresenter updates group.presenter for item-groups', () => {
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

		// Change presenter from radio-group to segmented
		customization.setPresenter('main', itemId, 'item-group', 'segmented')

		const toolbar = palette.display.toolbars[0]
		const itemGroup = toolbar.items[0]

		expect(itemGroup.kind).toBe('item-group')
		if (itemGroup.kind === 'item-group') {
			expect(itemGroup.group.presenter).toBe('segmented')
		}
	})

	it('setPresenter removes presenter when undefined', () => {
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

		// Remove presenter
		customization.setPresenter('main', itemId, 'item-group', undefined)

		const toolbar = palette.display.toolbars[0]
		const itemGroup = toolbar.items[0]

		expect(itemGroup.kind).toBe('item-group')
		if (itemGroup.kind === 'item-group') {
			expect(itemGroup.group.presenter).toBeUndefined()
		}
	})

	it('add and remove item-groups from toolbar', () => {
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

		// Add item-group
		const itemGroupToAdd: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		customization.addToToolbar('main', itemGroupToAdd)

		let toolbar = palette.display.toolbars[0]
		expect(toolbar.items).toHaveLength(1)
		expect(toolbar.items[0].kind).toBe('item-group')

		// Remove item-group
		const itemId = 'group:ui.theme:enum-options:dark|light'
		customization.removeFromToolbar('main', itemId, 'item-group')

		toolbar = palette.display.toolbars[0]
		expect(toolbar.items).toHaveLength(0)
	})

	it('move item-groups within toolbar', () => {
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

		// Move item-group from index 1 to index 0
		customization.moveWithinToolbar('main', itemGroupId, 'item-group', 0)

		const toolbar = palette.display.toolbars[0]
		expect(toolbar.items).toHaveLength(2)
		expect(toolbar.items[0].kind).toBe('item-group')
		expect(toolbar.items[1].kind).toBe('intent')
	})

	it('distinguishes different option subsets for same entry', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
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

		// Add a different subset of the same entry
		const differentSubset: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark', 'system'],
				presenter: 'segmented',
			},
		}

		customization.addToToolbar('main', differentSubset)

		const toolbar = palette.display.toolbars[0]
		expect(toolbar.items).toHaveLength(2)

		// Both should be added since they have different option subsets
		expect(toolbar.items.every((item: PaletteDisplayItem) => item.kind === 'item-group')).toBe(true)

		if (toolbar.items[0].kind === 'item-group' && toolbar.items[1].kind === 'item-group') {
			expect(toolbar.items[0].group.options).toHaveLength(2)
			expect(toolbar.items[1].group.options).toHaveLength(3)
		}
	})
})
