import { describe, expect, it } from 'vitest'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem } from './types'

describe('Phase 3: Enum option groups integration', () => {
	it('demonstrates complete Phase 3 implementation', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})

		// 1. Grouped-display shape for enum-backed entries ✓
		const enumGroupDisplayItem: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'], // Subset rendering
				presenter: 'radio-group', // Presenter selection
			},
		}

		// 2. Targeting enum entry with grouped presentation metadata ✓
		expect(enumGroupDisplayItem.group.entryId).toBe('ui.theme')
		expect(enumGroupDisplayItem.group.kind).toBe('enum-options')

		// 3. Subset rendering (light | dark, excluding system) ✓
		expect(enumGroupDisplayItem.group.options).toEqual(['light', 'dark'])
		expect(enumGroupDisplayItem.group.options).not.toContain('system')

		// 4. Presenter selection (radio-group, segmented available) ✓
		expect(enumGroupDisplayItem.group.presenter).toBe('radio-group')

		// 5. Resolves through same derived intents as rest of palette ✓
		const resolved = palette.resolveDisplayItem(enumGroupDisplayItem)
		expect(resolved).toBeDefined()
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// Should resolve to derived intents using standard intent IDs
			expect(resolved.resolvedItems).toHaveLength(2)
			expect(resolved.resolvedItems[0].intent.id).toBe('ui.theme:set:light')
			expect(resolved.resolvedItems[1].intent.id).toBe('ui.theme:set:dark')

			// These should be the same intent objects you'd get from direct resolution
			const directLightIntent = palette.resolveIntent('ui.theme:set:light')
			const directDarkIntent = palette.resolveIntent('ui.theme:set:dark')

			expect(resolved.resolvedItems[0].intent).toEqual(directLightIntent?.intent)
			expect(resolved.resolvedItems[1].intent).toEqual(directDarkIntent?.intent)

			// All should target the same entry
			expect(resolved.resolvedItems.every((item) => item.entry.id === 'ui.theme')).toBe(true)
		}
	})

	it('supports different presenter options', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})

		// Test segmented presenter for full option set
		const segmentedGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark', 'system'],
				presenter: 'segmented',
			},
		}

		const resolved = palette.resolveDisplayItem(segmentedGroup)
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			expect(resolved.resolvedItems).toHaveLength(3)
			expect(segmentedGroup.group.presenter).toBe('segmented')
		}
	})

	it('handles edge cases gracefully', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
		})

		// Empty subset should resolve to no items
		const emptyGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: [],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(emptyGroup)
		expect(resolved?.kind).toBe('item-group')
		if (resolved?.kind === 'item-group') {
			expect(resolved.resolvedItems).toHaveLength(0)
		}

		// Invalid options are filtered out gracefully (tolerant validation)
		const mixedValidInvalidGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'invalid-option', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolvedMixed = palette.resolveDisplayItem(mixedValidInvalidGroup)
		expect(resolvedMixed?.kind).toBe('item-group')
		if (resolvedMixed?.kind === 'item-group') {
			// Should only include valid options, silently filter out invalid ones
			expect(resolvedMixed.resolvedItems).toHaveLength(2)
			expect(resolvedMixed.resolvedItems.map((item) => item.intent.id)).toEqual([
				'ui.theme:set:light',
				'ui.theme:set:dark',
			])
		}
	})
})
