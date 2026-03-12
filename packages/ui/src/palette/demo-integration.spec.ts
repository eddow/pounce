import { describe, expect, it } from 'vitest'
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
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('1', [
							// Grouped presentation
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
						]),
					],
				},
			},
		})

		const mainToolbar = toolbarAt(palette, 0)
		expect(mainToolbar.items).toHaveLength(2)

		// First item should be the item-group
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
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('1', [
							// Atomic items for contrast
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
							// Editor for richer presentation
							{
								kind: 'editor',
								entryId: 'ui.theme',
								showText: true,
							},
						]),
					],
				},
			},
		})

		const settingsToolbar = toolbarAt(palette, 0)
		expect(settingsToolbar.items).toHaveLength(4)

		// Should have atomic intents
		const intentItems = settingsToolbar.items.filter((item) => item.kind === 'intent')
		expect(intentItems).toHaveLength(3)

		// Should have editor
		const editorItem = settingsToolbar.items.find((item) => item.kind === 'editor')
		expect(editorItem).toBeDefined()
		if (editorItem && editorItem.kind === 'editor') {
			expect(editorItem.entryId).toBe('ui.theme')
		}
	})

	it('shows same entry appears differently across surfaces', () => {
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
						toolbarSurface('1', [
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
						toolbarSurface('2', [
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
						]),
					],
				},
			},
		})

		const mainToolbar = toolbarAt(palette, 0)
		const settingsToolbar = toolbarAt(palette, 1)

		// Main toolbar: grouped subset (light/dark pair)
		const mainItemGroup = mainToolbar.items[0]
		expect(mainItemGroup.kind).toBe('item-group')
		if (mainItemGroup.kind === 'item-group') {
			expect(mainItemGroup.group.entryId).toBe('ui.theme')
			expect(mainItemGroup.group.options).toEqual(['light', 'dark'])
			expect(mainItemGroup.group.presenter).toBe('radio-group')
		}

		// Settings toolbar: richer editor + atomic intents (all options)
		const settingsEditor = settingsToolbar.items.find((item) => item.kind === 'editor')
		const settingsIntents = settingsToolbar.items.filter((item) => item.kind === 'intent')

		expect(settingsEditor).toBeDefined()
		expect(settingsIntents).toHaveLength(3)

		// All target the same entry (ui.theme)
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
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('1', [
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

		const mainToolbar = toolbarAt(palette, 0)
		expect(mainToolbar.items).toHaveLength(1)

		// Should be a single item-group instead of multiple atomic intents
		const itemGroup = mainToolbar.items[0]
		expect(itemGroup.kind).toBe('item-group')

		if (itemGroup.kind === 'item-group') {
			expect(itemGroup.group.entryId).toBe('ui.theme')
			// Item-group shows curated subset (light/dark) instead of all options
			expect(itemGroup.group.options).toEqual(['light', 'dark'])
			expect(itemGroup.group.presenter).toBe('radio-group')
		}
	})
})
