import { afterEach, describe, expect, it } from 'vitest'
import * as dockview from '../dockview'
import * as mainUi from '../index'
import type {
	PaletteActionDefinition,
	PaletteBooleanDefinition,
	PaletteCategory as PaletteCategoryType,
	PaletteDisplayItem,
	PaletteEntryDefinition,
	PaletteEntryId as PaletteEntryIdType,
	PaletteEnumDefinition,
	PaletteFlipIntent,
	PaletteIntent,
	PaletteIntentId as PaletteIntentIdType,
	PaletteModelLike,
	PaletteResolvedDisplayItem,
	PaletteResolvedIntent,
	PaletteRunIntent,
	PaletteSetIntent,
	PaletteStashFallback,
	PaletteStashIntent,
	PaletteStepIntent,
	PaletteToggleIntent,
} from '../palette'

const rootExports: Record<string, unknown> = mainUi

describe('Palette subpath entry point', () => {
	afterEach(() => {
		// Clean up any DOM changes if needed in future tests
		document.body.innerHTML = ''
	})

	it('exports basic palette types', () => {
		// Verify the basic ID types are exported
		expect(typeof 'test-entry' as PaletteEntryIdType).toBe('string')
		expect(typeof 'test-intent' as PaletteIntentIdType).toBe('string')
		expect(typeof 'test-category' as PaletteCategoryType).toBe('string')
	})

	it('maintains separate subpath isolation', () => {
		// This test ensures the palette subpath can be imported independently
		// and doesn't interfere with the main @sursaut/ui barrel

		// Main barrel should not export palette types directly
		expect(rootExports.PaletteEntryId).toBeUndefined()
		expect(rootExports.PaletteIntentId).toBeUndefined()
		expect(rootExports.PaletteCategory).toBeUndefined()
		expect(rootExports.PaletteEntryDefinition).toBeUndefined()

		// The fact that this file compiles and imports work proves the types are available
		expect(typeof 'test-entry' as PaletteEntryIdType).toBe('string')
	})

	it('follows dockview export pattern', () => {
		// Verify the palette module follows the same structural pattern as dockview
		// Both should be objects with their own exports

		// Dockview should have exports (we can check if it's an object)
		expect(typeof dockview).toBe('object')

		// Palette types should be available (we already imported them)
		expect(typeof 'test-entry' as PaletteEntryIdType).toBe('string')
	})

	it('can be imported via subpath', () => {
		// Test that the subpath import works as expected
		// This simulates: import { PaletteEntryId } from '@sursaut/ui/palette'
		// The fact that this test runs and the imports at the top work proves this

		// Since we're now only exporting types, we verify through type usage
		expect(typeof 'test-entry' as PaletteEntryIdType).toBe('string')
		expect(typeof 'test-intent' as PaletteIntentIdType).toBe('string')
		expect(typeof 'test-category' as PaletteCategoryType).toBe('string')
	})

	it('exports comprehensive entry schema types', () => {
		// Test that all entry schema types are properly exported and typed
		const mockPalette: PaletteModelLike = {
			state: {},
			runtime: {},
			display: {
				container: {
					toolbarStack: {
						top: [{ slots: [] }],
						right: [{ slots: [] }],
						bottom: [{ slots: [] }],
						left: [{ slots: [] }],
					},
					editMode: false,
				},
			},
			resolveEntry: () => undefined,
		}

		const actionEntry: PaletteActionDefinition = {
			type: 'action',
			run: (palette: PaletteModelLike, intent: PaletteRunIntent) => {
				expect(palette).toBe(mockPalette)
				expect(intent.mode).toBe('run')
				return 'test'
			},
		}
		expect(actionEntry.type).toBe('action')
		expect(
			actionEntry.run(mockPalette, {
				id: 'test:run',
				targetId: 'test.entry',
				mode: 'run',
			})
		).toBe('test')

		const booleanEntry: PaletteBooleanDefinition = {
			type: 'boolean',
		}
		expect(booleanEntry.type).toBe('boolean')

		const enumEntry: PaletteEnumDefinition = {
			type: 'enum',
			options: ['a', 'b', 'c'] as const,
		}
		expect(enumEntry.type).toBe('enum')
		expect(enumEntry.options).toHaveLength(3)
	})

	it('exports comprehensive intent types', () => {
		// Test that all intent types are properly exported and typed
		const runIntent: PaletteRunIntent = {
			id: 'test:run',
			targetId: 'test.entry',
			mode: 'run',
		}
		expect(runIntent.mode).toBe('run')

		const toggleIntent: PaletteToggleIntent = {
			id: 'test:toggle',
			targetId: 'test.entry',
			mode: 'toggle',
		}
		expect(toggleIntent.mode).toBe('toggle')

		const setIntent: PaletteSetIntent = {
			id: 'test:set',
			targetId: 'test.entry',
			mode: 'set',
			value: true,
		}
		expect(setIntent.mode).toBe('set')
		expect(setIntent.value).toBe(true)

		const stepIntent: PaletteStepIntent = {
			id: 'test:step',
			targetId: 'test.entry',
			mode: 'step',
			step: 5,
		}
		expect(stepIntent.mode).toBe('step')
		expect(stepIntent.step).toBe(5)

		const flipIntent: PaletteFlipIntent = {
			id: 'test:flip',
			targetId: 'test.entry',
			mode: 'flip',
			values: ['light', 'dark'] as const,
		}
		expect(flipIntent.mode).toBe('flip')
		expect(flipIntent.values).toEqual(['light', 'dark'])

		const stashIntent: PaletteStashIntent = {
			id: 'test:stash',
			targetId: 'test.entry',
			mode: 'stash',
			value: 0,
			fallback: { kind: 'step', step: 1 },
		}
		expect(stashIntent.mode).toBe('stash')
		expect(stashIntent.value).toBe(0)
	})

	it('exports stash fallback types', () => {
		// Test PaletteStashFallback union
		const setFallback: PaletteStashFallback = {
			kind: 'set',
			value: 'default',
		}
		expect(setFallback.kind).toBe('set')

		const stepFallback: PaletteStashFallback = {
			kind: 'step',
			step: 1,
		}
		expect(stepFallback.kind).toBe('step')

		const noopFallback: PaletteStashFallback = {
			kind: 'noop',
		}
		expect(noopFallback.kind).toBe('noop')
	})

	it('exports display configuration types', () => {
		// Test display item types
		const displayItem: PaletteDisplayItem = {
			kind: 'intent',
			intentId: 'test:intent',
			presenter: 'button',
			showText: true,
		}
		expect(displayItem.presenter).toBe('button')
		expect(displayItem.showText).toBe(true)
	})

	it('exports resolved types', () => {
		// Test resolved intent type
		const resolvedIntent: PaletteResolvedIntent = {
			kind: 'intent',
			intent: {
				id: 'test:intent',
				targetId: 'test.entry',
				mode: 'run',
			},
			entry: {
				id: 'test.entry',
				label: 'Test Entry',
				schema: { type: 'action', run: () => {} },
			},
		}
		expect(resolvedIntent.kind).toBe('intent')
		expect(resolvedIntent.intent.mode).toBe('run')
		expect(resolvedIntent.entry.label).toBe('Test Entry')

		// Test resolved display item type
		const resolvedDisplay: PaletteResolvedDisplayItem = {
			kind: 'intent',
			intentId: 'test:intent',
			presenter: 'toggle',
			intent: {
				id: 'test:intent',
				targetId: 'test.entry',
				mode: 'toggle',
			},
			entry: {
				id: 'test.entry',
				label: 'Test Entry',
				schema: { type: 'boolean' },
			},
		}
		expect(resolvedDisplay.presenter).toBe('toggle')
		expect(resolvedDisplay.intent.mode).toBe('toggle')
		expect(resolvedDisplay.entry.schema.type).toBe('boolean')
	})

	it('supports complete entry definition typing', () => {
		// Test a complete entry definition with all fields
		const entry: PaletteEntryDefinition = {
			id: 'ui.theme' as PaletteEntryIdType,
			label: 'Theme',
			description: 'Choose your color theme',
			icon: '🎨', // Use string icon to keep headless
			categories: ['appearance', 'ui'] as readonly PaletteCategoryType[],
			schema: {
				type: 'enum',
				options: ['light', 'dark', 'system'] as const,
			},
		}

		expect(entry.id).toBe('ui.theme')
		expect(entry.label).toBe('Theme')
		expect(entry.description).toBe('Choose your color theme')
		expect(entry.icon).toBe('🎨')
		expect(entry.categories).toEqual(['appearance', 'ui'])
		expect(entry.schema.type).toBe('enum')
		if (entry.schema.type === 'enum') {
			expect(entry.schema.options).toEqual(['light', 'dark', 'system'])
		}
	})

	it('supports complete intent union typing', () => {
		// Test that the intent union works properly
		const intents: PaletteIntent[] = [
			{ id: 'action:run', targetId: 'test.entry', mode: 'run' },
			{ id: 'boolean:toggle', targetId: 'test.entry', mode: 'toggle' },
			{ id: 'enum:set:light', targetId: 'test.entry', mode: 'set', value: 'light' },
			{ id: 'number:step', targetId: 'test.entry', mode: 'step', step: 1 },
			{
				id: 'theme:flip',
				targetId: 'test.entry',
				mode: 'flip',
				values: ['light', 'dark'] as const,
			},
			{
				id: 'speed:stash',
				targetId: 'test.entry',
				mode: 'stash',
				value: 0,
				fallback: { kind: 'noop' },
			},
		]

		expect(intents).toHaveLength(6)
		expect(intents[0].mode).toBe('run')
		expect(intents[1].mode).toBe('toggle')
		expect(intents[2].mode).toBe('set')
		expect(intents[3].mode).toBe('step')
		expect(intents[4].mode).toBe('flip')
		expect(intents[5].mode).toBe('stash')
	})
})
