type PaletteToolBase = {
	readonly categories?: string[]
	readonly icon?: string
	readonly keywords?: string[]
	readonly label?: string
}

export type PaletteToolRun = PaletteToolBase & { run(): void; readonly can: boolean }
export type PaletteToolStatus<T> = PaletteToolBase & { readonly value: T; type: string }
export type PaletteToolEdit<T> = PaletteToolStatus<T> & { value: T; readonly default: T }

export type PaletteToolBool = PaletteToolEdit<boolean> & { type: 'boolean' }
export type PaletteToolNumber = PaletteToolEdit<number> & {
	type: 'number'
	min?: number
	max?: number
	step?: number
}
export type PaletteToolEnumValue<T extends string = string> = {
	readonly value: T
	readonly can?: boolean
	readonly categories?: string[]
	readonly icon?: string
	readonly label?: string
	readonly keywords?: string[]
}

export type PaletteToolEnum<T extends string = string> = PaletteToolEdit<T> & {
	type: 'enum'
	readonly values: readonly PaletteToolEnumValue<T>[]
}

export type PaletteTool = PaletteToolRun | PaletteToolBool | PaletteToolNumber | PaletteToolEnum
export type PaletteEditableTool = Exclude<PaletteTool, PaletteToolRun>
export type PaletteToolFamily = PaletteEditableTool['type'] | 'run'
export type PaletteToolByFamily<TFamily extends PaletteToolFamily> = TFamily extends 'run'
	? PaletteToolRun
	: Extract<PaletteEditableTool, { type: TFamily }>
export type PaletteEditableToolByFamily<TFamily extends PaletteEditableTool['type']> = Extract<
	PaletteEditableTool,
	{ type: TFamily }
>

export type PaletteTools = Record<string, PaletteTool>

export type PaletteKeystroke = string

export type PaletteKeyBindings = Record<PaletteKeystroke, string>

export interface PaletteKeys {
	readonly bindings: PaletteKeyBindings
	findByTool(toolId: string): readonly PaletteKeystroke[]
	resolve(event: KeyboardEvent): string | undefined
}

export type PaletteToolbarItem<TEditor extends string = string, TConfig = unknown> = Record<
	PropertyKey,
	unknown
> & {
	readonly tool: string
	readonly editor?: TEditor
	readonly config?: TConfig
}

export type PaletteToolbarItemByEditor<TEditors extends Record<string, unknown>> = {
	[K in keyof TEditors & string]: PaletteToolbarItem<K, TEditors[K]>
}[keyof TEditors & string]

export type PaletteToolbar = {
	readonly title?: string
	readonly items: readonly PaletteToolbarItem[]
}

export type PaletteTrack = { space: number; toolbar: PaletteToolbar }[]

export type PaletteBorder = readonly PaletteTrack[]

export type PaletteRegion = 'top' | 'right' | 'bottom' | 'left'

export type PaletteBorders = { [K in PaletteRegion]: PaletteBorder }

export type PaletteScope = Record<string, unknown> & {
	palette?: Palette
	region?: PaletteRegion
}

export type PaletteEditorFootprint = 'square' | 'free' | 'horizontal' | 'vertical'

export interface PaletteEditorFlags {
	readonly footprint?: PaletteEditorFootprint
}

export interface PaletteEditorContext<
	TTool extends PaletteTool = PaletteTool,
	TItem extends PaletteToolbarItem = PaletteToolbarItem,
> {
	readonly item: TItem
	readonly tool: TTool
	readonly scope: PaletteScope
	readonly flags: PaletteEditorFlags
}

export type PaletteEditorComponent<
	TTool extends PaletteTool = PaletteTool,
	TItem extends PaletteToolbarItem = PaletteToolbarItem,
> = (context: PaletteEditorContext<TTool, TItem>) => JSX.Element

export interface PaletteEditorSpec<
	TTool extends PaletteTool = PaletteTool,
	TItem extends PaletteToolbarItem = PaletteToolbarItem,
> {
	readonly editor: PaletteEditorComponent<TTool, TItem>
	readonly flags?: PaletteEditorFlags
}

export type PaletteEditorFamilyRegistry<TFamily extends PaletteToolFamily = PaletteToolFamily> =
	Record<string, PaletteEditorSpec<PaletteToolByFamily<TFamily>>>

export type PaletteEditorRegistry = {
	[K in PaletteToolFamily]?: PaletteEditorFamilyRegistry<K>
}

export interface Palette {
	readonly tools: PaletteTools
	readonly keys: PaletteKeys
	readonly editors?: PaletteEditorRegistry
	readonly editorDefaults?: Partial<Record<PaletteToolFamily, string>>
	readonly editor?: (
		item: PaletteToolbarItem,
		tool: PaletteTool,
		scope: PaletteScope
	) => JSX.Element
	readonly runner?: <TTool extends PaletteEditableTool>(
		runner: PaletteToolRun,
		from: TTool,
		spec: string
	) => PaletteToolRun
	readonly setter?: <TTool extends PaletteEditableTool>(
		runner: PaletteToolRun,
		from: TTool,
		value: TTool['value']
	) => PaletteToolRun
}
