import { lift, reactive } from 'mutts'
import { executePaletteIntent } from './dispatch'
import { createPaletteIntentSource } from './intents'
import type { PaletteKeyBinding, PaletteKeys } from './keys'
import { createPaletteKeys } from './keys'
import { createPaletteRegistry } from './registry'
import type {
	PaletteDisplayConfiguration,
	PaletteDisplayItem,
	PaletteEntryDefinition,
	PaletteEntryId,
	PaletteGroupedProposition,
	PaletteIntent,
	PaletteIntentId,
	PaletteIntentSource,
	PaletteItemGroupDefinition,
	PaletteMatch,
	PaletteQuery,
	PaletteRegistry,
	PaletteResolvedDisplayItem,
	PaletteResolvedEntry,
	PaletteResolvedIntent,
	PaletteRuntimeState,
	PaletteSearch,
	PaletteState,
	PaletteToolbar,
	PaletteToolbarSlot,
	PaletteToolbarTrack,
} from './types'

function emptyToolbarTrack(): PaletteToolbarTrack {
	return {
		slots: [],
	}
}

function normalizeTrack(track: PaletteToolbarTrack | undefined): PaletteToolbarTrack {
	if (!track) return emptyToolbarTrack()
	if ('slots' in track) {
		return {
			slots: track.slots.map((slot) => ({
				toolbar: slot.toolbar,
				space: Number.isFinite(slot.space) ? Math.min(1, Math.max(0, slot.space)) : 0,
			})),
		}
	}
	const legacyTrack = track as PaletteToolbarTrack & {
		readonly toolbars?: readonly PaletteToolbar[]
		readonly spaces?: readonly number[]
	}
	const toolbars = legacyTrack.toolbars ?? []
	const fallbackSpaces = Array.from(
		{ length: toolbars.length },
		(_, index) => 1 / (toolbars.length + 1 - index)
	)
	const spaces =
		legacyTrack.spaces?.length === toolbars.length
			? legacyTrack.spaces
			: legacyTrack.spaces?.length === toolbars.length + 1
				? legacyTrack.spaces.slice(0, -1)
				: fallbackSpaces
	const slots: PaletteToolbarSlot[] = toolbars.map((toolbar, index) => ({
		toolbar,
		space: spaces[index] ?? fallbackSpaces[index] ?? 0,
	}))
	return { slots }
}

function isToolbarTrack(
	value: readonly PaletteToolbarTrack[] | PaletteToolbarTrack
): value is PaletteToolbarTrack {
	return 'slots' in value
}

function normalizeTracks(
	tracks: readonly PaletteToolbarTrack[] | PaletteToolbarTrack | undefined
): readonly PaletteToolbarTrack[] {
	if (!tracks) return [emptyToolbarTrack()]
	if (!isToolbarTrack(tracks))
		return tracks.length > 0 ? tracks.map((track) => normalizeTrack(track)) : [emptyToolbarTrack()]
	return [normalizeTrack(tracks)]
}

export interface PaletteModel {
	readonly registry: PaletteRegistry
	readonly intents: PaletteIntentSource
	readonly keys: PaletteKeys
	readonly state: PaletteState
	readonly runtime: PaletteRuntimeState
	readonly display: PaletteDisplayConfiguration
	readonly search: PaletteSearch

	run(intentId: PaletteIntentId): unknown
	derive(entryId: PaletteEntryId): readonly PaletteIntent[]
	resolveEntry(entryId: PaletteEntryId): PaletteEntryDefinition | undefined
	resolveIntent(intentId: PaletteIntentId):
		| {
				readonly intent: PaletteIntent
				readonly entry: PaletteEntryDefinition
		  }
		| undefined
	resolveDisplayItem(item: PaletteDisplayItem): PaletteResolvedDisplayItem | undefined
}

function entryMatchesCategories(
	entry: PaletteEntryDefinition,
	categories: ReadonlySet<string>
): boolean {
	if (categories.size === 0) return true
	const entryCategories = entry.categories ?? []
	return [...categories].some((category) => entryCategories.includes(category))
}

function intentMatchesCategories(
	intent: PaletteIntent,
	entry: PaletteEntryDefinition,
	categories: ReadonlySet<string>
): boolean {
	if (categories.size === 0) return true
	const intentCategories = intent.categories ?? []
	const entryCategories = entry.categories ?? []
	return [...categories].some(
		(category) => intentCategories.includes(category) || entryCategories.includes(category)
	)
}

