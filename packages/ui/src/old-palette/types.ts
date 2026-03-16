import type { SursautElement } from '@sursaut/core'

// ============================================================================
// Forward declarations - to avoid circular dependencies
// ============================================================================

export interface PaletteModelLike {
	readonly runtime: PaletteRuntimeState
	readonly display: PaletteDisplayConfiguration
	resolveEntry(entryId: string): PaletteEntry | undefined
}

// ============================================================================
// Entry Schema Types - What exists in the registry
// ============================================================================

export type PaletteActionDefinition = {
	readonly type: 'action'
	readonly run: (palette: PaletteModelLike, intent: PaletteRunIntent) => unknown
}

export type PaletteStatusDefinition = {
	readonly type: 'status'
	readonly get: (palette: PaletteModelLike) => unknown
}

export type PaletteBooleanDefinition = {
	readonly type: 'boolean'
	readonly get: (palette: PaletteModelLike) => boolean
	readonly set: (palette: PaletteModelLike, value: boolean) => unknown
}

export type PaletteNumberDefinition = {
	readonly type: 'number'
	readonly get: (palette: PaletteModelLike) => number
	readonly set: (palette: PaletteModelLike, value: number) => unknown
	readonly min?: number
	readonly max?: number
	readonly step?: number
}

export type PaletteEnumOption<T extends string = string> = {
	readonly id: T
	readonly label?: string
	readonly description?: string
	readonly icon?: string | SursautElement
	readonly categories?: readonly string[]
	readonly keywords?: readonly string[]
}

export type PaletteEnumDefinition<T extends string = string> = {
	readonly type: 'enum'
	readonly get: (palette: PaletteModelLike) => T
	readonly set: (palette: PaletteModelLike, value: T) => unknown
	readonly options: readonly (T | PaletteEnumOption<T>)[]
}

export type PaletteEntrySchema =
	| PaletteActionDefinition
	| PaletteStatusDefinition
	| PaletteBooleanDefinition
	| PaletteNumberDefinition
	| PaletteEnumDefinition

export type PaletteEntryDefinition = {
	readonly label: string
	readonly description?: string
	readonly icon?: string | SursautElement
	readonly categories?: readonly string[]
	readonly schema: PaletteEntrySchema
}

export type PaletteEntry = PaletteEntryDefinition & {
	readonly id: string
}

// ============================================================================
// Intent Types - User action definitions
// ============================================================================

export type PaletteIntentBase = {
	readonly id: string
	readonly targetId: string
	readonly label?: string
	readonly description?: string
	readonly icon?: string | SursautElement
	readonly categories?: readonly string[]
	readonly showText?: boolean
}

export type PaletteRunIntent = PaletteIntentBase & {
	readonly mode: 'run'
}

export type PaletteSetIntent = PaletteIntentBase & {
	readonly mode: 'set'
	readonly value: unknown
}

export type PaletteToggleIntent = PaletteIntentBase & {
	readonly mode: 'toggle'
}

export type PaletteStepIntent = PaletteIntentBase & {
	readonly mode: 'step'
	readonly step?: number
}

export type PaletteFlipIntent = PaletteIntentBase & {
	readonly mode: 'flip'
	readonly values: readonly [unknown, unknown]
}

export type PaletteStashFallback =
	| {
			readonly kind: 'set'
			readonly value: unknown
	  }
	| {
			readonly kind: 'step'
			readonly step: number
	  }
	| {
			readonly kind: 'noop'
	  }

export type PaletteStashIntent = PaletteIntentBase & {
	readonly mode: 'stash'
	readonly value: unknown
	readonly fallback?: PaletteStashFallback
}

export type PaletteIntent =
	| PaletteRunIntent
	| PaletteSetIntent
	| PaletteToggleIntent
	| PaletteStepIntent
	| PaletteFlipIntent
	| PaletteStashIntent

// ============================================================================
// Container Configuration Types - Host container layout and edit mode
// ============================================================================

export type PaletteContainerRegion = 'top' | 'right' | 'bottom' | 'left'

export type PaletteToolbar = {
	title?: string
	items: PaletteDisplayItem[]
}

export type PaletteToolbarSlot = {
	readonly toolbar: PaletteToolbar
	space: number
}

export type PaletteToolbarTrack = PaletteToolbarSlot[]

