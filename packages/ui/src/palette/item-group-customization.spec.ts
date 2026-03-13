import { describe, expect, it } from 'vitest'
import { paletteDisplayCustomizationModel } from './display'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem, PaletteToolbar } from './types'

function toolbarFixture(items: readonly PaletteDisplayItem[]): PaletteToolbar {
	return {
		items,
	}
}

function containerFixture(...toolbars: PaletteToolbar[]) {
	return {
		editMode: false,
		toolbarStack: {
			top: {
				slots: toolbars.map((toolbar, index) => ({
					toolbar,
					space: 1 / (toolbars.length + 1 - index),
				})),
			},
			right: { slots: [] },
			bottom: { slots: [] },
			left: { slots: [] },
		},
	}
}

function toolbarAt(palette: ReturnType<typeof createPaletteModel>, index: number): PaletteToolbar {
	return palette.display.container!.toolbarStack.top.slots[index].toolbar
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
				container: containerFixture(
					toolbarFixture([
						{
							kind: 'item-group',
							group: {
								kind: 'enum-options',
								entryId: 'ui.theme',
								options: ['light', 'dark'],
								presenter: 'radio-group',
							},
						},
					])
				),
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
				container: containerFixture(
					toolbarFixture([
						{
							kind: 'item-group',
							group: {
								kind: 'enum-options',
								entryId: 'ui.theme',
								options: ['light', 'dark'],
								presenter: 'radio-group',
							},
						},
					])
				),
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
				container: containerFixture(toolbarFixture([])),
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
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
				container: containerFixture(
					toolbarFixture([
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
					])
				),
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
				container: containerFixture(
					toolbarFixture([
						{
							kind: 'item-group',
							group: {
								kind: 'enum-options',
								entryId: 'ui.theme',
								options: ['light', 'dark'],
								presenter: 'radio-group',
							},
						},
					])
				),
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
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
		expect(toolbar.items.every((item: PaletteDisplayItem) => item.kind === 'item-group')).toBe(true)

		if (toolbar.items[0].kind === 'item-group' && toolbar.items[1].kind === 'item-group') {
			expect(toolbar.items[0].group.options).toHaveLength(2)
			expect(toolbar.items[1].group.options).toHaveLength(3)
		}
	})
})
