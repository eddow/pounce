import type {
	PaletteActionDefinition,
	PaletteBooleanDefinition,
	PaletteCategory,
	PaletteEntryDefinition,
	PaletteEntryId,
	PaletteEnumDefinition,
	PaletteEnumOption,
	PaletteIntent,
	PaletteIntentId,
	PaletteIntentSource,
	PaletteNumberDefinition,
	PaletteStatusDefinition,
} from './types'

// ============================================================================
// Intent Derivation Utilities
// ============================================================================

/**
 * Creates deterministic intent IDs following the composition convention:
 * - entryId:mode (e.g., "ui.theme:toggle")
 * - entryId:mode:value (e.g., "ui.theme:set:light")
 * - entryId:mode:values (e.g., "ui.theme:flip:light-dark")
 */
function createIntentId(entryId: PaletteEntryId, mode: string, suffix?: string): PaletteIntentId {
	return suffix ? `${entryId}:${mode}:${suffix}` : `${entryId}:${mode}`
}

function mergeCategories(
	left: readonly PaletteCategory[] | undefined,
	right: readonly PaletteCategory[] | undefined
): readonly PaletteCategory[] | undefined {
	if (!left?.length) return right
	if (!right?.length) return left
	return Array.from(new Set([...left, ...right]))
}

function normalizeEnumOption<T extends string>(
	option: T | PaletteEnumOption<T>
): PaletteEnumOption<T> {
	return typeof option === 'string' ? { value: option } : option
}

/**
 * Derives intents for boolean schema entries
 */
function deriveBooleanIntents(
	entry: PaletteEntryDefinition & { schema: PaletteBooleanDefinition }
): readonly PaletteIntent[] {
	return [
		{
			id: createIntentId(entry.id, 'set', 'true'),
			targetId: entry.id,
			mode: 'set',
			value: true,
			label: `Enable ${entry.label}`,
		},
		{
			id: createIntentId(entry.id, 'set', 'false'),
			targetId: entry.id,
			mode: 'set',
			value: false,
			label: `Disable ${entry.label}`,
		},
		{
			id: createIntentId(entry.id, 'toggle'),
			targetId: entry.id,
			mode: 'toggle',
			label: `Toggle ${entry.label}`,
		},
	]
}

/**
 * Derives intents for enum schema entries
 */
function deriveEnumIntents(
	entry: PaletteEntryDefinition & { schema: PaletteEnumDefinition }
): readonly PaletteIntent[] {
	const options = entry.schema.options.map(normalizeEnumOption)
	const intents: PaletteIntent[] = []

	for (const option of options) {
		intents.push({
			id: createIntentId(entry.id, 'set', option.value),
			targetId: entry.id,
			mode: 'set',
			value: option.value,
			label: option.label ?? option.value,
			description: option.description,
			icon: option.icon,
			categories: mergeCategories(entry.categories, option.categories),
		})
	}

	return intents
}

/**
 * Derives intents for number schema entries
 *
 * Numbers are treated as hybrids of:
 * - Relative commands: step up/down for incremental adjustments
 * - Absolute presets: stash intents for specific values (min, max, zero, etc.)
 */
