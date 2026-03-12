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
		customization.setPresenter(toolbar, toolbar.items[0], 'segmented')

		const updatedToolbar = toolbarAt(palette, 0)
		const itemGroup = updatedToolbar.items[0]

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
		customization.setPresenter(toolbar, toolbar.items[0], undefined)

		const updatedToolbar = toolbarAt(palette, 0)
		const itemGroup = updatedToolbar.items[0]

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
				container: { editMode: false, dropTargets: [], surfaces: [toolbarSurface('main', [])] },
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

		customization.addToToolbar(toolbarAt(palette, 0), itemGroupToAdd)

		let toolbar = toolbarAt(palette, 0)
		expect(toolbar.items).toHaveLength(1)
		expect(toolbar.items[0].kind).toBe('item-group')

		// Remove item-group
		customization.removeFromToolbar(toolbar, toolbar.items[0])

		toolbar = toolbarAt(palette, 0)
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

		customization.addToToolbar(toolbarAt(palette, 0), differentSubset)

		const toolbar = toolbarAt(palette, 0)
		expect(toolbar.items).toHaveLength(2)

		// Both should be added since they have different option subsets
		expect(toolbar.items.every((item: PaletteDisplayItem) => item.kind === 'item-group')).toBe(true)

		if (toolbar.items[0].kind === 'item-group' && toolbar.items[1].kind === 'item-group') {
			expect(toolbar.items[0].group.options).toHaveLength(2)
			expect(toolbar.items[1].group.options).toHaveLength(3)
		}
	})
})
