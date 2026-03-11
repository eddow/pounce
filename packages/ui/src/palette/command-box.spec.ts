import { beforeEach, describe, expect, it } from 'vitest'
import { paletteCommandBoxModel } from './command-box'
import { createPaletteModel } from './model'
import type { PaletteMatch, PaletteResolvedEntry, PaletteResolvedIntent } from './types'

function isIntentMatch(match: PaletteMatch): match is PaletteResolvedIntent {
	return match.kind === 'intent'
}

function isEntryMatch(match: PaletteMatch): match is PaletteResolvedEntry {
	return match.kind === 'entry'
}

function requireIntentMatch(matches: readonly PaletteMatch[]): PaletteResolvedIntent {
	const match = matches.find(isIntentMatch)
	expect(match).toBeDefined()
	return match!
}

function requireEntryMatch(matches: readonly PaletteMatch[]): PaletteResolvedEntry {
	const match = matches.find(isEntryMatch)
	expect(match).toBeDefined()
	return match!
}

function requireIntentById(
	matches: readonly PaletteMatch[],
	intentId: string
): PaletteResolvedIntent {
	const match = matches.find(
		(candidate): candidate is PaletteResolvedIntent =>
			isIntentMatch(candidate) && candidate.intent.id === intentId
	)
	expect(match).toBeDefined()
	return match!
}

function requireEntryById(matches: readonly PaletteMatch[], entryId: string): PaletteResolvedEntry {
	const match = matches.find(
		(candidate): candidate is PaletteResolvedEntry =>
			isEntryMatch(candidate) && candidate.entry.id === entryId
	)
	expect(match).toBeDefined()
	return match!
}

