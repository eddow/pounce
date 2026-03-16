import type { PaletteEntry, PaletteRegistry } from './types'

// ============================================================================
// Palette Registry Implementation
// ============================================================================

export function createPaletteRegistry(definitions?: PaletteRegistry): PaletteRegistry {
	return { ...(definitions ?? {}) }
}

export function resolvePaletteEntry(
	registry: PaletteRegistry,
	entryId: string
): PaletteEntry | undefined {
	const definition = registry[entryId]
	if (!definition) return undefined
	return { id: entryId, ...definition }
}

export function paletteRegistryEntries(registry: PaletteRegistry): readonly PaletteEntry[] {
	return Object.entries(registry).map(([id, definition]) => ({ id, ...definition }))
}
