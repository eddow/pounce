import { lift, reactive } from 'mutts'
import type { PaletteModel } from './model'
import { paletteRegistryEntries } from './registry'
import type { PaletteMatch, PaletteQuery } from './types'

/**
 * A keyword token in the command box input
 */
export interface KeywordToken {
	readonly keyword: string
	readonly type: 'category' | 'composed-name' | 'enum-value'
	readonly source?: string // source entry or intent ID for enum values
}

/**
 * Keyword dictionary for Space-to-Select functionality
 */
export interface KeywordDictionary {
	/**
	 * All available keywords mapped to their types and sources
	 */
	readonly keywords: ReadonlyMap<string, KeywordToken>

	/**
	 * Check if a word is a valid keyword
	 */
	isValidKeyword(word: string): boolean

	/**
	 * Get keyword token information
	 */
	getKeyword(word: string): KeywordToken | undefined

	/**
	 * Get all keywords of a specific type
	 */
	getKeywordsByType(type: KeywordToken['type']): KeywordToken[]
}

function normalizeKeyword(value: string): string {
	return value.trim().toLowerCase()
}

export interface PaletteCommandBoxModel {
	/**
	 * The current input text in the command box
	 */
	readonly input: {
		value: string
		readonly placeholder?: string
		clear(): void
	}

	/**
	 * Current reactive search query owned by the command box
	 */
	readonly query: PaletteQuery

	/**
	 * Filtered search results derived reactively from `palette.search(query)`
	 */
	readonly results: readonly PaletteMatch[]

	readonly suggestions: readonly PaletteCommandBoxKeywordSuggestion[]

	/**
	 * Available category chips for filtering
	 * Includes categories from both entries and intents (registered and derived)
	 */
	readonly categories: {
		readonly available: readonly string[]
		readonly active: readonly string[]
		toggle(category: string): void
		removeLast(): string | undefined
		clear(): void
	}

	/**
	 * Active result selection for keyboard navigation
	 * Supports bounded selection, wraparound navigation, and clearing
	 */
	readonly selection: {
		readonly index: number
		readonly item: PaletteMatch | undefined
		set(index: number): void
		next(): void
		previous(): void
		clear(): void
	}

	/**
	 * Keyword tokens for Space-to-Select functionality
	 */
	readonly keywords: {
		readonly dictionary: KeywordDictionary
		readonly tokens: readonly KeywordToken[]
		readonly active: readonly KeywordToken[]

		/**
		 * Add a keyword token (when Space-to-Select recognizes a keyword)
		 */
		addToken(keyword: string): void

		/**
		 * Remove the last keyword token (Backspace behavior)
		 */
		removeLast(): KeywordToken | undefined

		/**
		 * Remove a specific keyword token (click-on-chip behavior)
		 */
		removeToken(keyword: string): boolean

		/**
		 * Clear all keyword tokens
		 */
		clear(): void
	}

	/**
	 * Handle keyboard input for Space-to-Select functionality
	 * Returns true if the event was handled (preventing default behavior)
	 */
	handleKeyDown(event: KeyboardEvent): boolean

	/**
	 * Execute the currently selected result or a specific intent
	 *
	 * Behavior:
	 * - Intent results: Executes through palette.run() and clears input/selection
	 * - Entry results: Returns undefined (no-op) and clears input/selection
	 *   - Future enhancement: May trigger lazy intent derivation for entries
	 * - No selection: Returns undefined
	 *
	 * @param intentId Optional explicit intent ID to execute
	 * @returns Execution result or undefined for no-op cases
	 */
	execute(intentId?: string): unknown

	/**
	 * Update the search query
	 */
	search(query: PaletteQuery): void
}

export interface PaletteCommandBoxKeywordSuggestion {
	readonly keyword: string
	readonly isActive: boolean
}

export function setPaletteCommandBoxInput(commandBox: PaletteCommandBoxModel, event: Event) {
	if (event.currentTarget instanceof HTMLInputElement) {
		commandBox.input.value = event.currentTarget.value
	}
}

