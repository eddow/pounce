import { describe, expect, it } from 'vitest'
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

describe('Phase 7: Demo integration', () => {
	it('demonstrates grouped presentation in main toolbar', () => {
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
						{
							kind: 'intent',
							intentId: 'ui.sidebar:toggle',
							presenter: 'toggle',
							showText: true,
						},
					])
				),
			},
		})

		const mainToolbar = toolbarAt(palette, 0)
		expect(mainToolbar.items).toHaveLength(2)

		const itemGroup = mainToolbar.items[0]
		expect(itemGroup.kind).toBe('item-group')
		if (itemGroup.kind === 'item-group') {
			expect(itemGroup.group.entryId).toBe('ui.theme')
			expect(itemGroup.group.options).toEqual(['light', 'dark'])
			expect(itemGroup.group.presenter).toBe('radio-group')
		}
	})

	it('shows atomic items for contrast in settings toolbar', () => {
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
							kind: 'intent',
							intentId: 'ui.theme:set:light',
							presenter: 'radio',
							showText: true,
						},
						{
							kind: 'intent',
							intentId: 'ui.theme:set:dark',
							presenter: 'radio',
							showText: true,
						},
						{
							kind: 'intent',
							intentId: 'ui.theme:set:system',
							presenter: 'radio',
							showText: true,
						},
						{
							kind: 'editor',
							entryId: 'ui.theme',
							showText: true,
						},
					])
				),
			},
		})

		const settingsToolbar = toolbarAt(palette, 0)
		expect(settingsToolbar.items).toHaveLength(4)

		const intentItems = settingsToolbar.items.filter((item) => item.kind === 'intent')
		expect(intentItems).toHaveLength(3)

		const editorItem = settingsToolbar.items.find((item) => item.kind === 'editor')
		expect(editorItem).toBeDefined()
		if (editorItem && editorItem.kind === 'editor') {
			expect(editorItem.entryId).toBe('ui.theme')
		}
	})

	it('shows same entry appears differently across toolbars', () => {
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
					toolbarFixture([
						{
							kind: 'editor',
							entryId: 'ui.theme',
							showText: true,
						},
						{
							kind: 'intent',
							intentId: 'ui.theme:set:light',
							presenter: 'radio',
							showText: true,
						},
						{
							kind: 'intent',
							intentId: 'ui.theme:set:dark',
							presenter: 'radio',
							showText: true,
						},
						{
							kind: 'intent',
							intentId: 'ui.theme:set:system',
							presenter: 'radio',
							showText: true,
						},
					])
				),
			},
		})

		const mainToolbar = toolbarAt(palette, 0)
		const settingsToolbar = toolbarAt(palette, 1)

		const mainItemGroup = mainToolbar.items[0]
		expect(mainItemGroup.kind).toBe('item-group')
		if (mainItemGroup.kind === 'item-group') {
			expect(mainItemGroup.group.entryId).toBe('ui.theme')
			expect(mainItemGroup.group.options).toEqual(['light', 'dark'])
			expect(mainItemGroup.group.presenter).toBe('radio-group')
		}

		const settingsEditor = settingsToolbar.items.find((item) => item.kind === 'editor')
		const settingsIntents = settingsToolbar.items.filter((item) => item.kind === 'intent')

		expect(settingsEditor).toBeDefined()
		expect(settingsIntents).toHaveLength(3)

		if (settingsEditor && settingsEditor.kind === 'editor') {
			expect(settingsEditor.entryId).toBe('ui.theme')
		}
		expect(
			settingsIntents.every(
				(item) => item.kind === 'intent' && item.intentId.startsWith('ui.theme:')
			)
		).toBe(true)
	})

	it('replaces manually-authored enum radio cluster with item-group', () => {
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

		const mainToolbar = toolbarAt(palette, 0)
		expect(mainToolbar.items).toHaveLength(1)

		const itemGroup = mainToolbar.items[0]
		expect(itemGroup.kind).toBe('item-group')

		if (itemGroup.kind === 'item-group') {
			expect(itemGroup.group.entryId).toBe('ui.theme')
			expect(itemGroup.group.options).toEqual(['light', 'dark'])
			expect(itemGroup.group.presenter).toBe('radio-group')
		}
	})
})
