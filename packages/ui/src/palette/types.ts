import type { PounceElement } from '@pounce/core'

// ============================================================================
// Forward declarations - to avoid circular dependencies
// ============================================================================

export interface PaletteModelLike {
	readonly state: PaletteState // TODO: get rid of `state`, bool/num/... should have their pair set/get as "run" has its callback
	readonly runtime: PaletteRuntimeState
	readonly display: PaletteDisplayConfiguration
	resolveEntry(entryId: PaletteEntryId): PaletteEntryDefinition | undefined
}

// ============================================================================
// ID Types - Unique identifiers for different palette entities
// ============================================================================

export type PaletteEntryId = string
export type PaletteIntentId = string
export type PaletteCategory = string

// ============================================================================
// Entry Schema Types - What exists in the registry
// ============================================================================

export type PaletteActionDefinition = {
	readonly type: 'action'
	readonly run: (palette: PaletteModelLike, intent: PaletteRunIntent) => unknown
}

export type PaletteStatusDefinition = {
	readonly type: 'status'
	readonly read?: (palette: PaletteModelLike) => unknown
}

export type PaletteBooleanDefinition = {
	readonly type: 'boolean'
}

export type PaletteNumberDefinition = {
	readonly type: 'number'
	readonly min?: number
	readonly max?: number
	readonly step?: number
}

export type PaletteEnumOption<T extends string = string> = {
	readonly value: T
	readonly label?: string
	readonly description?: string
	readonly icon?: string | PounceElement
	readonly categories?: readonly PaletteCategory[]
}

export type PaletteEnumDefinition<T extends string = string> = {
	readonly type: 'enum'
	readonly options: readonly (T | PaletteEnumOption<T>)[]
}

export type PaletteEntrySchema =
	| PaletteActionDefinition
	| PaletteStatusDefinition
	| PaletteBooleanDefinition
	| PaletteNumberDefinition
	| PaletteEnumDefinition

export type PaletteEntryDefinition = {
	readonly id: PaletteEntryId
	readonly label: string
	readonly description?: string
	readonly icon?: string | PounceElement
	readonly categories?: readonly PaletteCategory[]
	readonly schema: PaletteEntrySchema
}

// ============================================================================
// Intent Types - User action definitions
// ============================================================================

export type PaletteIntentBase = {
	readonly id: PaletteIntentId
	readonly targetId: PaletteEntryId
	readonly label?: string
	readonly description?: string
	readonly icon?: string | PounceElement
	readonly categories?: readonly PaletteCategory[]
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
	readonly title?: string
	readonly items: readonly PaletteDisplayItem[]
}

// TODO: PaletteToolbarTrack = `{ space, toolbar }[]` instead of `{ space[], toolbar[] }`
export type PaletteToolbarSlot = {
	readonly toolbar: PaletteToolbar
	readonly space: number
}

export type PaletteToolbarTrack = {
	readonly slots: readonly PaletteToolbarSlot[]
}

export type PaletteContainerToolbarStack = {
	readonly top: readonly PaletteToolbarTrack[]
	readonly right: readonly PaletteToolbarTrack[]
	readonly bottom: readonly PaletteToolbarTrack[]
	readonly left: readonly PaletteToolbarTrack[]
}

export type PaletteContainerConfiguration = {
	readonly toolbarStack: PaletteContainerToolbarStack
	readonly editMode: boolean
	readonly parkedToolbars?: readonly PaletteToolbar[]
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

export type PaletteDisplayItemKind = 'intent' | 'editor' | 'item-group'

export type PaletteDisplayItemBase = {
	readonly kind: PaletteDisplayItemKind
	readonly presenter?: PaletteDisplayPresenter
	readonly visible?: boolean
	readonly disabled?: boolean
	readonly checked?: boolean
	readonly showText?: boolean
	readonly editor?: string
	readonly position?: string
}

export type PaletteIntentDisplayItem = PaletteDisplayItemBase & {
	readonly kind: 'intent'
	readonly intentId: PaletteIntentId
}

export type PaletteEditorDisplayItem = PaletteDisplayItemBase & {
	readonly kind: 'editor'
	readonly entryId: PaletteEntryId
}

// ============================================================================
// Item Group Types - Grouped presentation for semantic content expansion
// ============================================================================

export type PaletteItemGroupKind = 'enum-options'

export type PaletteEnumOptionsGroup = {
	readonly kind: 'enum-options'
	readonly entryId: PaletteEntryId
	readonly options: readonly string[]
	readonly presenter?: 'radio-group' | 'segmented'
}

export type PaletteItemGroupDefinition = PaletteEnumOptionsGroup

export type PaletteItemGroupDisplayItem = PaletteDisplayItemBase & {
	readonly kind: 'item-group'
	readonly group: PaletteItemGroupDefinition
}

export type PaletteDisplayItem =
	| PaletteIntentDisplayItem
	| PaletteEditorDisplayItem
	| PaletteItemGroupDisplayItem

// ============================================================================
// Resolved Types - Runtime combinations of definitions and intents
// ============================================================================

export type PaletteResolvedIntent = {
	readonly kind: 'intent'
	readonly intent: PaletteIntent
	readonly entry: PaletteEntryDefinition
}

export type PaletteResolvedEntry = {
	readonly kind: 'entry'
	readonly entry: PaletteEntryDefinition
}

export type PaletteResolvedDisplayItem =
	| (PaletteIntentDisplayItem & {
			readonly intent: PaletteIntent
			readonly entry: PaletteEntryDefinition
	  })
	| (PaletteEditorDisplayItem & {
			readonly entry: PaletteEntryDefinition
	  })
	| (PaletteItemGroupDisplayItem & {
			readonly entry: PaletteEntryDefinition
			readonly resolvedItems: readonly PaletteResolvedIntent[]
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
// State and Runtime Types - Reactive data structures
// ============================================================================

export type PaletteState = Record<PaletteEntryId, unknown>
export type PaletteRuntimeState = Record<string, unknown>

// ============================================================================
// Search Types - Querying and filtering
// ============================================================================

export type PaletteQuery = {
	readonly text?: string
	readonly categories?: readonly PaletteCategory[]
}

export type PaletteSearch = (query: PaletteQuery) => readonly PaletteMatch[]

// ============================================================================
// Registry and Intent Source Interfaces
// ============================================================================

export interface PaletteRegistry {
	readonly entries: readonly PaletteEntryDefinition[]
	get(id: PaletteEntryId): PaletteEntryDefinition | undefined
	register(...definitions: readonly PaletteEntryDefinition[]): void
}

export interface PaletteIntentSource {
	readonly intents: readonly PaletteIntent[]
	get(id: PaletteIntentId): PaletteIntent | undefined
	register(...intents: readonly PaletteIntent[]): void
	derive(entry: PaletteEntryDefinition): readonly PaletteIntent[]
}
