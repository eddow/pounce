import { describe, expect, it } from 'vitest'
import { paletteAddItemModel } from './add-item'
import { createPaletteModel } from './model'

describe('Phase 6: Add-item and discovery flows', () => {
	it('extends add-item model so grouped candidates appear in discovery flows', () => {
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
		const allCandidates = addItem.all

		// Should include item-group candidates
		const itemGroups = allCandidates.filter((candidate) => candidate.kind === 'item-group')
		expect(itemGroups.length).toBeGreaterThan(0)

		// Should also include atomic candidates
		const intents = allCandidates.filter((candidate) => candidate.kind === 'intent')
		const editors = allCandidates.filter((candidate) => candidate.kind === 'editor')

		expect(intents.length).toBeGreaterThan(0)
		expect(editors.length).toBeGreaterThan(0)
	})

	it('decides when enum entries should propose different candidate types', () => {
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
		})

		const addItem = paletteAddItemModel({ palette })

		// For enum entry: should propose intents + item-group
		const themeCandidates = addItem.all.filter((candidate) => candidate.entry.id === 'ui.theme')
		const themeKinds = new Set(themeCandidates.map((c) => c.kind))

		expect(themeKinds.has('intent')).toBe(true)
		expect(themeKinds.has('item-group')).toBe(true)

		// For boolean entry: should propose intents only (no editor by default, no item-group)
		const sidebarCandidates = addItem.all.filter((candidate) => candidate.entry.id === 'ui.sidebar')
		const sidebarKinds = new Set(sidebarCandidates.map((c) => c.kind))

		expect(sidebarKinds.has('intent')).toBe(true)
		expect(sidebarKinds.has('item-group')).toBe(false)
		// Note: editor candidates only appear when canEditEntry returns true
	})

	it('keeps candidate generation predictable and deterministic', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})

		const addItem1 = paletteAddItemModel({ palette })
		const addItem2 = paletteAddItemModel({ palette })

		// Multiple calls should produce identical results
		expect(addItem1.all).toEqual(addItem2.all)

		// Order should be consistent: intents → derived intents → editors → item-groups
		const allCandidates = addItem1.all
		const firstIntentIndex = allCandidates.findIndex((c) => c.kind === 'intent')
		const firstEditorIndex = allCandidates.findIndex((c) => c.kind === 'editor')
		const firstItemGroupIndex = allCandidates.findIndex((c) => c.kind === 'item-group')

		expect(firstIntentIndex).toBeLessThan(firstEditorIndex)
		expect(firstEditorIndex).toBeLessThan(firstItemGroupIndex)
	})

	it('avoids flooding picker with too many overlapping grouped suggestions', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system', 'auto', 'sepia'] },
				},
			],
		})

		const addItem = paletteAddItemModel({ palette })
		const itemGroups = addItem.all.filter((candidate) => candidate.kind === 'item-group')

		// Should limit to maximum 2 item-group candidates per enum entry
		expect(itemGroups.length).toBeLessThanOrEqual(2)

		// Should have light/dark pair if both exist
		const lightDarkGroup = itemGroups.find(
			(g) =>
				g.kind === 'item-group' &&
				g.group.kind === 'enum-options' &&
				g.group.options.length === 2 &&
				g.group.options.includes('light') &&
				g.group.options.includes('dark')
		)
		expect(lightDarkGroup).toBeDefined()

		// Should have full set for 3+ options
		const fullGroup = itemGroups.find(
			(g) =>
				g.kind === 'item-group' && g.group.kind === 'enum-options' && g.group.options.length === 5
		)
		expect(fullGroup).toBeDefined()
	})

	it('demonstrates smart subset strategy', () => {
		const palette = createPaletteModel({
			definitions: [
				// Exactly 2 options -> single natural pair
				{
					id: 'ui.size',
					label: 'Size',
					schema: { type: 'enum', options: ['small', 'large'] },
				},
				// Light/dark detection -> curated pair + full set
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
				// No light/dark -> full set only
				{
					id: 'ui.priority',
					label: 'Priority',
					schema: { type: 'enum', options: ['low', 'medium', 'high'] },
				},
			],
		})

		const addItem = paletteAddItemModel({ palette })

		// Size: exactly 2 options -> single pair
		const sizeGroups = addItem.all.filter(
			(c) => c.entry.id === 'ui.size' && c.kind === 'item-group'
		)
		expect(sizeGroups).toHaveLength(1)
		if (sizeGroups[0].kind === 'item-group') {
			expect(sizeGroups[0].group.options).toEqual(['small', 'large'])
			expect(sizeGroups[0].group.presenter).toBe('radio-group')
		}

		// Theme: light/dark detection -> curated pair + full set
		const themeGroups = addItem.all.filter(
			(c) => c.entry.id === 'ui.theme' && c.kind === 'item-group'
		)
		expect(themeGroups).toHaveLength(2)

		const lightDarkPair = themeGroups.find(
			(g) => g.kind === 'item-group' && g.group.options.length === 2
		)
		const fullSet = themeGroups.find((g) => g.kind === 'item-group' && g.group.options.length === 3)

		if (lightDarkPair?.kind === 'item-group') {
			expect(lightDarkPair.group.options).toEqual(['light', 'dark'])
			expect(lightDarkPair.group.presenter).toBe('radio-group')
		}
		if (fullSet?.kind === 'item-group') {
			expect(fullSet.group.options).toEqual(['light', 'dark', 'system'])
			expect(fullSet.group.presenter).toBe('segmented')
		}

		// Priority: no light/dark -> full set only
		const priorityGroups = addItem.all.filter(
			(c) => c.entry.id === 'ui.priority' && c.kind === 'item-group'
		)
		expect(priorityGroups).toHaveLength(1)
		if (priorityGroups[0].kind === 'item-group') {
			expect(priorityGroups[0].group.options).toEqual(['low', 'medium', 'high'])
			expect(priorityGroups[0].group.presenter).toBe('segmented')
		}
	})

	it('ensures grouped candidates work with search and exclusion', () => {
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

		// Search should find item-group candidates
		const searchResults = addItem.search('theme')
		const itemGroups = searchResults.filter((c) => c.kind === 'item-group')
		expect(itemGroups.length).toBeGreaterThan(0)

		// Exclusion should work with item-groups
		const existingItemGroup = {
			kind: 'item-group' as const,
			group: {
				kind: 'enum-options' as const,
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group' as const,
			},
		}

		const filteredResults = addItem.search(undefined, { exclude: [existingItemGroup] })
		const filteredGroups = filteredResults.filter((c) => c.kind === 'item-group')

		// Should exclude the exact match while preserving different subsets
		const exactMatch = filteredGroups.find(
			(g) =>
				g.kind === 'item-group' &&
				g.group.entryId === 'ui.theme' &&
				g.group.options.length === 2 &&
				g.group.options.includes('light') &&
				g.group.options.includes('dark')
		)
		expect(exactMatch).toBeUndefined()

		const fullSetMatch = filteredGroups.find(
			(g) =>
				g.kind === 'item-group' &&
				g.group.entryId === 'ui.theme' &&
				g.group.options.length === 3 &&
				g.group.options.includes('light') &&
				g.group.options.includes('dark') &&
				g.group.options.includes('system')
		)
		expect(fullSetMatch).toBeDefined()
	})
})
