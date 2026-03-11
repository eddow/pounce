import type {
	PaletteEntryDefinition,
	PaletteFlipIntent,
	PaletteIntent,
	PaletteModelLike,
	PaletteRunIntent,
	PaletteSetIntent,
	PaletteStashFallback,
	PaletteStashIntent,
	PaletteStepIntent,
} from './types'

function applyFallback(
	palette: PaletteModelLike,
	entry: PaletteEntryDefinition,
	fallback: PaletteStashFallback | undefined
): void {
	if (!fallback) return
	switch (fallback.kind) {
		case 'set':
			palette.state[entry.id] = fallback.value
			return
		case 'step': {
			const current = Number(palette.state[entry.id]) || 0
			const newValue = current + fallback.step

			// Apply bounds if entry is a number schema
			if (entry.schema.type === 'number') {
				const min = entry.schema.min
				const max = entry.schema.max
				if (min !== undefined && newValue < min) palette.state[entry.id] = min
				else if (max !== undefined && newValue > max) palette.state[entry.id] = max
				else palette.state[entry.id] = newValue
			} else {
				palette.state[entry.id] = newValue
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
			palette.state[entry.id] = setIntent.value
			return palette.state[entry.id]
		}
		case 'toggle': {
			const current = palette.state[entry.id]
			palette.state[entry.id] = !current
			return palette.state[entry.id]
		}
		case 'step': {
			const stepIntent: PaletteStepIntent = intent
			const current = Number(palette.state[entry.id]) || 0
			const step =
				stepIntent.step ?? (entry.schema.type === 'number' ? (entry.schema.step ?? 1) : 1)
			const newValue = current + step
			if (entry.schema.type === 'number') {
				const min = entry.schema.min
				const max = entry.schema.max
				if (min !== undefined && newValue < min) palette.state[entry.id] = min
				else if (max !== undefined && newValue > max) palette.state[entry.id] = max
				else palette.state[entry.id] = newValue
			} else {
				palette.state[entry.id] = newValue
			}
			return palette.state[entry.id]
		}
		case 'flip': {
			const flipIntent: PaletteFlipIntent = intent
			const values = flipIntent.values
			const current = palette.state[entry.id]
			palette.state[entry.id] =
				current === values[0] ? values[1] : current === values[1] ? values[0] : values[1] // Default to second value if not in pair
			return palette.state[entry.id]
		}
		case 'stash': {
			const stashIntent: PaletteStashIntent = intent
			const stashValue = stashIntent.value
			const current = palette.state[entry.id]
			const stashKey = intent.id
			const stashedValue = palette.runtime[stashKey]

			if (current === stashValue) {
				// We're currently at the stash value, try to restore
				delete palette.runtime[stashKey]
				if (stashedValue !== undefined) {
					palette.state[entry.id] = stashedValue
				} else {
					applyFallback(palette, entry, stashIntent.fallback)
				}
			} else {
				// We're not at the stash value, check if existing stash is still valid
				if (stashedValue !== undefined) {
					// Stash exists but state changed independently - invalidate stale stash
					delete palette.runtime[stashKey]
				}
				// Store current value and apply stash
				palette.runtime[stashKey] = current
				palette.state[entry.id] = stashValue
			}
			return palette.state[entry.id]
		}
	}
}
