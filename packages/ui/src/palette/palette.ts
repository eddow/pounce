import { effect, reactive, unwrap } from 'mutts'
import type {
	Palette,
	PaletteDragging,
	PaletteEditableTool,
	PaletteEditableToolByFamily,
	PaletteEditorSpec,
	PaletteScope,
	PaletteTool,
	PaletteToolbarItem,
	PaletteToolEdit,
	PaletteToolFamily,
	PaletteToolNumber,
	PaletteToolRun,
	PaletteTools,
	PaletteToolToolbarItem,
} from './types'

export type PaletteValueAction<TTool extends PaletteEditableTool = PaletteEditableTool> = (
	tool: TTool,
	arg?: string
) => PaletteToolRun

export type PaletteValueActions = {
	[K in PaletteEditableTool['type']]: Record<
		string,
		PaletteValueAction<PaletteEditableToolByFamily<K>>
	>
}

export const valueActions: PaletteValueActions = {
	// No need for valueActions for bool now - checkbutton is better than a "toggle" button
	number: {
		inc(type: PaletteToolNumber) {
			return {
				get can() {
					return type.max === undefined || type.value < type.max
				},
				run() {
					type.value += type.step ?? 1
				},
			}
		},
		dec(type: PaletteToolNumber) {
			return {
				get can() {
					return type.min === undefined || type.value > type.min
				},
				run() {
					type.value -= type.step ?? 1
				},
			}
		},
	},
	enum: {},
	boolean: {},
}

export const valueReader: {
	[K in PaletteEditableTool['type']]: (s: string) => PaletteEditableToolByFamily<K>['value']
} = {
	number: Number,
	enum: (i) => i,
	boolean: (s) => ['1', 'true'].includes(s.toLowerCase()),
}

export class PaletteError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'PaletteError'
	}
}

const returnValues = new WeakMap<PaletteToolEdit<unknown>, unknown>()
function setter(edit: PaletteToolEdit<unknown>, value: unknown): PaletteToolRun {
	return {
		can: true,
		run() {
			if (edit.value === value) {
				edit.value = returnValues.has(edit) ? returnValues.get(edit) : edit.default
			} else {
				returnValues.set(edit, edit.value)
				edit.value = value
				const stopRestore = effect`palette.setter.restore`(() => {
					void edit.value
					return () => {
						stopRestore()
						if (returnValues.get(edit) === value) returnValues.delete(edit)
					}
				})
			}
		},
	}
}

export function isRunTool(tool: PaletteTool): tool is PaletteToolRun {
	return 'run' in tool
}

export function isEditableTool(tool: PaletteTool): tool is PaletteEditableTool {
	return 'type' in tool
}

export function paletteToolFamily(tool: PaletteTool): PaletteToolFamily {
	return isRunTool(tool) ? 'run' : tool.type
}

export function hasPaletteItemTool(item: PaletteToolbarItem): item is PaletteToolToolbarItem {
	return typeof item.tool === 'string'
}

export function resolvePaletteEditor<
	TTool extends PaletteTool | undefined,
	TItem extends PaletteToolbarItem,
>(palette: Palette, item: TItem, tool: TTool): PaletteEditorSpec<TTool, TItem> | undefined {
	if (!hasPaletteItemTool(item)) {
		const spec = palette.editors?.item?.[item.editor] as PaletteEditorSpec<TTool, TItem> | undefined
		if (!spec) throw new PaletteError(`Unknown palette item editor "${item.editor}"`)
		return spec
	}
	if (!tool) throw new PaletteError(`No palette tool provided for palette item "${item.tool}"`)
	const family = paletteToolFamily(tool)
	const registry = palette.editors?.[family]
	if (!registry) return undefined
	const variant = item.editor ?? palette.editorDefaults?.[family]
	if (!variant)
		throw new PaletteError(`No editor variant configured for palette tool "${item.tool}"`)
	const spec = registry[variant] as PaletteEditorSpec<TTool, TItem> | undefined
	if (!spec)
		throw new PaletteError(`Unknown palette editor "${variant}" for ${family} tool "${item.tool}"`)
	return spec
}

