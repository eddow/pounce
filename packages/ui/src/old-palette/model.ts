import { lift, reactive } from 'mutts'
import { executePaletteIntent } from './dispatch'
import { createPaletteIntentSource } from './intents'
import type { PaletteKeyBinding, PaletteKeys } from './keys'
import { createPaletteKeys } from './keys'
import { createPaletteRegistry, paletteRegistryEntries, resolvePaletteEntry } from './registry'
import {
	getKeywordSourceKeywords,
	matchesEnumSelector,
	matchesKeywordQuery,
	normalizeKeywords,
} from './selector'
import type {
	PaletteDisplayConfiguration,
	PaletteDisplayItem,
	PaletteEntry,
	PaletteEnumOption,
	PaletteGroupedProposition,
	PaletteIntent,
	PaletteIntentSource,
	PaletteKeywordSource,
	PaletteMatch,
	PaletteQuery,
	PaletteRegistry,
	PaletteResolvedDisplayItem,
	PaletteResolvedEntry,
	PaletteResolvedIntent,
	PaletteRuntimeState,
	PaletteSearch,
	PaletteToolbar,
	PaletteToolbarSlot,
	PaletteToolbarTrack,
} from './types'

function emptyToolbarTrack(): PaletteToolbarTrack {
	return []
}