function deriveNumberIntents(
	entry: PaletteEntryDefinition & { schema: PaletteNumberDefinition }
): readonly PaletteIntent[] {
	const step = entry.schema.step ?? 1
	const intents: PaletteIntent[] = [
		// Relative commands
		{
			id: createIntentId(entry.id, 'step', 'up'),
			targetId: entry.id,
			mode: 'step',
			step,
			label: `Increase ${entry.label}`,
		},
		{
			id: createIntentId(entry.id, 'step', 'down'),
			targetId: entry.id,
			mode: 'step',
			step: -step,
			label: `Decrease ${entry.label}`,
		},
	]

	const presetValues = new Set<string>()

	function addPreset(value: number, label: string) {
		const suffix = value.toString()
		if (presetValues.has(suffix)) return
		presetValues.add(suffix)
		intents.push({
			id: createIntentId(entry.id, 'stash', suffix),
			targetId: entry.id,
			mode: 'stash',
			value,
			fallback: { kind: 'step', step },
			label,
		})
	}

	if (entry.schema.min !== undefined) addPreset(entry.schema.min, `Set ${entry.label} to minimum`)

	if (entry.schema.max !== undefined) addPreset(entry.schema.max, `Set ${entry.label} to maximum`)

	const zeroInRange =
		(entry.schema.min === undefined || entry.schema.min <= 0) &&
		(entry.schema.max === undefined || entry.schema.max >= 0)

	if (zeroInRange) addPreset(0, `Reset ${entry.label} to zero`)

	// Add mid-point preset if range is defined and wide enough
	if (entry.schema.min !== undefined && entry.schema.max !== undefined) {
		const range = entry.schema.max - entry.schema.min
		if (range >= 2) {
			const mid = Math.floor((entry.schema.min + entry.schema.max) / 2)
			addPreset(mid, `Set ${entry.label} to midpoint`)
		}
	}

	return intents
}

function deriveActionIntents(
	entry: PaletteEntryDefinition & { schema: PaletteActionDefinition }
): readonly PaletteIntent[] {
	return [
		{
			id: createIntentId(entry.id, 'run'),
			targetId: entry.id,
			mode: 'run',
			label: entry.label,
			description: entry.description,
			icon: entry.icon,
			categories: entry.categories,
		},
	]
}

function isBooleanEntry(
	entry: PaletteEntryDefinition
): entry is PaletteEntryDefinition & { schema: PaletteBooleanDefinition } {
	return entry.schema.type === 'boolean'
}

function isEnumEntry(
	entry: PaletteEntryDefinition
): entry is PaletteEntryDefinition & { schema: PaletteEnumDefinition } {
	return entry.schema.type === 'enum'
}

function isNumberEntry(
	entry: PaletteEntryDefinition
): entry is PaletteEntryDefinition & { schema: PaletteNumberDefinition } {
	return entry.schema.type === 'number'
}

function isActionEntry(
	entry: PaletteEntryDefinition
): entry is PaletteEntryDefinition & { schema: PaletteActionDefinition } {
	return entry.schema.type === 'action'
}

function isStatusEntry(
	entry: PaletteEntryDefinition
): entry is PaletteEntryDefinition & { schema: PaletteStatusDefinition } {
	return entry.schema.type === 'status'
}

export function createPaletteIntentSource(options?: {
	intents?: readonly PaletteIntent[]
	derive?: (entry: PaletteEntryDefinition) => readonly PaletteIntent[]
}): PaletteIntentSource {
	const intents = new Map<PaletteIntentId, PaletteIntent>()

	if (options?.intents) {
		for (const intent of options.intents) {
			intents.set(intent.id, intent)
		}
	}

	const defaultDerive = (entry: PaletteEntryDefinition): readonly PaletteIntent[] => {
		if (isBooleanEntry(entry)) return deriveBooleanIntents(entry)
		if (isEnumEntry(entry)) return deriveEnumIntents(entry)
		if (isNumberEntry(entry)) return deriveNumberIntents(entry)
		if (isActionEntry(entry)) return deriveActionIntents(entry)
		if (isStatusEntry(entry)) return []
		return []
	}

	const derive = options?.derive ?? defaultDerive

	return {
		get intents(): readonly PaletteIntent[] {
			return Array.from(intents.values())
		},

		get(id: PaletteIntentId): PaletteIntent | undefined {
			return intents.get(id)
		},

		register(...next: readonly PaletteIntent[]): void {
			for (const intent of next) {
				intents.set(intent.id, intent)
			}
		},

		derive(entry: PaletteEntryDefinition): readonly PaletteIntent[] {
			return derive(entry)
		},
	}
}