export function renderPaletteEditor<
	TTool extends PaletteTool | undefined,
	TItem extends PaletteToolbarItem,
>(palette: Palette, item: TItem, tool: TTool, scope: PaletteScope): JSX.Element {
	const spec = resolvePaletteEditor(palette, item, tool)
	if (spec) return spec.editor({ item, tool, scope, flags: spec.flags ?? {} })
	if (palette.editor) return palette.editor(item, tool, scope)
	if (!hasPaletteItemTool(item))
		throw new PaletteError(`No editor available for palette item "${item.editor}"`)
	throw new PaletteError(`No editor available for palette tool "${item.tool}"`)
}

function resolveTool(tools: PaletteTools, toolId: string): PaletteTool {
	const tool = tools[toolId]
	if (!tool) throw new PaletteError(`Unknown palette tool "${toolId}"`)
	return tool
}

function resolveEditableTool<TFamily extends PaletteEditableTool['type']>(
	tools: PaletteTools,
	toolId: string,
	family?: TFamily
): PaletteEditableToolByFamily<TFamily> | PaletteEditableTool {
	const tool = resolveTool(tools, toolId)
	if (!isEditableTool(tool))
		throw new PaletteError(`Palette tool "${toolId}" does not support editing`)
	if (family && tool.type !== family)
		throw new PaletteError(`Palette tool "${toolId}" is "${tool.type}", expected "${family}"`)
	return tool as PaletteEditableToolByFamily<TFamily> | PaletteEditableTool
}

function paletteSetterRunner<TFamily extends PaletteEditableTool['type']>(
	palette: Palette,
	tool: PaletteEditableToolByFamily<TFamily>,
	serialized: string
): PaletteToolRun {
	const value = valueReader[tool.type](serialized)
	const runner = setter(tool, value)
	return palette.setter ? palette.setter(runner, tool, value) : runner
}

function paletteActionRunner<TFamily extends PaletteEditableTool['type']>(
	palette: Palette,
	tool: PaletteEditableToolByFamily<TFamily>,
	action: string,
	arg?: string,
	spec?: string
): PaletteToolRun {
	const valueAction = valueActions[tool.type][action]
	if (!valueAction)
		throw new PaletteError(`Unknown palette action "${action}" for tool "${tool.type}"`)
	const runner = valueAction(tool, arg)
	return palette.runner ? palette.runner(runner, tool, spec ?? action) : runner
}

export function paletteTool(palette: Palette, runnerDesc: string): PaletteTool {
	const pipeIndex = runnerDesc.indexOf('|')
	if (pipeIndex >= 0) {
		const toolId = runnerDesc.slice(0, pipeIndex)
		const tool = resolveEditableTool(palette.tools, toolId)
		return paletteSetterRunner(palette, tool, runnerDesc.slice(pipeIndex + 1))
	}

	const colonIndex = runnerDesc.indexOf(':')
	if (colonIndex >= 0) {
		const toolId = runnerDesc.slice(0, colonIndex)
		const actionDesc = runnerDesc.slice(colonIndex + 1)
		const argIndex = actionDesc.indexOf('=')
		const action = argIndex >= 0 ? actionDesc.slice(0, argIndex) : actionDesc
		const arg = argIndex >= 0 ? actionDesc.slice(argIndex + 1) : undefined
		const tool = resolveEditableTool(palette.tools, toolId)
		return paletteActionRunner(palette, tool, action, arg, actionDesc)
	}

	return resolveTool(palette.tools, runnerDesc)
}

export const palettes = reactive<{
	dragging?: PaletteDragging
	editing?: Palette
}>({})

export function isEditing(palette: Palette | undefined): boolean {
	return unwrap(palettes.editing) === unwrap(palette)
}