function normalizeTrack(
	track: PaletteToolbarTrack | PaletteToolbarSlot[] | undefined
): PaletteToolbarTrack {
	if (!track) return emptyToolbarTrack()
	if (Array.isArray(track)) {
		return track.map((slot) => ({
			toolbar: slot.toolbar,
			space: Number.isFinite(slot.space) ? Math.min(1, Math.max(0, slot.space)) : 0,
		}))
	}
	const legacyTrack = track as {
		readonly slots?: readonly PaletteToolbarSlot[]
		readonly toolbars?: readonly PaletteToolbar[]
		readonly spaces?: readonly number[]
	}
	if (legacyTrack.slots) {
		return legacyTrack.slots.map((slot) => ({
			toolbar: slot.toolbar,
			space: Number.isFinite(slot.space) ? Math.min(1, Math.max(0, slot.space)) : 0,
		}))
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
				? legacyTrack.spaces
						.map((_, index, actualSpaces) => {
							const remaining = actualSpaces
								.slice(index)
								.reduce((sum, value) => sum + Math.max(value, 0), 0)
							const actualSpace = Math.max(actualSpaces[index] ?? 0, 0)
							return remaining > 0 ? Math.min(1, Math.max(0, actualSpace / remaining)) : 0
						})
						.slice(0, -1)
				: fallbackSpaces
	const slots: PaletteToolbarSlot[] = toolbars.map((toolbar, index) => ({
		toolbar,
		space: spaces[index] ?? fallbackSpaces[index] ?? 0,
	}))
	return slots
}

function isToolbarTrack(
	value: readonly (PaletteToolbarTrack | PaletteToolbarSlot[])[] | PaletteToolbarTrack
): value is PaletteToolbarTrack {
	return Array.isArray(value) && (value.length === 0 || 'toolbar' in value[0])
}

function normalizeTracks(
	tracks: readonly (PaletteToolbarTrack | PaletteToolbarSlot[])[] | undefined
): PaletteToolbarTrack[] {
	if (!tracks) return [emptyToolbarTrack()]
	if (!isToolbarTrack(tracks))
		return tracks.length > 0 ? tracks.map((track) => normalizeTrack(track)) : [emptyToolbarTrack()]
	return [normalizeTrack(tracks)]
}

export interface PaletteModel {
	readonly registry: PaletteRegistry
	readonly intents: PaletteIntentSource
	readonly keys: PaletteKeys
	readonly runtime: PaletteRuntimeState
	readonly display: PaletteDisplayConfiguration
	readonly search: PaletteSearch

	run(intentId: string): unknown
	derive(entryId: string): readonly PaletteIntent[]
	resolveEntry(entryId: string): PaletteEntry | undefined
	resolveIntent(intentId: string):
		| {
				readonly intent: PaletteIntent
				readonly entry: PaletteEntry
		  }
		| undefined
	resolveDisplayItem(item: PaletteDisplayItem): PaletteResolvedDisplayItem | undefined
}

function entryKeywordSource(entry: PaletteEntry): PaletteKeywordSource {
	return {
		id: entry.id,
		keywords: entry.categories,
	}
}

function intentKeywordSource(intent: PaletteIntent, entry: PaletteEntry): PaletteKeywordSource {
	return {
		id: intent.id,
		keywords: [
			...(intent.categories ?? []),
			...getKeywordSourceKeywords(entryKeywordSource(entry)),
		],
	}
}

function entryMatchesQuery(entry: PaletteEntry, query: PaletteQuery): boolean {
	return matchesKeywordQuery(entryKeywordSource(entry), {
		keywords: query.keywords ?? [],
		free: query.free,
	})
}

function intentMatchesQuery(
	intent: PaletteIntent,
	entry: PaletteEntry,
	query: PaletteQuery
): boolean {
	return matchesKeywordQuery(intentKeywordSource(intent, entry), {
		keywords: query.keywords ?? [],
		free: query.free,
	})
}

function normalizeEnumOption<T extends string>(
	option: T | PaletteEnumOption<T>
): PaletteEnumOption<T> {
	return typeof option === 'string' ? { id: option } : option
}

function resolveDerivedIntent(
	registry: PaletteRegistry,
	intents: PaletteIntentSource,
	intentId: string
):
	| {
			readonly intent: PaletteIntent
			readonly entry: PaletteEntry
	  }
	| undefined {
	for (const entry of paletteRegistryEntries(registry)) {
		for (const intent of intents.derive(entry)) {
			if (intent.id === intentId) {
				return { intent, entry }
			}
		}
	}
	return undefined
}

export function collectResolvedIntents(
	registry: PaletteRegistry,
	intents: PaletteIntentSource
): readonly {
	readonly intent: PaletteIntent
	readonly entry: PaletteEntry
}[] {
	const resolved = new Map<
		string,
		{
			readonly intent: PaletteIntent
			readonly entry: PaletteEntry
		}
	>()

	for (const intent of intents.intents) {
		const entry = resolvePaletteEntry(registry, intent.targetId)
		if (!entry) continue
		resolved.set(intent.id, { intent, entry })
	}

	for (const entry of paletteRegistryEntries(registry)) {
		for (const intent of intents.derive(entry)) {
			if (!resolved.has(intent.id)) {
				resolved.set(intent.id, { intent, entry })
			}
		}
	}

	return Array.from(resolved.values())
}

function resolveEnumEditorSubset(
	palette: PaletteModel,
	entry: PaletteEntry,
	selector: string | readonly string[]
): readonly PaletteResolvedIntent[] | undefined {
	if (entry.schema.type !== 'enum') return undefined
	return entry.schema.options
		.map(normalizeEnumOption)
		.filter((option) =>
			matchesEnumSelector(
				{ id: option.id, keywords: [...(option.categories ?? []), ...(option.keywords ?? [])] },
				selector
			)
		)
		.map((option) => option.id)
		.map((option) => {
			const intentId = `${entry.id}:set:${option}`
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

export function createPaletteModel(options?: {
	definitions?: PaletteRegistry
	intents?: readonly PaletteIntent[]
	bindings?: readonly PaletteKeyBinding[]
	display?: PaletteDisplayConfiguration
	runtime?: PaletteRuntimeState
	derive?: (entry: PaletteEntry) => readonly PaletteIntent[]
}): PaletteModel {
	const registry = createPaletteRegistry(options?.definitions)
	const intents = createPaletteIntentSource({
		intents: options?.intents,
		derive: options?.derive,
	})
	const keys = createPaletteKeys(options?.bindings)

	const runtime = reactive(options?.runtime ?? {})

	function generateGroupedPropositions(
		existingResults: PaletteMatch[],
		query?: PaletteQuery
	): PaletteGroupedProposition[] {
		void query
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
			...(options?.display?.container ?? {}),
			toolbarStack: {
				top: normalizeTracks(options?.display?.container?.toolbarStack.top),
				right: normalizeTracks(options?.display?.container?.toolbarStack.right),
				bottom: normalizeTracks(options?.display?.container?.toolbarStack.bottom),
				left: normalizeTracks(options?.display?.container?.toolbarStack.left),
			},
			editMode: false,
			parkedToolbars: [...(options?.display?.container?.parkedToolbars ?? [])],
		},
	})

	const search: PaletteSearch = (query: PaletteQuery) =>
		lift`createPaletteModel.search`(() => {
			const normalizedQuery: PaletteQuery = {
				keywords: normalizeKeywords(query.keywords),
				free: query.free,
			}
			const results: PaletteMatch[] = []

			for (const resolved of collectResolvedIntents(registry, intents)) {
				if (!intentMatchesQuery(resolved.intent, resolved.entry, normalizedQuery)) continue
				results.push({
					kind: 'intent',
					intent: resolved.intent,
					entry: resolved.entry,
				})
			}

			for (const entry of paletteRegistryEntries(registry)) {
				if (results.some((result) => result.kind === 'intent' && result.entry.id === entry.id))
					continue
				if (!entryMatchesQuery(entry, normalizedQuery)) continue
				results.push({
					kind: 'entry',
					entry,
				})
			}

			results.push(...generateGroupedPropositions(results, normalizedQuery))
			return results
		})

	return {
		registry,
		intents,
		keys,
		runtime,
		display,
		search,

		run(intentId: string): unknown {
			const resolved = this.resolveIntent(intentId)
			if (!resolved) {
				throw new Error(`Intent not found: ${intentId}`)
			}
			return executePaletteIntent(this, resolved.intent)
		},

		derive(entryId: string): readonly PaletteIntent[] {
			const entry = this.resolveEntry(entryId)
			if (!entry) return []
			return this.intents.derive(entry)
		},

		resolveEntry(entryId: string): PaletteEntry | undefined {
			return resolvePaletteEntry(this.registry, entryId)
		},

		resolveIntent(intentId: string):
			| {
					readonly intent: PaletteIntent
					readonly entry: PaletteEntry
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
				const resolvedIntents =
					item.selector !== undefined
						? resolveEnumEditorSubset(this, entry, item.selector)
						: undefined

				return {
					...item,
					entry,
					resolvedIntents,
				}
			}
			return undefined
		},
	}
}
