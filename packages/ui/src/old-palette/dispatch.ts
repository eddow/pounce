import type {
	PaletteEntry,
	PaletteFlipIntent,
	PaletteIntent,
	PaletteModelLike,
	PaletteRunIntent,
	PaletteSetIntent,
	PaletteStashFallback,
	PaletteStashIntent,
	PaletteStepIntent,
} from './types'

function readEntryValue(palette: PaletteModelLike, entry: PaletteEntry): unknown {
	switch (entry.schema.type) {
		case 'status':
		case 'boolean':
		case 'number':
		case 'enum':
			return entry.schema.get(palette)
		case 'action':
			return undefined
	}
}

function writeEntryValue(palette: PaletteModelLike, entry: PaletteEntry, value: unknown): unknown {
	switch (entry.schema.type) {
		case 'boolean':
			return entry.schema.set(palette, Boolean(value))
		case 'number':
			return entry.schema.set(palette, Number(value))
		case 'enum':
			return entry.schema.set(palette, value as string)
		case 'action':
		case 'status':
			throw new Error(`Cannot set value for ${entry.schema.type} entry: ${entry.id}`)
	}
}

function applyFallback(
	palette: PaletteModelLike,
	entry: PaletteEntry,
	fallback: PaletteStashFallback | undefined
): void {
	if (!fallback) return
	switch (fallback.kind) {
		case 'set':
			writeEntryValue(palette, entry, fallback.value)
			return
		case 'step': {
			const current = Number(readEntryValue(palette, entry)) || 0
			const newValue = current + fallback.step

			if (entry.schema.type === 'number') {
				const min = entry.schema.min
				const max = entry.schema.max
				if (min !== undefined && newValue < min) writeEntryValue(palette, entry, min)
				else if (max !== undefined && newValue > max) writeEntryValue(palette, entry, max)
				else writeEntryValue(palette, entry, newValue)
			} else {
				writeEntryValue(palette, entry, newValue)
			}
			return
		}
		case 'noop':
			return
	}
}

export function executePaletteIntent(palette: PaletteModelLike, intent: PaletteIntent): unknown {
	const entry = palette.resolveEntry(intent.targetId)
	if (!entry) {
		throw new Error(`Entry not found for intent: ${intent.id}`)
	}

	switch (intent.mode) {
		case 'run': {
			const runIntent: PaletteRunIntent = intent
			if (entry.schema.type !== 'action') {
				throw new Error(`Cannot run non-action entry: ${entry.id}`)
			}
			return entry.schema.run(palette, runIntent)
		}
		case 'set': {
			const setIntent: PaletteSetIntent = intent
			writeEntryValue(palette, entry, setIntent.value)
			return readEntryValue(palette, entry)
		}
		case 'toggle': {
			const current = readEntryValue(palette, entry)
			writeEntryValue(palette, entry, !current)
			return readEntryValue(palette, entry)
		}
		case 'step': {
			const stepIntent: PaletteStepIntent = intent
			const current = Number(readEntryValue(palette, entry)) || 0
			const step =
				stepIntent.step ?? (entry.schema.type === 'number' ? (entry.schema.step ?? 1) : 1)
			const newValue = current + step
			if (entry.schema.type === 'number') {
				const min = entry.schema.min
				const max = entry.schema.max
				if (min !== undefined && newValue < min) writeEntryValue(palette, entry, min)
				else if (max !== undefined && newValue > max) writeEntryValue(palette, entry, max)
				else writeEntryValue(palette, entry, newValue)
			} else {
				writeEntryValue(palette, entry, newValue)
			}
			return readEntryValue(palette, entry)
		}
		case 'flip': {
			const flipIntent: PaletteFlipIntent = intent
			const values = flipIntent.values
			const current = readEntryValue(palette, entry)
			writeEntryValue(
				palette,
				entry,
				current === values[0] ? values[1] : current === values[1] ? values[0] : values[1]
			)
			return readEntryValue(palette, entry)
		}
		case 'stash': {
			const stashIntent: PaletteStashIntent = intent
			const stashValue = stashIntent.value
			const current = readEntryValue(palette, entry)
			const stashKey = intent.id
			const stashedValue = palette.runtime[stashKey]

			if (current === stashValue) {
				delete palette.runtime[stashKey]
				if (stashedValue !== undefined) {
					writeEntryValue(palette, entry, stashedValue)
				} else {
					applyFallback(palette, entry, stashIntent.fallback)
				}
			} else {
				if (stashedValue !== undefined) {
					delete palette.runtime[stashKey]
				}
				palette.runtime[stashKey] = current
				writeEntryValue(palette, entry, stashValue)
			}
			return readEntryValue(palette, entry)
		}
	}
}