function entryMatchesText(entry: PaletteEntryDefinition, textQuery: string | undefined): boolean {
	if (!textQuery) return true
	const searchText = [entry.label, entry.id, entry.description, ...(entry.categories ?? [])]
		.filter((value) => value !== undefined)
		.join(' ')
		.toLowerCase()
	return textQuery
		.split(/\s+/)
		.filter((term) => term.length > 0)
		.every((term) => searchText.includes(term))
}

function intentMatchesText(
	intent: PaletteIntent,
	entry: PaletteEntryDefinition,
	textQuery: string | undefined
): boolean {
	if (!textQuery) return true
	const searchText = [
		intent.label ?? entry.label,
		intent.id,
		intent.description,
		entry.description,
		...(intent.categories ?? []),
		...(entry.categories ?? []),
	]
		.filter((value) => value !== undefined)
		.join(' ')
		.toLowerCase()
	return textQuery
		.split(/\s+/)
		.filter((term) => term.length > 0)
		.every((term) => searchText.includes(term))
}

function resolveDerivedIntent(
	registry: PaletteRegistry,
	intents: PaletteIntentSource,
	intentId: PaletteIntentId
):
	| {
			readonly intent: PaletteIntent
			readonly entry: PaletteEntryDefinition
	  }
	| undefined {
	for (const entry of registry.entries) {
		for (const intent of intents.derive(entry)) {
			if (intent.id === intentId) {
				return { intent, entry }
			}
		}
	}
	return undefined
}

function collectResolvedIntents(
	registry: PaletteRegistry,
	intents: PaletteIntentSource
): readonly {
	readonly intent: PaletteIntent
	readonly entry: PaletteEntryDefinition
}[] {
	const resolved = new Map<
		PaletteIntentId,
		{
			readonly intent: PaletteIntent
			readonly entry: PaletteEntryDefinition
		}
	>()

	for (const intent of intents.intents) {
		const entry = registry.get(intent.targetId)
		if (!entry) continue
		resolved.set(intent.id, { intent, entry })
	}

	for (const entry of registry.entries) {
		for (const intent of intents.derive(entry)) {
			if (!resolved.has(intent.id)) {
				resolved.set(intent.id, { intent, entry })
			}
		}
	}

	return Array.from(resolved.values())
}

function resolveItemGroup(
	palette: PaletteModel,
	group: PaletteItemGroupDefinition
): readonly PaletteResolvedIntent[] | undefined {
	const entry = palette.resolveEntry(group.entryId)
	if (!entry) return undefined

	if (group.kind === 'enum-options') {
		if (entry.schema.type !== 'enum') {
			return undefined
		}

		const enumOptions = entry.schema.options.map((opt) =>
			typeof opt === 'string' ? opt : opt.value
		)

		return group.options
			.filter((option) => enumOptions.includes(option))
			.map((option) => {
				const intentId = `${group.entryId}:set:${option}`
				const resolved = palette.resolveIntent(intentId)
				if (!resolved) {
					throw new Error(`Derived intent not found for ${intentId}`)
				}
				return {
					kind: 'intent' as const,
					intent: resolved.intent,
					entry: resolved.entry,
				}
			})
	}

	return undefined
}

