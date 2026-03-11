import type { PaletteEntryDefinition, PaletteEntryId, PaletteRegistry } from './types'

// ============================================================================
// Palette Registry Implementation
// ============================================================================

export function createPaletteRegistry(
	definitions?: readonly PaletteEntryDefinition[]
): PaletteRegistry {
	const entries = new Map<PaletteEntryId, PaletteEntryDefinition>()

	// Initialize with provided definitions
	if (definitions) {
		for (const definition of definitions) {
			entries.set(definition.id, definition)
		}
	}

	const registry: PaletteRegistry = {
		get entries(): readonly PaletteEntryDefinition[] {
			return Array.from(entries.values())
		},

		get(id: PaletteEntryId): PaletteEntryDefinition | undefined {
			return entries.get(id)
		},

		register(...definitions: readonly PaletteEntryDefinition[]): void {
			for (const definition of definitions) {
				entries.set(definition.id, definition)
			}
		},
	}

	return registry
}
