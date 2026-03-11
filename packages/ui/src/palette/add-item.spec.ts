import { describe, expect, it } from 'vitest'
import { paletteAddItemModel } from './add-item'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem } from './types'

describe('paletteAddItemModel', () => {
	it('collects registered, derived, and editor candidates', () => {
		const palette = createPaletteModel({
			definitions: [
				{ id: 'ui.darkMode', label: 'Dark Mode', schema: { type: 'boolean' } },
				{ id: 'ui.theme', label: 'Theme', schema: { type: 'enum', options: ['light', 'dark'] } },
			],
			intents: [{ id: 'ui.darkMode:toggle', targetId: 'ui.darkMode', mode: 'toggle' }],
		})
		const addItem = paletteAddItemModel({ palette })
		const intentIds = addItem.all
			.filter((candidate) => candidate.kind === 'intent')
			.map((candidate) => candidate.intent.id)
		const editorIds = addItem.all
			.filter((candidate) => candidate.kind === 'editor')
			.map((candidate) => candidate.entry.id)
		const itemGroupIds = addItem.all
			.filter((candidate) => candidate.kind === 'item-group')
			.map((candidate) => candidate.entry.id)

		expect(intentIds).toContain('ui.darkMode:toggle')
		expect(intentIds.filter((id) => id === 'ui.darkMode:toggle')).toHaveLength(1)
		expect(intentIds).toContain('ui.darkMode:set:true')
		expect(intentIds).toContain('ui.darkMode:set:false')
		expect(intentIds).toContain('ui.theme:set:light')
		expect(intentIds).toContain('ui.theme:set:dark')
		expect(editorIds).toEqual(['ui.theme'])
		// Exactly 2 options -> 1 item-group candidate
		expect(itemGroupIds).toEqual(['ui.theme'])
		expect(itemGroupIds).toHaveLength(1)
	})

	it('filters candidates by text query', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					categories: ['appearance'],
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
		})
		const addItem = paletteAddItemModel({ palette })
		const results = addItem.search('appearance')

		// Exactly 2 options -> 1 item-group candidate + 2 intent candidates + 1 editor candidate
		expect(results).toHaveLength(4)
		expect(results.every((candidate) => candidate.entry.id === 'ui.theme')).toBe(true)

		// Verify we have the expected kinds
		const kinds = results.map((r) => r.kind)
		expect(kinds.filter((k) => k === 'intent')).toHaveLength(2)
		expect(kinds.filter((k) => k === 'editor')).toHaveLength(1)
		expect(kinds.filter((k) => k === 'item-group')).toHaveLength(1)
	})

	it('excludes candidates already represented by display items', () => {
		const palette = createPaletteModel({
			definitions: [
				{ id: 'ui.theme', label: 'Theme', schema: { type: 'enum', options: ['light', 'dark'] } },
			],
		})
		const addItem = paletteAddItemModel({ palette })
		const excluded: readonly PaletteDisplayItem[] = [
			{ kind: 'intent', intentId: 'ui.theme:set:light' },
			{ kind: 'editor', entryId: 'ui.theme' },
		]
		const results = addItem.search(undefined, { exclude: excluded })
		const intentIds = results
			.filter((candidate) => candidate.kind === 'intent')
			.map((candidate) => candidate.intent.id)
		const editorIds = results
			.filter((candidate) => candidate.kind === 'editor')
			.map((candidate) => candidate.entry.id)

		expect(intentIds).not.toContain('ui.theme:set:light')
		expect(intentIds).toContain('ui.theme:set:dark')
		expect(editorIds).toEqual([])
	})

	it('generates smart subset candidates for enum entries', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})
		const addItem = paletteAddItemModel({ palette })
		const itemGroups = addItem.all.filter((candidate) => candidate.kind === 'item-group')

		// Should generate 2 candidates: light/dark pair + full set
		expect(itemGroups).toHaveLength(2)

		const lightDarkGroup = itemGroups.find(
			(g) =>
				g.group.kind === 'enum-options' &&
				g.group.options.length === 2 &&
				g.group.options.includes('light') &&
				g.group.options.includes('dark')
		)
		const fullGroup = itemGroups.find(
			(g) => g.group.kind === 'enum-options' && g.group.options.length === 3
		)

		expect(lightDarkGroup).toBeDefined()
		expect(lightDarkGroup?.group.presenter).toBe('radio-group')
		expect(fullGroup).toBeDefined()
		expect(fullGroup?.group.presenter).toBe('segmented')
	})

	it('allows overriding which entries can surface editor candidates', () => {
		const palette = createPaletteModel({
			definitions: [{ id: 'ui.darkMode', label: 'Dark Mode', schema: { type: 'boolean' } }],
		})
		const addItem = paletteAddItemModel({
			palette,
			canEditEntry: (entry) => entry.schema.type === 'boolean',
		})
		const editorIds = addItem.all
			.filter((candidate) => candidate.kind === 'editor')
			.map((candidate) => candidate.entry.id)

		expect(editorIds).toEqual(['ui.darkMode'])
	})
})
