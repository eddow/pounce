import { reactive } from 'mutts'
import { executePaletteIntent } from './dispatch'
import { createPaletteIntentSource } from './intents'
import { createPaletteRegistry } from './registry'
import type {
	PaletteDisplayConfiguration,
	PaletteDisplayItem,
	PaletteEntryDefinition,
	PaletteEntryId,
	PaletteIntent,
	PaletteIntentId,
	PaletteIntentSource,
	PaletteItemGroupDefinition,
	PaletteMatch,
	PaletteQuery,
	PaletteRegistry,
	PaletteResolvedDisplayItem,
	PaletteResolvedIntent,
	PaletteRuntimeState,
	PaletteSearchModel,
	PaletteState,
} from './types'

export interface PaletteModel {
	readonly registry: PaletteRegistry
	readonly intents: PaletteIntentSource
	readonly state: PaletteState
	readonly runtime: PaletteRuntimeState
	readonly display: PaletteDisplayConfiguration
	readonly search: PaletteSearchModel

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
	return searchText.includes(textQuery)
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
	return searchText.includes(textQuery)
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

	const state = reactive(options?.state ?? {})
	const runtime = reactive(options?.runtime ?? {})
	const display = reactive({
		toolbars: [],
		...(options?.display ?? {}),
		container: {
			surfaces: [],
			editMode: false,
			dropTargets: [],
			...(options?.display?.container ?? {}),
		},
	})

	const searchResults = reactive([]) as PaletteMatch[]
	const searchQuery = reactive({}) as {
		text?: string
		categories?: readonly string[]
	}

	const search: PaletteSearchModel = {
		get query(): PaletteQuery {
			return searchQuery
		},

		get results(): readonly PaletteMatch[] {
			return searchResults
		},

		search(next: PaletteQuery) {
			searchQuery.text = undefined
			searchQuery.categories = undefined
			Object.assign(searchQuery, next)
			const textQuery = next.text?.toLowerCase().trim()
			const categoryFilter = new Set(next.categories ?? [])
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
				if (results.some((r) => r.kind === 'intent' && r.entry.id === entry.id)) continue
				if (!entryMatchesCategories(entry, categoryFilter)) continue
				if (!entryMatchesText(entry, textQuery)) continue
				results.push({
					kind: 'entry',
					entry,
				})
			}

			searchResults.splice(0, searchResults.length, ...results)
		},
	}

	return {
		registry,
		intents,
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
