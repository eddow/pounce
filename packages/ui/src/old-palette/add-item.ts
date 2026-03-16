import type { PaletteModel } from './model'
import { paletteRegistryEntries } from './registry'
import { getEnumSelectorKey, normalizeEnumSelector } from './selector'
import type {
	PaletteDisplayItem,
	PaletteEditorDisplayItem,
	PaletteEntry,
	PaletteIntent,
	PaletteIntentDisplayItem,
} from './types'

export type PaletteAddItemIntentCandidate = {
	readonly kind: 'intent'
	readonly intent: PaletteIntent
	readonly entry: PaletteEntry
}

export type PaletteAddItemEditorCandidate = {
	readonly kind: 'editor'
	readonly entry: PaletteEntry
	readonly displayItem: PaletteEditorDisplayItem
}

export type PaletteAddItemCandidate = PaletteAddItemIntentCandidate | PaletteAddItemEditorCandidate

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

function canEditEntryByDefault(entry: PaletteEntry): boolean {
	return entry.schema.type === 'enum' || entry.schema.type === 'number'
}

function addIntentCandidate(
	candidates: PaletteAddItemCandidate[],
	seenIntentIds: Set<string>,
	intent: PaletteIntent,
	entry: PaletteEntry
): void {
	if (seenIntentIds.has(intent.id)) return
	seenIntentIds.add(intent.id)
	candidates.push({
		kind: 'intent',
		intent,
		entry,
	})
}

function addEditorCandidate(
	candidates: PaletteAddItemCandidate[],
	entry: PaletteEntry,
	displayItem: PaletteEditorDisplayItem
): void {
	candidates.push({
		kind: 'editor',
		entry,
		displayItem,
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
	return (
		displayItem.entryId === candidate.displayItem.entryId &&
		displayItem.presenter === candidate.displayItem.presenter &&
		getEnumSelectorKey(normalizeEnumSelector(displayItem.selector)) ===
			getEnumSelectorKey(normalizeEnumSelector(candidate.displayItem.selector))
	)
}

function candidateSearchText(candidate: PaletteAddItemCandidate): string {
	if (candidate.kind === 'intent') {
		return [
			candidate.intent.label ?? candidate.entry.label,
			candidate.intent.id,
			candidate.intent.description,
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

	return [
		candidate.entry.label,
		candidate.entry.id,
		candidate.entry.description,
		...(candidate.entry.categories ?? []),
		candidate.entry.schema.type,
		candidate.displayItem.presenter,
		...(typeof candidate.displayItem.selector === 'string'
			? [candidate.displayItem.selector]
			: (candidate.displayItem.selector ?? [])),
		candidate.kind,
	]
		.filter((value) => value !== undefined)
		.join(' ')
		.toLowerCase()
}

function addEnumSubsetEditorCandidates(
	candidates: PaletteAddItemCandidate[],
	entry: PaletteEntry
): void {
	if (entry.schema.type !== 'enum') return
	const enumOptions = entry.schema.options.map((opt) => (typeof opt === 'string' ? opt : opt.id))
	if (enumOptions.length < 2) return
	if (enumOptions.length === 2) {
		addEditorCandidate(candidates, entry, {
			kind: 'editor',
			entryId: entry.id,
			selector: enumOptions,
			presenter: 'radio-group',
		})
		return
	}
	const hasLight = enumOptions.includes('light')
	const hasDark = enumOptions.includes('dark')
	if (hasLight && hasDark) {
		addEditorCandidate(candidates, entry, {
			kind: 'editor',
			entryId: entry.id,
			selector: ['light', 'dark'],
			presenter: 'radio-group',
		})
	}
	addEditorCandidate(candidates, entry, {
		kind: 'editor',
		entryId: entry.id,
		selector: enumOptions,
		presenter: 'segmented',
	})
}

function collectCandidates(
	palette: PaletteModel,
	canEditEntry: (entry: PaletteEntry) => boolean
): readonly PaletteAddItemCandidate[] {
	const candidates: PaletteAddItemCandidate[] = []
	const seenIntentIds = new Set<string>()

	for (const intent of palette.intents.intents) {
		const resolved = palette.resolveIntent(intent.id)
		if (!resolved) continue
		addIntentCandidate(candidates, seenIntentIds, resolved.intent, resolved.entry)
	}

	for (const entry of paletteRegistryEntries(palette.registry)) {
		for (const intent of palette.derive(entry.id)) {
			addIntentCandidate(candidates, seenIntentIds, intent, entry)
		}
	}

	for (const entry of paletteRegistryEntries(palette.registry)) {
		if (!canEditEntry(entry)) continue
		addEditorCandidate(candidates, entry, {
			kind: 'editor',
			entryId: entry.id,
		})
	}

	for (const entry of paletteRegistryEntries(palette.registry)) {
		if (!canEditEntry(entry)) continue
		addEnumSubsetEditorCandidates(candidates, entry)
	}

	return candidates
}

export function paletteAddItemModel(options: {
	palette: PaletteModel
	canEditEntry?: (entry: PaletteEntry) => boolean
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
			return false
		},

		search(
			query?: string,
			options?: { exclude?: readonly PaletteDisplayItem[] }
		): readonly PaletteAddItemCandidate[] {
			const normalizedQuery = query?.trim().toLowerCase()
			const excluded = options?.exclude ?? []
			return this.all.filter((candidate) => {
				if (excluded.some((displayItem) => this.matchesDisplayItem(displayItem, candidate))) {
					return false
				}
				if (!normalizedQuery) return true
				return candidateSearchText(candidate).includes(normalizedQuery)
			})
		},
	}
}