function focusAdjacentPaletteCommandChip(target: HTMLButtonElement, offset: number) {
	const chipButtons =
		target.parentElement?.querySelectorAll<HTMLButtonElement>('[data-command-chip]')
	if (!chipButtons) return
	const index = Array.from(chipButtons).indexOf(target)
	const next = chipButtons[index + offset]
	if (next) {
		next.focus()
		return
	}
	const input = target.parentElement?.querySelector<HTMLInputElement>(
		'[data-test="palette-command-input"]'
	)
	input?.focus()
}

export function handlePaletteCommandChipKeydown(options: {
	commandBox: PaletteCommandBoxModel
	event: KeyboardEvent
	token: string
	type?: 'category' | 'keyword'
}) {
	const { commandBox, event, token, type = 'category' } = options
	if (!(event.currentTarget instanceof HTMLButtonElement)) return
	if (event.key === 'ArrowLeft') {
		focusAdjacentPaletteCommandChip(event.currentTarget, -1)
		event.preventDefault()
		return
	}
	if (event.key === 'ArrowRight') {
		focusAdjacentPaletteCommandChip(event.currentTarget, 1)
		event.preventDefault()
		return
	}
	if (event.key === 'Backspace' || event.key === 'Delete') {
		if (type === 'category') {
			commandBox.categories.toggle(token)
		} else {
			commandBox.keywords.removeToken(token)
		}
		const chipButtons =
			event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[data-command-chip]')
		const next = chipButtons?.[Math.max(0, (chipButtons?.length ?? 1) - 2)]
		if (next) {
			next.focus()
		} else {
			const input = event.currentTarget.parentElement?.querySelector<HTMLInputElement>(
				'[data-test="palette-command-input"]'
			)
			input?.focus()
		}
		event.preventDefault()
	}
}

export function handlePaletteCommandBoxInputKeydown(options: {
	commandBox: PaletteCommandBoxModel
	event: KeyboardEvent
	onMatch: (match: PaletteMatch) => void
	onAfterExecute?: () => void
}) {
	const { commandBox, event, onMatch, onAfterExecute } = options
	if (!(event.currentTarget instanceof HTMLInputElement)) return false

	const handled = commandBox.handleKeyDown(event)
	if (handled) return true

	if (event.key === 'ArrowDown') {
		commandBox.selection.next()
		return true
	}
	if (event.key === 'ArrowUp') {
		commandBox.selection.previous()
		return true
	}
	if (event.key === 'Enter') {
		const result = commandBox.selection.item ?? commandBox.results[0]
		if (result) {
			onMatch(result)
			onAfterExecute?.()
			return true
		}
	}
	return false
}

/**
 * Create a keyword dictionary from palette entries and intents
 */
function createKeywordDictionary(palette: PaletteModel): KeywordDictionary {
	const keywords = new Map<string, KeywordToken>()
	const addKeyword = (keyword: string, type: KeywordToken['type'], source: string) => {
		const normalized = normalizeKeyword(keyword)
		if (normalized.length < 2 || keywords.has(normalized)) return
		keywords.set(normalized, {
			keyword: normalized,
			type,
			source,
		})
	}

	for (const entry of paletteRegistryEntries(palette.registry)) {
		if (entry.categories) {
			for (const category of entry.categories) {
				addKeyword(category, 'category', entry.id)
			}
		}
	}

	for (const entry of paletteRegistryEntries(palette.registry)) {
		const segments = entry.id.split(/[._]/).filter((segment) => segment.length > 0)
		for (const segment of segments) {
			addKeyword(segment, 'composed-name', entry.id)
		}

		const labelSegments = entry.label.split(/[\s\-_]/).filter((segment) => segment.length > 0)
		for (const segment of labelSegments) {
			addKeyword(segment, 'composed-name', entry.id)
		}
	}

	for (const entry of paletteRegistryEntries(palette.registry)) {
		if (entry.schema.type === 'enum') {
			for (const option of entry.schema.options) {
				const value = typeof option === 'string' ? option : option.id
				const label = typeof option === 'string' ? option : (option.label ?? value)

				addKeyword(value, 'enum-value', entry.id)

				const labelSegments = label.split(/[\s\-_]/).filter((segment) => segment.length > 0)
				for (const segment of labelSegments) {
					addKeyword(segment, 'enum-value', entry.id)
				}
			}
		}
	}

	return {
		keywords,

		isValidKeyword(word: string): boolean {
			return keywords.has(normalizeKeyword(word))
		},

		getKeyword(word: string): KeywordToken | undefined {
			return keywords.get(normalizeKeyword(word))
		},

		getKeywordsByType(type: KeywordToken['type']): KeywordToken[] {
			return Array.from(keywords.values()).filter((token) => token.type === type)
		},
	}
}

