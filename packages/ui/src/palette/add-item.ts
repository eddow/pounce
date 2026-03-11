import type { PaletteModel } from './model'
import type {
	PaletteDisplayItem,
	PaletteEditorDisplayItem,
	PaletteEntryDefinition,
	PaletteIntent,
	PaletteIntentDisplayItem,
	PaletteItemGroupDefinition,
	PaletteItemGroupDisplayItem,
} from './types'

export type PaletteAddItemIntentCandidate = {
	readonly kind: 'intent'
	readonly intent: PaletteIntent
	readonly entry: PaletteEntryDefinition
}

export type PaletteAddItemEditorCandidate = {
	readonly kind: 'editor'
	readonly entry: PaletteEntryDefinition
}

export type PaletteAddItemItemGroupCandidate = {
	readonly kind: 'item-group'
	readonly entry: PaletteEntryDefinition
	readonly group: PaletteItemGroupDefinition
}

export type PaletteAddItemCandidate =
	| PaletteAddItemIntentCandidate
	| PaletteAddItemEditorCandidate
	| PaletteAddItemItemGroupCandidate

export type PaletteAddItemModel = {
	readonly all: readonly PaletteAddItemCandidate[]
	matchesDisplayItem(displayItem: PaletteDisplayItem, candidate: PaletteAddItemCandidate): boolean
	search(
		query?: string,
		options?: {
			exclude?: readonly PaletteDisplayItem[]
		}
	): readonly PaletteAddItemCandidate[]
}

function canEditEntryByDefault(entry: PaletteEntryDefinition): boolean {
	return entry.schema.type === 'enum' || entry.schema.type === 'number'
}

function addIntentCandidate(
	candidates: PaletteAddItemCandidate[],
	seenIntentIds: Set<string>,
	intent: PaletteIntent,
	entry: PaletteEntryDefinition
): void {
	if (seenIntentIds.has(intent.id)) return
	seenIntentIds.add(intent.id)
	candidates.push({
		kind: 'intent',
		intent,
		entry,
	})
}

function matchesIntentDisplayItem(
	displayItem: PaletteIntentDisplayItem,
	candidate: PaletteAddItemIntentCandidate
): boolean {
	return displayItem.intentId === candidate.intent.id
}

function matchesEditorDisplayItem(
	displayItem: PaletteEditorDisplayItem,
	candidate: PaletteAddItemEditorCandidate
): boolean {
	return displayItem.entryId === candidate.entry.id
}

function matchesItemGroupDisplayItem(
	displayItem: PaletteItemGroupDisplayItem,
	candidate: PaletteAddItemItemGroupCandidate
): boolean {
	// Compare entryId, group.kind, AND exact options subset for precise matching
	const displayOptions = [...displayItem.group.options].sort()
	const candidateOptions = [...candidate.group.options].sort()

	return (
		displayItem.group.entryId === candidate.entry.id &&
		displayItem.group.kind === candidate.group.kind &&
		displayOptions.length === candidateOptions.length &&
		displayOptions.every((opt, index) => opt === candidateOptions[index])
	)
}

function candidateSearchText(candidate: PaletteAddItemCandidate): string {
	if (candidate.kind === 'intent') {
		return [
			candidate.intent.label ?? candidate.entry.label,
			candidate.intent.id,
			candidate.intent.description,
			candidate.intent.binding,
			candidate.entry.label,
			candidate.entry.id,
			candidate.entry.description,
			...(candidate.intent.categories ?? []),
			...(candidate.entry.categories ?? []),
			candidate.kind,
		]
			.filter((value) => value !== undefined)
			.join(' ')
			.toLowerCase()
	}

	if (candidate.kind === 'item-group') {
		const group = candidate.group
		const optionText = group.kind === 'enum-options' ? group.options.join(' ') : ''
		return [
			candidate.entry.label,
			candidate.entry.id,
			candidate.entry.description,
			...(candidate.entry.categories ?? []),
			group.kind,
			optionText,
			candidate.kind,
		]
			.filter((value) => value !== undefined)
			.join(' ')
			.toLowerCase()
	}

	return [
		candidate.entry.label,
		candidate.entry.id,
		candidate.entry.description,
		...(candidate.entry.categories ?? []),
		candidate.entry.schema.type,
		candidate.kind,
	]
		.filter((value) => value !== undefined)
		.join(' ')
		.toLowerCase()
}

