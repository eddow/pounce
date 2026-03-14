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
			top: [
				{
					slots: toolbars.map((toolbar, index) => ({
						toolbar,
						space: 1 / (toolbars.length + 1 - index),
					})),
				},
			],
			right: [{ slots: [] }],
			bottom: [{ slots: [] }],
			left: [{ slots: [] }],
		},
	}
}

function toolbarAt(palette: ReturnType<typeof createPaletteModel>, index: number): PaletteToolbar {
	return palette.display.container!.toolbarStack.top[0].slots[index].toolbar
}

describe('Phase 5: Customization model support', () => {
	it('allows adding item-groups to toolbars', () => {
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
		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		customization.addToToolbar(toolbarAt(palette, 0), itemGroup)

		const toolbar = toolbarAt(palette, 0)
		expect(toolbar.items).toHaveLength(1)
		expect(toolbar.items[0].kind).toBe('item-group')
	})

	it('allows removing item-groups from toolbars', () => {
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
		customization.removeFromToolbar(toolbar, toolbar.items[0])

		const updatedToolbar = toolbarAt(palette, 0)
		expect(updatedToolbar.items).toHaveLength(0)
	})

	it('allows moving item-groups within a toolbar', () => {
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

	it('allows moving item-groups between toolbars', () => {
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
					]),
					toolbarFixture([])
				),
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
				container: containerFixture(
					toolbarFixture([
						{ kind: 'intent', intentId: 'ui.theme:set:light' },
						{ kind: 'intent', intentId: 'ui.theme:set:dark' },
					])
				),
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

		customization.addToToolbar(toolbarAt(palette, 0), itemGroup)

		const toolbar = toolbarAt(palette, 0)
		expect(toolbar.items).toHaveLength(3)

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

		const serialized = JSON.stringify(palette.display)
		const deserialized = JSON.parse(serialized)

		expect(deserialized).toBeDefined()
		expect(deserialized.container).toBeDefined()
		expect(deserialized.container.toolbarStack.top[0].slots[0].toolbar.items).toBeDefined()
		expect(deserialized.container.toolbarStack.top[0].slots[0].toolbar.items[0].kind).toBe(
			'item-group'
		)
		expect(deserialized.container.toolbarStack.top[0].slots[0].toolbar.items[0].group).toBeDefined()
		expect(deserialized.container.toolbarStack.top[0].slots[0].toolbar.items[0].group.entryId).toBe(
			'ui.theme'
		)
		expect(
			deserialized.container.toolbarStack.top[0].slots[0].toolbar.items[0].group.options
		).toEqual(['light', 'dark'])
		expect(
			deserialized.container.toolbarStack.top[0].slots[0].toolbar.items[0].group.presenter
		).toBe('radio-group')
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
				container: containerFixture(
					toolbarFixture([{ kind: 'intent', intentId: 'ui.sidebar:toggle' }]),
					toolbarFixture([])
				),
			},
		})

		const customization = paletteDisplayCustomizationModel({ palette })
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

		customization.moveWithinToolbar(toolbarAt(palette, 0), toolbarAt(palette, 0).items[1], 0)

		const mainToolbar = toolbarAt(palette, 0)
		expect(mainToolbar.items[0].kind).toBe('item-group')
		expect(mainToolbar.items[1].kind).toBe('intent')

		customization.moveToToolbar(
			toolbarAt(palette, 0),
			toolbarAt(palette, 0).items[0],
			toolbarAt(palette, 1),
			1
		)

		expect(toolbarAt(palette, 0).items).toHaveLength(1)
		expect(toolbarAt(palette, 1).items).toHaveLength(2)

		customization.removeFromToolbar(toolbarAt(palette, 1), toolbarAt(palette, 1).items[1])
		expect(toolbarAt(palette, 1).items).toHaveLength(1)

		customization.setPresenter(toolbarAt(palette, 1), toolbarAt(palette, 1).items[0], 'radio-group')

		const secondaryToolbar = toolbarAt(palette, 1)
		if (secondaryToolbar.items[0].kind === 'item-group') {
			expect(secondaryToolbar.items[0].group.presenter).toBe('radio-group')
		}
	})
})