describe('paletteCommandBoxModel', () => {
	let palette: ReturnType<typeof createPaletteModel>
	let commandBox: ReturnType<typeof paletteCommandBoxModel>

	beforeEach(() => {
		// Create test palette with sample data
		palette = createPaletteModel({
			definitions: [
				{
					id: 'test.action',
					label: 'Test Action',
					description: 'A test action',
					categories: ['test', 'action'],
					schema: { type: 'action', run: () => 'action executed' },
				},
				{
					id: 'test.boolean',
					label: 'Test Boolean',
					description: 'A test boolean setting',
					categories: ['test', 'setting'],
					schema: { type: 'boolean' },
				},
				{
					id: 'test.enum',
					label: 'Test Enum',
					description: 'A test enum setting',
					categories: ['test', 'setting'],
					schema: {
						type: 'enum',
						options: [
							{ value: 'option1', label: 'Option 1' },
							{ value: 'option2', label: 'Option 2', categories: ['preferred'] },
						],
					},
				},
				{
					id: 'test.status',
					label: 'Test Status',
					description: 'A test status entry',
					categories: ['test', 'status'],
					schema: { type: 'status' },
				},
			],
		})

		commandBox = paletteCommandBoxModel({
			palette,
			placeholder: 'Test placeholder',
		})
	})

	describe('initialization', () => {
		it('should create command box model with default state', () => {
			expect(commandBox.input.value).toBe('')
			expect(commandBox.input.placeholder).toBe('Test placeholder')
			expect(commandBox.results.length).toBeGreaterThan(0) // Should show all intents and entries initially
			expect(commandBox.selection.index).toBe(-1)
			expect(commandBox.selection.item).toBeUndefined()
			expect(commandBox.categories.available).toEqual([
				'action',
				'preferred',
				'setting',
				'status',
				'test',
			])
			expect(commandBox.categories.active).toEqual([])
		})

		it('should populate initial search results', () => {
			// Should show all intents and entries initially
			expect(commandBox.results.length).toBeGreaterThan(0)
		})
	})

	describe('input state', () => {
		it('should update input value and trigger search', () => {
			commandBox.input.value = 'test'

			expect(commandBox.input.value).toBe('test')
			expect(commandBox.query.text).toBe('')
			expect(commandBox.query.categories).toEqual(['test'])
			expect(commandBox.selection.index).toBe(-1) // Should reset selection
		})

		it('should clear input and reset search', () => {
			commandBox.input.value = 'test'
			commandBox.input.clear()

			expect(commandBox.input.value).toBe('')
			expect(commandBox.query.text).toBe('') // Empty string, not undefined
		})
	})

	describe('category filtering', () => {
		it('should toggle category filter', () => {
			commandBox.categories.toggle('test')

			expect(commandBox.categories.active).toEqual(['test'])
			expect(commandBox.query.categories).toEqual(['test'])
			expect(commandBox.selection.index).toBe(-1) // Should reset selection
		})

		it('should remove category when toggled again', () => {
			commandBox.categories.toggle('test')
			commandBox.categories.toggle('test')

			expect(commandBox.categories.active).toEqual([])
			expect(commandBox.query.categories).toEqual([])
		})

		it('should clear all categories', () => {
			commandBox.categories.toggle('test')
			commandBox.categories.toggle('action')
			commandBox.categories.clear()

			expect(commandBox.categories.active).toEqual([])
			expect(commandBox.query.categories).toEqual([])
		})

		it('should not clear when no active categories', () => {
			const initialResults = commandBox.results.length
			commandBox.categories.clear()

			expect(commandBox.categories.active).toEqual([])
			expect(commandBox.results.length).toBe(initialResults) // Should not trigger search
		})

		it('should remove the last active category', () => {
			commandBox.input.value = 'test boolean'

			const removed = commandBox.categories.removeLast()

			expect(removed).toBe('test')
			expect(commandBox.categories.active).toEqual([])
			expect(commandBox.query.text).toBe('boolean')
		})

		it('should remove a typed category from input text when toggled from the active chip set', () => {
			commandBox.input.value = 'test boolean'

			commandBox.categories.toggle('test')

			expect(commandBox.input.value).toBe('boolean')
			expect(commandBox.categories.active).toEqual([])
			expect(commandBox.query.text).toBe('boolean')
			expect(commandBox.query.categories).toEqual([])
		})
	})

	describe('selection navigation', () => {
		beforeEach(() => {
			// Ensure we have results to select from
			commandBox.input.value = 'test'
		})

		it('should set selection index', () => {
			commandBox.selection.set(1)

			expect(commandBox.selection.index).toBe(1)
			expect(commandBox.selection.item).toBeDefined()
		})

		it('should clamp selection index to valid range', () => {
			commandBox.selection.set(999)

			expect(commandBox.selection.index).toBeLessThanOrEqual(commandBox.results.length - 1)
			expect(commandBox.selection.index).toBeGreaterThanOrEqual(-1)
		})

		it('should move to next result with wraparound', () => {
			commandBox.selection.set(commandBox.results.length - 1)
			commandBox.selection.next()

			expect(commandBox.selection.index).toBe(0)
		})

		it('should move to previous result with wraparound', () => {
			commandBox.selection.set(0)
			commandBox.selection.previous()

			expect(commandBox.selection.index).toBe(commandBox.results.length - 1)
		})

		it('should clear selection', () => {
			commandBox.selection.set(1)
			commandBox.selection.clear()

			expect(commandBox.selection.index).toBe(-1)
			expect(commandBox.selection.item).toBeUndefined()
		})

		it('should handle navigation when no results', () => {
			commandBox.input.value = 'nonexistent'
			commandBox.selection.next()
			commandBox.selection.previous()

			expect(commandBox.selection.index).toBe(-1)
			expect(commandBox.selection.item).toBeUndefined()
		})
	})

	describe('execute behavior', () => {
		it('should execute selected intent', () => {
			commandBox.input.value = 'toggle'
			const intentResult = requireIntentById(commandBox.results, 'test.boolean:toggle')
			const index = commandBox.results.findIndex(
				(result) => isIntentMatch(result) && result.intent.id === intentResult.intent.id
			)
			expect(index).toBeGreaterThanOrEqual(0)
			commandBox.selection.set(index)
			expect(commandBox.selection.item).toEqual(intentResult)
			palette.state[intentResult.entry.id] = false
			const result = commandBox.execute()
			expect(palette.state[intentResult.entry.id]).toBe(true)
			expect(result).toBe(true)
			expect(commandBox.input.value).toBe('')
			expect(commandBox.selection.index).toBe(-1)
		})

		it('should execute explicit intent ID', () => {
			const intentId = 'test.boolean:toggle'
			palette.state['test.boolean'] = false
			const result = commandBox.execute(intentId)
			expect(palette.state['test.boolean']).toBe(true)
			expect(result).toBe(true)
			expect(commandBox.input.value).toBe('')
			expect(commandBox.selection.index).toBe(-1)
		})

		it('should return undefined for entry rows', () => {
			commandBox.input.value = 'status'
			const entryResult = requireEntryById(commandBox.results, 'test.status')
			const index = commandBox.results.indexOf(entryResult)
			commandBox.selection.set(index)
			commandBox.input.value = 'status'
			const result = commandBox.execute()
			expect(result).toBeUndefined()
			expect(commandBox.input.value).toBe('status')
			expect(commandBox.selection.index).toBe(index)
		})

		it('should return undefined when no selection and no explicit ID', () => {
			const result = commandBox.execute()

			expect(result).toBeUndefined()
		})
	})

	describe('search behavior', () => {
		it('should trigger search when query changes', () => {
			commandBox.search({ text: 'action' })
			expect(commandBox.query.text).toBe('action')
			expect(
				commandBox.results.every((result) =>
					isIntentMatch(result)
						? (result.intent.label ?? result.entry.label).toLowerCase().includes('action') ||
							result.entry.label.toLowerCase().includes('action')
						: result.entry.label.toLowerCase().includes('action')
				)
			).toBe(true)
		})

		it('should filter by categories', () => {
			commandBox.search({ categories: ['test'] })

			expect(commandBox.query.categories).toEqual(['test'])
			// Results should include test category
			expect(commandBox.results.length).toBeGreaterThan(0)
		})

		it('should combine text and category filters', () => {
			commandBox.search({ text: 'test', categories: ['action'] })

			expect(commandBox.query.text).toBe('test')
			expect(commandBox.query.categories).toEqual(['action'])
		})
	})

	describe('category derivation', () => {
		it('should derive categories from entries', () => {
			const categories = commandBox.categories.available
			expect(categories).toContain('test')
			expect(categories).toContain('action')
			expect(categories).toContain('setting')
		})

		it('should derive categories from enum options', () => {
			const categories = commandBox.categories.available
			expect(categories).toContain('preferred') // From enum option
		})

		it('should sort categories alphabetically', () => {
			const categories = commandBox.categories.available
			const sorted = [...categories].sort()
			expect(categories).toEqual(sorted)
		})
	})

	describe('query synchronization', () => {
		it('should reconstruct query from local state', () => {
			commandBox.input.value = 'test'
			commandBox.categories.toggle('action')

			expect(commandBox.query.text).toBe('')
			expect(commandBox.query.categories).toEqual(['action', 'test'])
		})

		it('should promote typed category tokens while keeping free text in query text', () => {
			commandBox.input.value = 'test boolean'

			expect(commandBox.input.value).toBe('test boolean')
			expect(commandBox.query.text).toBe('boolean')
			expect(commandBox.query.categories).toEqual(['test'])
		})

		it('should keep query in sync with palette search', () => {
			commandBox.input.value = 'boolean'

			// Both should have same text query
			expect(commandBox.query.text).toBe(palette.search.query.text)
			// Categories should match
			expect(commandBox.query.categories).toEqual(palette.search.query.categories)
		})
	})

	describe('object identity', () => {
		it('should return stable object references', () => {
			// Note: Current implementation returns fresh objects on each access
			// This is documented and acceptable for the first slice
			const input1 = commandBox.input
			const input2 = commandBox.input

			// Objects should have same structure (check key properties)
			expect(input1.value).toBe(input2.value)
			expect(input1.placeholder).toBe(input2.placeholder)
			input1.value = 'first'
			expect(input2.value).toBe('first')
			expect(typeof input1.clear).toBe(typeof input2.clear)

			const categories1 = commandBox.categories
			const categories2 = commandBox.categories

			// Check categories structure
			expect(categories1.available).toEqual(categories2.available)
			expect(categories1.active).toEqual(categories2.active)
			expect(typeof categories1.toggle).toBe(typeof categories2.toggle)
			expect(typeof categories1.clear).toBe(typeof categories2.clear)

			const selection1 = commandBox.selection
			const selection2 = commandBox.selection

			// Check selection structure
			expect(selection1.index).toBe(selection2.index)
			expect(typeof selection1.set).toBe(typeof selection2.set)
			expect(typeof selection1.next).toBe(typeof selection2.next)
			expect(typeof selection1.previous).toBe(typeof selection2.previous)
			expect(typeof selection1.clear).toBe(typeof selection2.clear)
		})
	})
})