function matchEntryIds(result: PaletteMatch): readonly string[] {
	switch (result.kind) {
		case 'entry':
		case 'intent':
			return [result.entry.id]
		case 'grouped-proposition':
			return result.entries.map((entry) => entry.entry.id)
	}
}

/**
 * Create a command box model derived from an existing palette model
 */
export function paletteCommandBoxModel(options: {
	palette: PaletteModel
	placeholder?: string
}): PaletteCommandBoxModel {
	const { palette, placeholder } = options

	// Input state
	const inputState = reactive({ value: '' })
	const inputPlaceholder = placeholder

	// Category filter state
	const categoryState = reactive({
		manual: [] as string[],
	})

	// Keyword token state
	const keywordTokenState = reactive({
		tokens: [] as KeywordToken[],
	})

	// Selection state
	const selectionState = reactive({ index: -1 })
	const manualQueryState = reactive({
		active: false,
		free: '',
		keywords: [] as string[],
	})

	// Create keyword dictionary
	const keywordDictionary = createKeywordDictionary(palette)
	const suggestions = lift`paletteCommandBoxModel.suggestions`(() => {
		const inputValue = inputState.value.trim()
		const currentWord = inputValue.split(/\s+/).pop()?.toLowerCase() || ''
		const chosenKeywords = new Set(
			keywordTokenState.tokens.map((token) => token.keyword.toLowerCase())
		)

		if (currentWord.length === 0) return [] as PaletteCommandBoxKeywordSuggestion[]

		const remainingEntryIds = new Set(searchResults.flatMap((result) => matchEntryIds(result)))
		const availableKeywordTokens = Array.from(keywordDictionary.keywords.values()).filter((token) =>
			remainingEntryIds.has(token.source ?? '')
		)

		return availableKeywordTokens
			.filter((token) => token.keyword.startsWith(currentWord))
			.filter((token) => !chosenKeywords.has(token.keyword))
			.map((token) => ({
				keyword: token.keyword,
				isActive: false,
			}))
	})

	// Reactive available categories derived from registry
	const availableCategories = lift`paletteCommandBoxModel.availableCategories`(() => {
		const categories = new Set<string>()

		// Add categories from entries
		for (const entry of paletteRegistryEntries(palette.registry)) {
			if (entry.categories) {
				for (const category of entry.categories) {
					categories.add(category)
				}
			}
		}

		// Add categories from intents (both registered and derived)
		for (const intent of palette.intents.intents) {
			if (intent.categories) {
				for (const category of intent.categories) {
					categories.add(category)
				}
			}
		}

		// Add categories from derived intents
		for (const entry of paletteRegistryEntries(palette.registry)) {
			for (const intent of palette.intents.derive(entry)) {
				if (intent.categories) {
					for (const category of intent.categories) {
						categories.add(category)
					}
				}
			}
		}

		return Array.from(categories).sort()
	})

	function removeTokenFromInput(value: string, tokenToRemove: string): string {
		const tokens = value
			.split(/\s+/)
			.map((token) => token.trim())
			.filter((token) => token.length > 0)

		for (let index = tokens.length - 1; index >= 0; index -= 1) {
			const token = tokens[index]
			const normalizedToken = normalizeKeyword(token)
			const normalizedTarget = normalizeKeyword(tokenToRemove)

			if (token.startsWith('#') && normalizeKeyword(token.slice(1)) === normalizedTarget) {
				tokens.splice(index, 1)
				break
			}

			if (normalizedToken === normalizedTarget) {
				tokens.splice(index, 1)
				break
			}
		}

		return tokens.join(' ')
	}

	const parsedInput = lift`paletteCommandBoxModel.parsedInput`(() => {
		const tokens = inputState.value
			.split(/\s+/)
			.map((token) => token.trim())
			.filter((token) => token.length > 0)

		const categories: string[] = []
		const keywords: KeywordToken[] = []
		const textTokens: string[] = []
		const resolveCategory = (token: string) =>
			availableCategories.find((category) => normalizeKeyword(category) === normalizeKeyword(token))

		for (const token of tokens) {
			if (token.startsWith('#')) {
				const category = resolveCategory(token.slice(1))
				if (category) {
					if (!categories.includes(category)) categories.push(category)
					continue
				}
			}

			const category = resolveCategory(token)
			if (category) {
				if (!categories.includes(category)) categories.push(category)
				continue
			}

			const keywordToken = keywordDictionary.getKeyword(token)
			if (
				keywordToken &&
				!keywords.some(
					(keyword) => normalizeKeyword(keyword.keyword) === normalizeKeyword(keywordToken.keyword)
				)
			) {
				keywords.push(keywordToken)
			}

			textTokens.push(token)
		}

		return {
			categories,
			keywords,
			text: textTokens.join(' '),
		}
	})

	const selectedKeywords = lift`paletteCommandBoxModel.selectedKeywords`(() =>
		keywordTokenState.tokens.filter(
			(token) => !parsedInput.keywords.some((parsedToken) => parsedToken.keyword === token.keyword)
		)
	)

	const textKeywords = lift`paletteCommandBoxModel.textKeywords`(() =>
		selectedKeywords
			.filter((keyword) => keyword.type !== 'category')
			.map((keyword) => keyword.keyword)
	)

	const activeKeywords = lift`paletteCommandBoxModel.activeKeywords`(() => {
		return [...selectedKeywords, ...parsedInput.keywords]
	})

	const activeCategories = lift`paletteCommandBoxModel.activeCategories`(() => {
		const categoryKeywords = activeKeywords
			.filter((keyword) => keyword.type === 'category')
			.map((keyword) => keyword.keyword)
		return Array.from(
			new Set([...categoryState.manual, ...parsedInput.categories, ...categoryKeywords])
		)
	})

	const query = {
		get free(): string {
			if (manualQueryState.active) {
				return manualQueryState.free
			}
			const searchText =
				textKeywords.length > 0
					? `${parsedInput.text} ${textKeywords.join(' ')}`.trim()
					: parsedInput.text
			return searchText
		},
		get keywords(): readonly string[] {
			if (manualQueryState.active) {
				return manualQueryState.keywords
			}
			return Array.from(
				new Set([...activeCategories, ...activeKeywords.map((keyword) => keyword.keyword)])
			)
		},
	}
	const searchResults = palette.search(query)

	function useLocalQuery() {
		manualQueryState.active = false
	}

	function removeCategory(category: string) {
		let removed = false
		for (let index = categoryState.manual.length - 1; index >= 0; index -= 1) {
			if (categoryState.manual[index] !== category) continue
			categoryState.manual.splice(index, 1)
			removed = true
		}
		if (parsedInput.categories.includes(category)) {
			inputState.value = removeTokenFromInput(inputState.value, category)
			removed = true
		}
		return removed
	}

	const input = {
		get value() {
			return inputState.value
		},
		set value(value: string) {
			useLocalQuery()
			inputState.value = value
			selection.clear()
		},
		get placeholder() {
			return inputPlaceholder
		},
		clear() {
			input.value = ''
		},
	}

	const categories = {
		get available() {
			return availableCategories
		},
		get active() {
			return activeCategories
		},
		toggle(category: string) {
			useLocalQuery()
			if (!removeCategory(category)) {
				categoryState.manual.push(category)
			}
			selection.clear()
		},
		removeLast() {
			useLocalQuery()
			const active = activeCategories
			const category = active[active.length - 1]
			if (!category) return undefined
			if (!removeCategory(category)) return undefined
			selection.clear()
			return category
		},
		clear() {
			if (categoryState.manual.length > 0) {
				useLocalQuery()
				categoryState.manual.splice(0, categoryState.manual.length)
				selection.clear()
			}
		},
	}

	const keywords = {
		get dictionary() {
			return keywordDictionary
		},

		get tokens() {
			return keywordTokenState.tokens
		},

		get active() {
			return activeKeywords
		},

		addToken(keyword: string): void {
			const keywordToken = keywordDictionary.getKeyword(keyword)
			if (!keywordToken) return

			const existing = keywordTokenState.tokens.find(
				(token) => normalizeKeyword(token.keyword) === normalizeKeyword(keywordToken.keyword)
			)
			if (existing) return

			useLocalQuery()
			keywordTokenState.tokens.push(keywordToken)
			selection.clear()
		},

		removeLast(): KeywordToken | undefined {
			if (keywordTokenState.tokens.length === 0) return undefined

			useLocalQuery()
			const removed = keywordTokenState.tokens.pop()
			selection.clear()
			return removed
		},

		removeToken(keyword: string): boolean {
			const normalized = normalizeKeyword(keyword)
			const tokenIndex = keywordTokenState.tokens.findIndex(
				(token) => normalizeKeyword(token.keyword) === normalized
			)
			if (tokenIndex < 0) return false

			useLocalQuery()
			keywordTokenState.tokens.splice(tokenIndex, 1)
			selection.clear()
			return true
		},

		clear() {
			if (keywordTokenState.tokens.length === 0) return
			useLocalQuery()
			keywordTokenState.tokens.splice(0, keywordTokenState.tokens.length)
			selection.clear()
		},
	}

	const selection = {
		get index() {
			return selectionState.index
		},
		get item() {
			return selectionState.index >= 0 && selectionState.index < model.results.length
				? model.results[selectionState.index]
				: undefined
		},
		set(index: number) {
			const validIndex = Math.max(-1, Math.min(index, model.results.length - 1))
			selectionState.index = validIndex
		},
		next() {
			if (model.results.length === 0) {
				selection.clear()
				return
			}
			const nextIndex =
				selectionState.index >= model.results.length - 1 ? 0 : selectionState.index + 1
			selection.set(nextIndex)
		},
		previous() {
			if (model.results.length === 0) {
				selection.clear()
				return
			}
			const prevIndex =
				selectionState.index <= 0 ? model.results.length - 1 : selectionState.index - 1
			selection.set(prevIndex)
		},
		clear() {
			selectionState.index = -1
		},
	}

	// Create the command box model
	const model: PaletteCommandBoxModel = {
		query,
		input,
		results: searchResults,
		suggestions,
		categories,
		keywords,
		selection,

		execute(intentId?: string): unknown {
			const selectedItem = model.selection.item
			const targetIntentId =
				intentId ?? (selectedItem?.kind === 'intent' ? selectedItem.intent.id : undefined)
			if (!targetIntentId) return undefined
			const result = palette.run(targetIntentId)
			model.input.clear()
			model.selection.clear()
			return result
		},

		search(query: PaletteQuery) {
			manualQueryState.active = true
			manualQueryState.free = query.free ?? ''
			manualQueryState.keywords.splice(
				0,
				manualQueryState.keywords.length,
				...(query.keywords ? [...query.keywords] : [])
			)
			model.selection.clear()
		},

		handleKeyDown(event: KeyboardEvent): boolean {
			// Handle Backspace for removing last keyword token
			if (event.key === 'Backspace') {
				const inputValue = inputState.value
				const cursorPos = (event.target as HTMLInputElement).selectionStart ?? 0

				// Only handle Backspace when cursor is at end and input is empty or ends with space
				if (
					cursorPos === inputValue.length &&
					(inputValue.length === 0 || inputValue.endsWith(' '))
				) {
					const removed = model.keywords.removeLast()
					if (removed) {
						event.preventDefault()
						return true
					}
				}
				return false
			}

			// Only handle Space key without modifiers
			if (event.key !== ' ' || event.ctrlKey || event.metaKey || event.altKey) {
				return false
			}

			// Get current input value and cursor position
			const inputValue = inputState.value
			const cursorPos = (event.target as HTMLInputElement).selectionStart ?? 0

			// Extract the word at cursor position
			const words = inputValue.split(/\s+/)
			let currentWord = ''

			// Find the word at cursor position
			let charCount = 0
			for (let i = 0; i < words.length; i++) {
				const word = words[i]
				if (charCount + word.length >= cursorPos) {
					currentWord = word
					break
				}
				charCount += word.length + 1 // +1 for space
			}

			// Check if the current word is a valid keyword
			const keywordToken = keywordDictionary.getKeyword(currentWord)
			if (!keywordToken) {
				event.preventDefault()
				return true
			}

			useLocalQuery()
			model.keywords.addToken(keywordToken.keyword)
			inputState.value = removeTokenFromInput(inputState.value, currentWord)
			model.selection.clear()

			event.preventDefault()
			return true
		},
	}

	return model
}
