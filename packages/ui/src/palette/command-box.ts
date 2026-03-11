import { reactive } from 'mutts'
import type { PaletteModel } from './model'
import type { PaletteCategory, PaletteIntentId, PaletteMatch, PaletteQuery } from './types'

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
	 * Current search query from the palette's search model
	 * Note: This is read directly from palette.search.query to ensure synchronization
	 */
	readonly query: PaletteQuery

	/**
	 * Filtered search results from the palette's search model
	 * Note: Results are not grouped or enhanced with command-box-specific metadata yet
	 * This is deferred to a future implementation slice
	 */
	readonly results: readonly PaletteMatch[]

	/**
	 * Available category chips for filtering
	 * Includes categories from both entries and intents (registered and derived)
	 */
	readonly categories: {
		readonly available: readonly PaletteCategory[]
		readonly active: readonly PaletteCategory[]
		toggle(category: PaletteCategory): void
		removeLast(): PaletteCategory | undefined
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
	execute(intentId?: PaletteIntentId): unknown

	/**
	 * Update the search query and refresh results
	 * Delegates to palette.search.search() to maintain single search path
	 */
	search(query: PaletteQuery): void
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
		manual: [] as PaletteCategory[],
		typed: [] as PaletteCategory[],
	})

	// Selection state
	const selectionState = reactive({ index: -1 })

	// Derive available categories from registry
	const categoryRegistryState = reactive({ available: [] as PaletteCategory[] })

	// Update available categories when registry changes
	function updateAvailableCategories() {
		const categories = new Set<PaletteCategory>()

		// Add categories from entries
		for (const entry of palette.registry.entries) {
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
		for (const entry of palette.registry.entries) {
			for (const intent of palette.intents.derive(entry)) {
				if (intent.categories) {
					for (const category of intent.categories) {
						categories.add(category)
					}
				}
			}
		}

		categoryRegistryState.available.splice(
			0,
			categoryRegistryState.available.length,
			...Array.from(categories).sort()
		)
	}

	function splitInputIntoCategories(value: string) {
		const tokens = value
			.split(/\s+/)
			.map((token) => token.trim())
			.filter((token) => token.length > 0)
		const categories: PaletteCategory[] = []
		const textTokens: string[] = []
		for (const token of tokens) {
			const normalized = token.startsWith('#') ? token.slice(1) : token
			if (categoryRegistryState.available.includes(normalized)) {
				if (!categories.includes(normalized)) categories.push(normalized)
				continue
			}
			textTokens.push(token)
		}
		return {
			categories,
			text: textTokens.join(' '),
		}
	}

	function removeTokenFromInput(value: string, category: PaletteCategory) {
		const tokens = value
			.split(/\s+/)
			.map((token) => token.trim())
			.filter((token) => token.length > 0)
		for (let index = tokens.length - 1; index >= 0; index -= 1) {
			const token = tokens[index]
			const normalized = token.startsWith('#') ? token.slice(1) : token
			if (normalized === category) {
				tokens.splice(index, 1)
				break
			}
		}
		return tokens.join(' ')
	}

	function activeCategories() {
		return Array.from(new Set([...categoryState.manual, ...categoryState.typed]))
	}

	function removeCategory(category: PaletteCategory) {
		let removed = false
		for (let index = categoryState.manual.length - 1; index >= 0; index -= 1) {
			if (categoryState.manual[index] !== category) continue
			categoryState.manual.splice(index, 1)
			removed = true
		}
		const typedIndex = categoryState.typed.lastIndexOf(category)
		if (typedIndex >= 0) {
			categoryState.typed.splice(typedIndex, 1)
			inputState.value = removeTokenFromInput(inputState.value, category)
			removed = true
		}
		return removed
	}

	function syncQuery() {
		const parsed = splitInputIntoCategories(inputState.value)
		categoryState.typed.splice(0, categoryState.typed.length, ...parsed.categories)
		const categories = activeCategories()
		model.search({
			text: parsed.text,
			categories,
		})
	}

	// Initialize available categories
	updateAvailableCategories()

	// Create the command box model
	const model: PaletteCommandBoxModel = {
		get input() {
			return {
				get value() {
					return inputState.value
				},
				set value(value: string) {
					inputState.value = value
					syncQuery()
					model.selection.clear()
				},
				get placeholder() {
					return inputPlaceholder
				},
				clear() {
					model.input.value = ''
				},
			}
		},

		get query(): PaletteQuery {
			return palette.search.query
		},

		get results(): readonly PaletteMatch[] {
			return palette.search.results
		},

		get categories() {
			return {
				get available() {
					return categoryRegistryState.available
				},
				get active() {
					return activeCategories()
				},
				toggle(category: PaletteCategory) {
					if (!removeCategory(category)) {
						categoryState.manual.push(category)
					}
					syncQuery()
					// Reset selection when categories change
					model.selection.clear()
				},
				removeLast() {
					const active = activeCategories()
					const category = active[active.length - 1]
					if (!category) return undefined
					if (!removeCategory(category)) return undefined
					syncQuery()
					model.selection.clear()
					return category
				},
				clear() {
					if (categoryState.manual.length > 0) {
						categoryState.manual.splice(0, categoryState.manual.length)
						syncQuery()
						// Reset selection when categories clear
						model.selection.clear()
					}
				},
			}
		},

		get selection() {
			return {
				get index() {
					return selectionState.index
				},
				get item() {
					const results = model.results
					return selectionState.index >= 0 && selectionState.index < results.length
						? results[selectionState.index]
						: undefined
				},
				set(index: number) {
					const results = model.results
					const validIndex = Math.max(-1, Math.min(index, results.length - 1))
					selectionState.index = validIndex
				},
				next() {
					const results = model.results
					if (results.length === 0) {
						model.selection.clear()
						return
					}
					const nextIndex =
						selectionState.index >= results.length - 1 ? 0 : selectionState.index + 1
					model.selection.set(nextIndex)
				},
				previous() {
					const results = model.results
					if (results.length === 0) {
						model.selection.clear()
						return
					}
					const prevIndex =
						selectionState.index <= 0 ? results.length - 1 : selectionState.index - 1
					model.selection.set(prevIndex)
				},
				clear() {
					selectionState.index = -1
				},
			}
		},

		execute(intentId?: PaletteIntentId): unknown {
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
			palette.search.search(query)
		},
	}

	// Initial search to populate results
	model.search({})

	return model
}
