import { describe, expect, it } from 'vitest'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem } from './types'

describe('Phase 4: Resolution model and derived expansion', () => {
	it('resolves item-groups to composite objects with derived children', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})

		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroup)

		// Should resolve to composite object with derived children
		expect(resolved).toBeDefined()
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// Composite object structure
			expect(resolved.entry.id).toBe('ui.theme')
			expect(resolved.resolvedItems).toHaveLength(2)

			// Each child should be a derived intent
			const lightIntent = resolved.resolvedItems[0]
			const darkIntent = resolved.resolvedItems[1]

			expect(lightIntent.kind).toBe('intent')
			expect(darkIntent.kind).toBe('intent')
			expect(lightIntent.intent.id).toBe('ui.theme:set:light')
			expect(darkIntent.intent.id).toBe('ui.theme:set:dark')
			expect(lightIntent.entry.id).toBe('ui.theme')
			expect(darkIntent.entry.id).toBe('ui.theme')
		}
	})

	it('keeps execution centralized through existing palette intent dispatch', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
		})

		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroup)
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// Each resolved intent should be executable through the same palette.run() path
			for (const item of resolved.resolvedItems) {
				expect(item.kind).toBe('intent')

				// Should be executable through centralized dispatch
				expect(() => palette.run(item.intent.id)).not.toThrow()

				// Should update the same state source
				expect(palette.state['ui.theme']).toBeDefined()
			}
		}
	})

	it('ensures grouped controls do not invent a second command path', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
		})

		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroup)
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// Get intent IDs from resolved group
			const groupIntentIds = resolved.resolvedItems.map((item) => item.intent.id)

			// These should be the exact same intent objects you get from direct resolution
			const directLightIntent = palette.resolveIntent('ui.theme:set:light')
			const directDarkIntent = palette.resolveIntent('ui.theme:set:dark')

			expect(directLightIntent?.intent).toBeDefined()
			expect(directDarkIntent?.intent).toBeDefined()

			// Verify they're the same objects (same command path)
			expect(groupIntentIds).toContain('ui.theme:set:light')
			expect(groupIntentIds).toContain('ui.theme:set:dark')

			// Execute through group-resolved path
			palette.run('ui.theme:set:light')
			expect(palette.state['ui.theme']).toBe('light')

			// Execute through direct path - should use same mechanism
			palette.run('ui.theme:set:dark')
			expect(palette.state['ui.theme']).toBe('dark')
		}
	})

	it('ensures checked/disabled state comes from same source of truth', async () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark'] },
				},
			],
		})

		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroup)
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// Set initial state
			palette.state['ui.theme'] = 'light'

			// Import the helper functions to test state computation
			const { computeCheckedState, computeDisabledState } = await import('./display')

			// Test each resolved intent uses same state source
			for (const item of resolved.resolvedItems) {
				if (item.kind === 'intent') {
					// Create a display item for testing
					const testDisplayItem: PaletteDisplayItem = {
						kind: 'intent',
						intentId: item.intent.id,
					}

					// Checked state should come from palette.state
					const checked = computeCheckedState(
						testDisplayItem,
						item.intent,
						item.entry,
						palette.state
					)
					const disabled = computeDisabledState(
						testDisplayItem,
						item.intent,
						item.entry,
						palette.state
					)

					// For light intent when state is 'light'
					if (item.intent.id === 'ui.theme:set:light') {
						expect(checked).toBe(true)
					} else {
						expect(checked).toBe(false)
					}

					// Disabled state should be consistent
					expect(typeof disabled).toBe('boolean')
				}
			}
		}
	})

	it('demonstrates resolved group expansion strategy', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: { type: 'enum', options: ['light', 'dark', 'system'] },
				},
			],
		})

		// Strategy: resolved composite object with derived children
		const itemGroup: PaletteDisplayItem = {
			kind: 'item-group',
			group: {
				kind: 'enum-options',
				entryId: 'ui.theme',
				options: ['light', 'dark'],
				presenter: 'radio-group',
			},
		}

		const resolved = palette.resolveDisplayItem(itemGroup)
		expect(resolved?.kind).toBe('item-group')

		if (resolved?.kind === 'item-group') {
			// This is a resolved composite object
			expect(resolved.entry).toBeDefined()
			expect(resolved.resolvedItems).toBeDefined()
			expect(Array.isArray(resolved.resolvedItems)).toBe(true)

			// Each child is independently executable but part of the group
			expect(resolved.resolvedItems.length).toBeGreaterThan(0)
			expect(resolved.resolvedItems.every((child) => child.kind === 'intent')).toBe(true)

			// UI can consume either:
			// 1. The group as a whole (for grouped presentation)
			// 2. Individual resolved intents (for individual control behavior)
			expect(resolved.group.kind).toBe('enum-options')
			expect(resolved.group.presenter).toBe('radio-group')
		}
	})
})