export type PaletteContainerToolbarStack = {
	top: PaletteToolbarTrack[]
	right: PaletteToolbarTrack[]
	bottom: PaletteToolbarTrack[]
	left: PaletteToolbarTrack[]
}

export type PaletteContainerConfiguration = {
	toolbarStack: PaletteContainerToolbarStack
	editMode: boolean
	parkedToolbars?: PaletteToolbar[]
}

export type PaletteContainerDropTarget = {
	readonly region: PaletteContainerRegion
	readonly position?: number
}

export type PaletteInsertionPoint = {
	readonly region: PaletteContainerRegion
	readonly track: number
	readonly index: number
	readonly before?: PaletteToolbar
	readonly after?: PaletteToolbar
}

// ============================================================================
// Display Configuration Types - How intents are presented
// ============================================================================

export type PaletteDisplayConfiguration = {
	readonly container?: PaletteContainerConfiguration
}

export type PaletteDisplayPresenter = string

export type PaletteDisplayPresenterFamily = 'action' | 'boolean' | 'enum' | 'number' | 'status'

export type PaletteKeywordSource = {
	readonly id: string
	readonly keywords?: readonly string[]
}

export type PaletteKeywordQuery = {
	readonly keywords: readonly string[]
	readonly free?: string
}

export type PaletteEnumSelector = string | readonly string[]

export type PaletteDisplayItemKind = 'intent' | 'editor'

export type PaletteDisplayItemBase = {
	readonly kind: PaletteDisplayItemKind
	presenter?: PaletteDisplayPresenter
	readonly visible?: boolean
	readonly disabled?: boolean
	readonly checked?: boolean
	readonly showText?: boolean
	readonly editor?: string
	readonly position?: string
}

export type PaletteIntentDisplayItem = PaletteDisplayItemBase & {
	readonly kind: 'intent'
	readonly intentId: string
}

export type PaletteEditorDisplayItem = PaletteDisplayItemBase & {
	readonly kind: 'editor'
	readonly entryId: string
	readonly selector?: PaletteEnumSelector
}

export type PaletteDisplayItem = PaletteIntentDisplayItem | PaletteEditorDisplayItem

// ============================================================================
// Resolved Types - Runtime combinations of definitions and intents
// ============================================================================

export type PaletteResolvedIntent = {
	readonly kind: 'intent'
	readonly intent: PaletteIntent
	readonly entry: PaletteEntry
}

export type PaletteResolvedEntry = {
	readonly kind: 'entry'
	readonly entry: PaletteEntry
}

export type PaletteResolvedDisplayItem =
	| (PaletteIntentDisplayItem & {
			readonly intent: PaletteIntent
			readonly entry: PaletteEntry
			readonly resolvedIntents?: readonly PaletteResolvedIntent[]
	  })
	| (PaletteEditorDisplayItem & {
			readonly entry: PaletteEntry
			readonly resolvedIntents?: readonly PaletteResolvedIntent[]
	  })

export type PaletteMatch = PaletteResolvedIntent | PaletteResolvedEntry | PaletteGroupedProposition

/**
 * A grouped proposition that combines multiple intents or enum values
 */
export interface PaletteGroupedProposition {
	readonly kind: 'grouped-proposition'
	readonly label: string
	readonly description?: string
	readonly intents: readonly PaletteResolvedIntent[]
	readonly entries: readonly PaletteResolvedEntry[]
	readonly type: 'enum-subset' | 'intent-group'
}

// ============================================================================
// Runtime Types - Reactive data structures
// ============================================================================

export type PaletteRuntimeState = Record<string, unknown>

// ============================================================================
// Search Types - Querying and filtering
// ============================================================================

export type PaletteQuery = {
	readonly keywords?: readonly string[]
	readonly free?: string
}

export type PaletteSearch = (query: PaletteQuery) => readonly PaletteMatch[]

// ============================================================================
// Registry and Intent Source Interfaces
// ============================================================================

export type PaletteRegistry = Record<string, PaletteEntryDefinition>

export interface PaletteIntentSource {
	readonly intents: readonly PaletteIntent[]
	get(id: string): PaletteIntent | undefined
	register(...intents: readonly PaletteIntent[]): void
	derive(entry: PaletteEntry): readonly PaletteIntent[]
}