function addItemGroupCandidate(
	candidates: PaletteAddItemCandidate[],
	entry: PaletteEntryDefinition
): void {
	if (entry.schema.type === 'enum') {
		const enumOptions = entry.schema.options.map((opt) =>
			typeof opt === 'string' ? opt : opt.value
		)

		if (enumOptions.length >= 2) {
			// Strategy 1: If there are exactly 2 options, offer them as a natural pair
			if (enumOptions.length === 2) {
				candidates.push({
					kind: 'item-group',
					entry,
					group: {
						kind: 'enum-options',
						entryId: entry.id,
						options: enumOptions,
						presenter: 'radio-group',
					},
				})
				return
			}

			// Strategy 2: For themes, look for common light/dark pairs
			const hasLight = enumOptions.includes('light')
			const hasDark = enumOptions.includes('dark')
			if (hasLight && hasDark) {
				candidates.push({
					kind: 'item-group',
					entry,
					group: {
						kind: 'enum-options',
						entryId: entry.id,
						options: ['light', 'dark'],
						presenter: 'radio-group',
					},
				})
			}

			// Strategy 3: For 3+ options, also offer the full set as a comprehensive option
			if (enumOptions.length > 2) {
				candidates.push({
					kind: 'item-group',
					entry,
					group: {
						kind: 'enum-options',
						entryId: entry.id,
						options: enumOptions,
						presenter: 'segmented',
					},
				})
			}
		}
	}
}

function collectCandidates(
	palette: PaletteModel,
	canEditEntry: (entry: PaletteEntryDefinition) => boolean
): readonly PaletteAddItemCandidate[] {
	const candidates: PaletteAddItemCandidate[] = []
	const seenIntentIds = new Set<string>()

	for (const intent of palette.intents.intents) {
		const resolved = palette.resolveIntent(intent.id)
		if (!resolved) continue
		addIntentCandidate(candidates, seenIntentIds, resolved.intent, resolved.entry)
	}

	for (const entry of palette.registry.entries) {
		for (const intent of palette.derive(entry.id)) {
			addIntentCandidate(candidates, seenIntentIds, intent, entry)
		}
	}

	for (const entry of palette.registry.entries) {
		if (!canEditEntry(entry)) continue
		candidates.push({
			kind: 'editor',
			entry,
		})
	}

	// Add item-group candidates for enum entries
	for (const entry of palette.registry.entries) {
		addItemGroupCandidate(candidates, entry)
	}

	return candidates
}

export function paletteAddItemModel(options: {
	palette: PaletteModel
	canEditEntry?: (entry: PaletteEntryDefinition) => boolean
}): PaletteAddItemModel {
	const canEditEntry = options.canEditEntry ?? canEditEntryByDefault

	return {
		get all(): readonly PaletteAddItemCandidate[] {
			return collectCandidates(options.palette, canEditEntry)
		},

		matchesDisplayItem(
			displayItem: PaletteDisplayItem,
			candidate: PaletteAddItemCandidate
		): boolean {
			if (displayItem.kind === 'intent' && candidate.kind === 'intent') {
				return matchesIntentDisplayItem(displayItem, candidate)
			}
			if (displayItem.kind === 'editor' && candidate.kind === 'editor') {
				return matchesEditorDisplayItem(displayItem, candidate)
			}
			if (displayItem.kind === 'item-group' && candidate.kind === 'item-group') {
				return matchesItemGroupDisplayItem(displayItem, candidate)
			}
			return false
		},

		search(
			query?: string,
			options?: { exclude?: readonly PaletteDisplayItem[] }
		): readonly PaletteAddItemCandidate[] {
			const normalizedQuery = query?.trim().toLowerCase()
			const excluded = options?.exclude ?? []
			return this.all.filter((candidate) => {
				if (excluded.some((displayItem) => this.matchesDisplayItem(displayItem, candidate)))
					return false
				if (!normalizedQuery) return true
				return candidateSearchText(candidate).includes(normalizedQuery)
			})
		},
	}
}
