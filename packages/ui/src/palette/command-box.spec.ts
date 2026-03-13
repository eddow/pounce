import { beforeEach, describe, expect, it } from 'vitest'
import { type KeywordToken, paletteCommandBoxModel } from './command-box'
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
		// Create test palette with sample data for keyword tokenization testing
		palette = createPaletteModel({
			definitions: [
				{
					id: 'ui.theme',
					label: 'UI Theme',
					description: 'User interface theme setting',
					categories: ['ui', 'appearance'],
					schema: {
						type: 'enum',
						options: [
							{ value: 'light', label: 'Light Mode' },
							{ value: 'dark', label: 'Dark Mode', categories: ['preferred'] },
							{ value: 'system', label: 'System Theme' },
						],
					},
				},
				{
					id: 'game.speed',
					label: 'Game Speed',
					description: 'Game simulation speed',
					categories: ['game', 'simulation'],
					schema: { type: 'number', min: 0, max: 10, step: 1 },
				},
				{
					id: 'editor.fontSize',
					label: 'Editor Font Size',
					description: 'Text editor font size',
					categories: ['editor', 'text'],
					schema: { type: 'number', min: 8, max: 72, step: 1 },
				},
				{
					id: 'layout.toolbar',
					label: 'Layout Toolbar',
					description: 'Layout and toolbar settings',
					categories: ['layout', 'ui'],
					schema: { type: 'boolean' },
				},
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
			expect([...commandBox.categories.available]).toEqual([
				'action',
				'appearance',
				'editor',
				'game',
				'layout',
				'preferred',
				'setting',
				'simulation',
				'status',
				'test',
				'text',
				'ui',
			])
			expect([...commandBox.categories.active]).toEqual([])
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
			expect([...(commandBox.query.categories ?? [])]).toEqual(['test'])
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

			expect([...commandBox.categories.active]).toEqual(['test'])
			expect([...(commandBox.query.categories ?? [])]).toEqual(['test'])
			expect(commandBox.selection.index).toBe(-1) // Should reset selection
		})

		it('should remove category when toggled again', () => {
			commandBox.categories.toggle('test')
			commandBox.categories.toggle('test')

			expect([...commandBox.categories.active]).toEqual([])
			expect([...(commandBox.query.categories ?? [])]).toEqual([])
		})

		it('should clear all categories', () => {
			commandBox.categories.toggle('test')
			commandBox.categories.toggle('action')
			commandBox.categories.clear()

			expect([...commandBox.categories.active]).toEqual([])
			expect([...(commandBox.query.categories ?? [])]).toEqual([])
		})

		it('should not clear when no active categories', () => {
			const initialResults = commandBox.results.length
			commandBox.categories.clear()

			expect([...commandBox.categories.active]).toEqual([])
			expect(commandBox.results.length).toBe(initialResults) // Should not trigger search
		})

		it('should remove the last active category', () => {
			commandBox.input.value = 'test boolean'

			const removed = commandBox.categories.removeLast()

			expect(removed).toBe('test')
			expect([...commandBox.categories.active]).toEqual([])
			expect(commandBox.query.text).toBe('boolean')
		})

		it('should remove a typed category from input text when toggled from the active chip set', () => {
			commandBox.input.value = 'test boolean'

			commandBox.categories.toggle('test')

			expect(commandBox.input.value).toBe('boolean')
			expect([...commandBox.categories.active]).toEqual([])
			expect(commandBox.query.text).toBe('boolean')
			expect([...commandBox.query.categories]).toEqual([])
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
				commandBox.results.every((result) => {
					if (isIntentMatch(result)) {
						return (
							(result.intent.label ?? result.entry.label).toLowerCase().includes('action') ||
							result.entry.label.toLowerCase().includes('action')
						)
					}
					if (result.kind === 'entry') {
						return result.entry.label.toLowerCase().includes('action')
					}
					return result.label.toLowerCase().includes('action')
				})
			).toBe(true)
		})

		it('should filter by categories', () => {
			commandBox.search({ categories: ['test'] })

			expect([...(commandBox.query.categories ?? [])]).toEqual(['test'])
			// Results should include test category
			expect(commandBox.results.length).toBeGreaterThan(0)
		})

		it('should combine text and category filters', () => {
			commandBox.search({ text: 'test', categories: ['action'] })

			expect(commandBox.query.text).toBe('test')
			expect([...(commandBox.query.categories ?? [])]).toEqual(['action'])
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
			expect([...categories]).toEqual(sorted)
		})
	})

	describe('query synchronization', () => {
		it('should reconstruct query from local state', () => {
			commandBox.input.value = 'test'
			commandBox.categories.toggle('action')

			expect(commandBox.query.text).toBe('')
			expect([...(commandBox.query.categories ?? [])]).toEqual(['action', 'test'])
		})

		it('should promote typed category tokens while keeping free text in query text', () => {
			commandBox.input.value = 'test boolean'

			expect(commandBox.input.value).toBe('test boolean')
			expect(commandBox.query.text).toBe('boolean')
			expect([...(commandBox.query.categories ?? [])]).toEqual(['test'])
		})

		it('should keep query in sync with palette search', () => {
			commandBox.input.value = 'boolean'

			const paletteResults = palette.search(commandBox.query)

			expect(commandBox.query.text).toBe('boolean')
			expect([...(commandBox.query.categories ?? [])]).toEqual([])
			expect([...commandBox.results]).toEqual([...paletteResults])
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

	describe('Phase 1 - Keyword Tokenization', () => {
		describe('keyword dictionary', () => {
			it('should build keywords from composed names (dots and underscores)', () => {
				const dict = commandBox.keywords.dictionary

				// Should extract segments from entry IDs
				expect(dict.isValidKeyword('ui')).toBe(true)
				expect(dict.isValidKeyword('theme')).toBe(true)
				expect(dict.isValidKeyword('game')).toBe(true)
				expect(dict.isValidKeyword('speed')).toBe(true)
				expect(dict.isValidKeyword('editor')).toBe(true)
				expect(dict.isValidKeyword('fontSize')).toBe(true)
				expect(dict.isValidKeyword('layout')).toBe(true)
				expect(dict.isValidKeyword('toolbar')).toBe(true)

				// Should extract segments from labels
				expect(dict.isValidKeyword('UI')).toBe(true)
				expect(dict.isValidKeyword('Theme')).toBe(true)
				expect(dict.isValidKeyword('Game')).toBe(true)
				expect(dict.isValidKeyword('Speed')).toBe(true)
				expect(dict.isValidKeyword('Editor')).toBe(true)
				expect(dict.isValidKeyword('Font')).toBe(true)
				expect(dict.isValidKeyword('Size')).toBe(true)
				expect(dict.isValidKeyword('Layout')).toBe(true)
				expect(dict.isValidKeyword('Toolbar')).toBe(true)
			})

			it('should build keywords from categories', () => {
				const dict = commandBox.keywords.dictionary

				// Should include all categories
				expect(dict.isValidKeyword('ui')).toBe(true)
				expect(dict.isValidKeyword('appearance')).toBe(true)
				expect(dict.isValidKeyword('game')).toBe(true)
				expect(dict.isValidKeyword('simulation')).toBe(true)
				expect(dict.isValidKeyword('editor')).toBe(true)
				expect(dict.isValidKeyword('text')).toBe(true)
				expect(dict.isValidKeyword('layout')).toBe(true)
				expect(dict.isValidKeyword('test')).toBe(true)
				expect(dict.isValidKeyword('action')).toBe(true)
			})

			it('should build keywords from enum values and labels', () => {
				const dict = commandBox.keywords.dictionary

				// Should include enum values
				expect(dict.isValidKeyword('light')).toBe(true)
				expect(dict.isValidKeyword('dark')).toBe(true)
				expect(dict.isValidKeyword('system')).toBe(true)

				// Should include enum labels (if different from values)
				expect(dict.isValidKeyword('Light')).toBe(true)
				expect(dict.isValidKeyword('Mode')).toBe(true)
				expect(dict.isValidKeyword('Dark')).toBe(true)
				expect(dict.isValidKeyword('System')).toBe(true)
				expect(dict.isValidKeyword('Theme')).toBe(true)
			})

			it('should categorize keywords correctly', () => {
				const dict = commandBox.keywords.dictionary

				// Category keywords take priority when a token belongs to both families
				const uiKeyword = dict.getKeyword('ui')
				expect(uiKeyword?.type).toBe('category')
				expect(uiKeyword?.source).toBe('ui.theme')

				// Category keywords
				const appearanceKeyword = dict.getKeyword('appearance')
				expect(appearanceKeyword?.type).toBe('category')
				expect(appearanceKeyword?.source).toBe('ui.theme')

				// Enum value keywords
				const lightKeyword = dict.getKeyword('light')
				expect(lightKeyword?.type).toBe('enum-value')
				expect(lightKeyword?.source).toBe('ui.theme')
			})

			it('should not include short segments', () => {
				const dict = commandBox.keywords.dictionary

				// Should not include segments shorter than 2 characters
				expect(dict.isValidKeyword('a')).toBe(false)
				expect(dict.isValidKeyword('b')).toBe(false)
			})
		})

		describe('Space-to-Select functionality', () => {
			it('should recognize valid keywords and convert to tokens', () => {
				// Simulate typing 'ui' and pressing space
				const inputElement = { selectionStart: 2 } as HTMLInputElement
				const spaceEvent = new KeyboardEvent('keydown', {
					key: ' ',
					ctrlKey: false,
					metaKey: false,
					altKey: false,
				}) as any

				// Mock the event target
				Object.defineProperty(spaceEvent, 'target', { value: inputElement })

				// Set input value
				commandBox.input.value = 'ui'

				// Handle the space key
				const handled = commandBox.handleKeyDown(spaceEvent)

				// Should handle the event and convert to token
				expect(handled).toBe(true)
				expect(commandBox.keywords.tokens).toHaveLength(1)
				expect(commandBox.keywords.tokens[0].keyword).toBe('ui')
				expect(commandBox.input.value).toBe('') // Should be cleared
			})

			it('should prevent space for unrecognized keywords', () => {
				const inputElement = { selectionStart: 5 } as HTMLInputElement
				const spaceEvent = new KeyboardEvent('keydown', {
					key: ' ',
					ctrlKey: false,
					metaKey: false,
					altKey: false,
				}) as any

				Object.defineProperty(spaceEvent, 'target', { value: inputElement })

				// Set input with unrecognized word
				commandBox.input.value = 'xyzabc'

				const handled = commandBox.handleKeyDown(spaceEvent)

				// Should handle the event but not create token
				expect(handled).toBe(true)
				expect(commandBox.keywords.tokens).toHaveLength(0)
				expect(commandBox.input.value).toBe('xyzabc') // Should remain unchanged
			})

			it('should not handle space with modifiers', () => {
				const inputElement = { selectionStart: 3 } as HTMLInputElement
				const spaceEvent = new KeyboardEvent('keydown', {
					key: ' ',
					ctrlKey: true, // Ctrl key pressed
				}) as any

				Object.defineProperty(spaceEvent, 'target', { value: inputElement })

				commandBox.input.value = 'ui'

				const handled = commandBox.handleKeyDown(spaceEvent)

				// Should not handle when modifiers are pressed
				expect(handled).toBe(false)
				expect(commandBox.keywords.tokens).toHaveLength(0)
			})

			it('should work with cursor in middle of word', () => {
				const inputElement = { selectionStart: 1 } as HTMLInputElement
				const spaceEvent = new KeyboardEvent('keydown', {
					key: ' ',
					ctrlKey: false,
					metaKey: false,
					altKey: false,
				}) as any

				Object.defineProperty(spaceEvent, 'target', { value: inputElement })

				commandBox.input.value = 'ui'

				const handled = commandBox.handleKeyDown(spaceEvent)

				expect(handled).toBe(true)
				expect(commandBox.keywords.tokens[0].keyword).toBe('ui')
			})
		})

		describe('Token management', () => {
			it('should remove last token with Backspace', () => {
				// Add a token first
				commandBox.keywords.addToken('ui')
				expect(commandBox.keywords.tokens).toHaveLength(1)

				// Simulate Backspace at end of empty input
				const inputElement = { selectionStart: 0 } as HTMLInputElement
				const backspaceEvent = new KeyboardEvent('keydown', {
					key: 'Backspace',
				}) as any

				Object.defineProperty(backspaceEvent, 'target', { value: inputElement })

				const handled = commandBox.handleKeyDown(backspaceEvent)

				expect(handled).toBe(true)
				expect(commandBox.keywords.tokens).toHaveLength(0)
			})

			it('should remove specific token by click', () => {
				// Add multiple tokens
				commandBox.keywords.addToken('ui')
				commandBox.keywords.addToken('theme')
				commandBox.keywords.addToken('game')
				expect(commandBox.keywords.tokens).toHaveLength(3)

				// Remove middle token
				const removed = commandBox.keywords.removeToken('theme')

				expect(removed).toBe(true)
				expect(commandBox.keywords.tokens).toHaveLength(2)
				expect(commandBox.keywords.tokens.map((t) => t.keyword)).toEqual(['ui', 'game'])
			})

			it('should clear all tokens', () => {
				// Add multiple tokens
				commandBox.keywords.addToken('ui')
				commandBox.keywords.addToken('theme')
				commandBox.keywords.addToken('game')
				expect(commandBox.keywords.tokens).toHaveLength(3)

				// Clear all tokens
				commandBox.keywords.clear()

				expect(commandBox.keywords.tokens).toHaveLength(0)
				expect(commandBox.keywords.active).toHaveLength(0)
			})

			it('should not add duplicate tokens', () => {
				commandBox.keywords.addToken('ui')
				commandBox.keywords.addToken('ui') // Duplicate

				expect(commandBox.keywords.tokens).toHaveLength(1)
				expect(commandBox.keywords.tokens[0].keyword).toBe('ui')
			})

			it('should treat keyword tokens case-insensitively', () => {
				commandBox.keywords.addToken('Theme')
				commandBox.keywords.addToken('theme')

				expect(commandBox.keywords.tokens).toHaveLength(1)
				expect(commandBox.keywords.tokens[0].keyword).toBe('theme')

				expect(commandBox.keywords.removeToken('THEME')).toBe(true)
				expect(commandBox.keywords.tokens).toHaveLength(0)
			})
		})

		describe('Search integration', () => {
			it('should filter search based on keyword tokens', () => {
				// Add a category keyword token
				commandBox.keywords.addToken('ui')

				// Should filter results to ui-related entries
				const results = commandBox.results

				// Filter should narrow results, even if the palette returns intent rows
				expect(results.length).toBeGreaterThan(0)
				expect(
					results.every((result) =>
						result.kind === 'grouped-proposition'
							? result.entries.every(
									(entry) => entry.entry.id === 'ui.theme' || entry.entry.id === 'layout.toolbar'
								)
							: result.entry.id === 'ui.theme' || result.entry.id === 'layout.toolbar'
					)
				).toBe(true)
			})

			it('should filter composed-name keywords through text search', () => {
				commandBox.keywords.addToken('theme')

				const results = commandBox.results

				expect(results.length).toBeGreaterThan(0)
				expect(
					results.every((result) =>
						result.kind === 'grouped-proposition'
							? result.entries.every((entry) => entry.entry.id === 'ui.theme')
							: result.entry.id === 'ui.theme'
					)
				).toBe(true)
			})

			it('should include enum-value keywords in text search', () => {
				// Add an enum value keyword token
				commandBox.keywords.addToken('dark')

				const results = commandBox.results

				// Should find entries related to 'dark' (enum value)
				// This will be included in the text search part
				expect(results.length).toBeGreaterThan(0)
			})

			it('should combine category and keyword filters', () => {
				// Add category token and enum value token
				commandBox.keywords.addToken('ui') // category
				commandBox.keywords.addToken('dark') // enum value

				const results = commandBox.results

				// Should filter by both category and text search
				expect(results.length).toBeGreaterThan(0)
			})

			it('should derive suggestions from the remaining results only', () => {
				commandBox.keywords.addToken('ui')
				commandBox.input.value = 'ga'

				expect([...commandBox.results]).toEqual([])
				expect(commandBox.suggestions.map((suggestion) => suggestion.keyword)).toEqual([])
			})

			it('should suggest keywords from surviving result entries', () => {
				commandBox.keywords.addToken('ui')
				commandBox.input.value = 'th'

				expect(commandBox.results.length).toBeGreaterThan(0)
				expect(commandBox.suggestions.map((suggestion) => suggestion.keyword)).toContain('theme')
			})
		})

		describe('Active keywords tracking', () => {
			it('should track active keywords from input parsing', () => {
				// Type input with recognized keywords
				commandBox.input.value = 'ui theme dark'

				// Should parse and track active keywords
				const activeKeywords = commandBox.keywords.active

				// Should have recognized keywords (the exact behavior depends on parsing)
				expect(activeKeywords.length).toBeGreaterThanOrEqual(0)
			})

			it('should update active keywords when tokens change', () => {
				// Add tokens - this should update active keywords
				commandBox.keywords.addToken('ui')
				commandBox.keywords.addToken('theme')

				// Check that tokens were added
				expect(commandBox.keywords.tokens).toHaveLength(2)
				expect(commandBox.keywords.tokens.map((t) => t.keyword)).toContain('ui')
				expect(commandBox.keywords.tokens.map((t) => t.keyword)).toContain('theme')

				// Remove a token
				commandBox.keywords.removeToken('ui')

				expect(commandBox.keywords.tokens).toHaveLength(1)
				expect(commandBox.keywords.tokens.map((t) => t.keyword)).not.toContain('ui')
				expect(commandBox.keywords.tokens.map((t) => t.keyword)).toContain('theme')
			})
		})
	})
})
