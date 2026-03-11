import { describe, expect, it } from 'vitest'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem } from './types'

describe('item-group resolution', () => {
	it('resolves enum-options item-group to derived intents', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})

		const itemGroupDisplayItem: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroupDisplayItem)

		expect(resolved).toBeDefined()
		expect(resolved?.kind).toBe('item-group')
		expect(resolved?.entry.id).toBe('ui.theme')

		if (resolved?.kind === 'item-group') {
			expect(resolved.resolvedItems).toHaveLength(2)
			expect(resolved.resolvedItems[0].intent.id).toBe('ui.theme:set:light')
			expect(resolved.resolvedItems[1].intent.id).toBe('ui.theme:set:dark')
			expect(resolved.resolvedItems.every((item) => item.entry.id === 'ui.theme')).toBe(true)
		}
	})

	it('returns undefined for invalid enum options', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
		})

		const itemGroupDisplayItem: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'invalid-option'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroupDisplayItem)

		expect(resolved).toBeDefined()
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// Should only resolve valid options
			expect(resolved.resolvedItems).toHaveLength(1)
			expect(resolved.resolvedItems[0].intent.id).toBe('ui.theme:set:light')
		}
	})

	it('returns undefined for non-enum entries', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.sidebar',
					label: 'Sidebar',
					schema: { type: 'boolean' },
				},
			],
		})

		const itemGroupDisplayItem: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.sidebar',
				options: ['true', 'false'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroupDisplayItem)
		expect(resolved).toBeUndefined()
	})

	it('returns undefined for unknown entries', () => {
		const palette = createPaletteModel({
			definitions: [],
		})

		const itemGroupDisplayItem: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'unknown.entry',
				options: ['option1'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroupDisplayItem)
		expect(resolved).toBeUndefined()
	})
})