export function createPaletteModel(options?: {
	definitions?: readonly PaletteEntryDefinition[]
	intents?: readonly PaletteIntent[]
	bindings?: readonly PaletteKeyBinding[]
	state?: PaletteState
	display?: PaletteDisplayConfiguration
	runtime?: PaletteRuntimeState
	derive?: (entry: PaletteEntryDefinition) => readonly PaletteIntent[]
}): PaletteModel {
	const registry = createPaletteRegistry(options?.definitions)
	const intents = createPaletteIntentSource({
		intents: options?.intents,
		derive: options?.derive,
	})
	const keys = createPaletteKeys(options?.bindings)

	const state = reactive(options?.state ?? {})
	const runtime = reactive(options?.runtime ?? {})

	function generateGroupedPropositions(
		existingResults: PaletteMatch[],
		textQuery?: string,
		categoryFilter?: Set<string>
	): PaletteGroupedProposition[] {
		void textQuery
		void categoryFilter
		const propositions: PaletteGroupedProposition[] = []
		const intentsByEntry = new Map<string, PaletteResolvedIntent[]>()

		for (const result of existingResults) {
			if (result.kind === 'intent') {
				const entryId = result.entry.id
				if (!intentsByEntry.has(entryId)) {
					intentsByEntry.set(entryId, [])
				}
				intentsByEntry.get(entryId)!.push(result)
			}
		}

		for (const intents of intentsByEntry.values()) {
			if (intents.length < 2) continue
			const entry = intents[0].entry
			const resolvedEntry: PaletteResolvedEntry = {
				kind: 'entry',
				entry,
			}

			if (entry.schema.type === 'enum') {
				const options = intents.map(
					(resolved) => resolved.intent.id.split(':').at(-1) ?? resolved.intent.mode
				)
				propositions.push({
					kind: 'grouped-proposition',
					label: `${entry.label} (${options.join(', ')})`,
					description: `${options.length} selected options`,
					intents,
					entries: [resolvedEntry],
					type: 'enum-subset',
				})
				continue
			}

			propositions.push({
				kind: 'grouped-proposition',
				label: `${entry.label} (all modes)`,
				description: `All ${intents.length} available modes`,
				intents,
				entries: [resolvedEntry],
				type: 'intent-group',
			})
		}

		return propositions
	}

	const display = reactive({
		...(options?.display ?? {}),
		container: {
			toolbarStack: {
				top: normalizeTracks(options?.display?.container?.toolbarStack.top),
				right: normalizeTracks(options?.display?.container?.toolbarStack.right),
				bottom: normalizeTracks(options?.display?.container?.toolbarStack.bottom),
				left: normalizeTracks(options?.display?.container?.toolbarStack.left),
			},
			editMode: false,
			parkedToolbars: [...(options?.display?.container?.parkedToolbars ?? [])],
			...(options?.display?.container ?? {}),
		},
	})

	const search: PaletteSearch = (query: PaletteQuery) =>
		lift`createPaletteModel.search`(() => {
			const textQuery = query.text?.toLowerCase().trim()
			const categoryFilter = new Set(query.categories ?? [])
			const results: PaletteMatch[] = []

			for (const resolved of collectResolvedIntents(registry, intents)) {
				if (!intentMatchesCategories(resolved.intent, resolved.entry, categoryFilter)) continue
				if (!intentMatchesText(resolved.intent, resolved.entry, textQuery)) continue
				results.push({
					kind: 'intent',
					intent: resolved.intent,
					entry: resolved.entry,
				})
			}

			for (const entry of registry.entries) {
				if (results.some((result) => result.kind === 'intent' && result.entry.id === entry.id))
					continue
				if (!entryMatchesCategories(entry, categoryFilter)) continue
				if (!entryMatchesText(entry, textQuery)) continue
				results.push({
					kind: 'entry',
					entry,
				})
			}

			results.push(...generateGroupedPropositions(results, textQuery, categoryFilter))
			return results
		})

	return {
		registry,
		intents,
		keys,
		state,
		runtime,
		display,
		search,

		run(intentId: PaletteIntentId): unknown {
			const resolved = this.resolveIntent(intentId)
			if (!resolved) {
				throw new Error(`Intent not found: ${intentId}`)
			}
			return executePaletteIntent(this, resolved.intent)
		},

		derive(entryId: PaletteEntryId): readonly PaletteIntent[] {
			const entry = this.resolveEntry(entryId)
			if (!entry) return []
			return this.intents.derive(entry)
		},

		resolveEntry(entryId: PaletteEntryId): PaletteEntryDefinition | undefined {
			return this.registry.get(entryId)
		},

		resolveIntent(intentId: PaletteIntentId):
			| {
					readonly intent: PaletteIntent
					readonly entry: PaletteEntryDefinition
			  }
			| undefined {
			const intent = this.intents.get(intentId)
			if (intent) {
				const entry = this.resolveEntry(intent.targetId)
				if (entry) {
					return { intent, entry }
				}
			}
			return resolveDerivedIntent(this.registry, this.intents, intentId)
		},

		resolveDisplayItem(item: PaletteDisplayItem): PaletteResolvedDisplayItem | undefined {
			if (item.kind === 'intent') {
				const resolved = this.resolveIntent(item.intentId)
				if (!resolved) return undefined

				return {
					...item,
					intent: resolved.intent,
					entry: resolved.entry,
				}
			} else if (item.kind === 'editor') {
				const entry = this.resolveEntry(item.entryId)
				if (!entry) return undefined

				return {
					...item,
					entry,
				}
			} else if (item.kind === 'item-group') {
				const entry = this.resolveEntry(item.group.entryId)
				if (!entry) return undefined

				const resolvedItems = resolveItemGroup(this, item.group)
				if (!resolvedItems) return undefined

				return {
					...item,
					entry,
					resolvedItems,
				}
			}
			return undefined
		},
	}
}
