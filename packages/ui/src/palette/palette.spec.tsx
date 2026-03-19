import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPaletteKeys } from './keys'
import {
	isEditableTool,
	isEditing,
	isRunTool,
	PaletteError,
	palettes,
	paletteTool,
	paletteToolFamily,
	renderPaletteEditor,
	resolvePaletteEditor,
} from './palette'
import type { Palette, PaletteToolbarItem } from './types'

function createPalette(): Palette {
	return {
		tools: {
			reset: {
				label: 'Reset',
				get can() {
					return true
				},
				run() {},
			},
			notifications: {
				type: 'boolean',
				label: 'Notifications',
				value: false,
				default: false,
			},
			fontSize: {
				type: 'number',
				label: 'Font Size',
				value: 10,
				default: 10,
				min: 10,
				max: 12,
				step: 1,
			},
			theme: {
				type: 'enum',
				label: 'Theme',
				value: 'dark',
				default: 'dark',
				values: [
					{ value: 'light', label: 'Light', keywords: ['day'] },
					{ value: 'dark', label: 'Dark', can: false },
				],
			},
		},
		keys: createPaletteKeys({
			R: 'reset',
			N: 'notifications|true',
			'+': 'fontSize:inc',
		}),
	}
}

function editableTools(palette: Palette) {
	const notifications = palette.tools.notifications
	if (!isEditableTool(notifications) || notifications.type !== 'boolean')
		throw new Error('Expected boolean notifications tool')
	const fontSize = palette.tools.fontSize
	if (!isEditableTool(fontSize) || fontSize.type !== 'number')
		throw new Error('Expected numeric fontSize tool')
	return { fontSize, notifications }
}

describe('palette engine', () => {
	afterEach(() => {
		palettes.editing = undefined
		palettes.dragging = undefined
	})

	it('identifies tool families correctly', () => {
		const palette = createPalette()

		expect(isRunTool(palette.tools.reset)).toBe(true)
		expect(isEditableTool(palette.tools.reset)).toBe(false)
		expect(isEditableTool(palette.tools.notifications)).toBe(true)
		expect(paletteToolFamily(palette.tools.reset)).toBe('run')
		expect(paletteToolFamily(palette.tools.fontSize)).toBe('number')
	})

	it('resolves raw tools, setters, and actions from paletteTool', () => {
		const palette = createPalette()
		const { fontSize, notifications } = editableTools(palette)

		expect(paletteTool(palette, 'reset')).toBe(palette.tools.reset)

		const setterRunner = paletteTool(palette, 'notifications|true')
		if (!isRunTool(setterRunner)) throw new Error('Expected setter runner')
		setterRunner.run()
		expect(notifications.value).toBe(true)
		setterRunner.run()
		expect(notifications.value).toBe(false)

		const actionRunner = paletteTool(palette, 'fontSize:inc')
		if (!isRunTool(actionRunner)) throw new Error('Expected action runner')
		expect(actionRunner.can).toBe(true)
		actionRunner.run()
		expect(fontSize.value).toBe(11)
	})

	it('restores the previous editable value when the same setter is run twice', () => {
		const palette = createPalette()
		const { notifications } = editableTools(palette)
		notifications.value = true

		const setterRunner = paletteTool(palette, 'notifications|false')
		if (!isRunTool(setterRunner)) throw new Error('Expected setter runner')

		setterRunner.run()
		expect(notifications.value).toBe(false)

		setterRunner.run()
		expect(notifications.value).toBe(true)
	})

	it('exposes numeric action can state at the bounds', () => {
		const palette = createPalette()
		const { fontSize } = editableTools(palette)

		const incRunner = paletteTool(palette, 'fontSize:inc')
		if (!isRunTool(incRunner)) throw new Error('Expected increment runner')
		expect(incRunner.can).toBe(true)

		fontSize.value = 12
		expect(incRunner.can).toBe(false)
	})

	it('applies runner and setter wrappers when provided', () => {
		const runnerHook = vi.fn<(spec: string) => void>()
		const setterHook = vi.fn<(value: unknown) => void>()
		const palette = {
			...createPalette(),
			runner(runner, _from, spec) {
				return {
					get can() {
						return runner.can
					},
					run() {
						runnerHook(spec)
						return runner.run()
					},
				}
			},
			setter(runner, _from, value) {
				return {
					get can() {
						return runner.can
					},
					run() {
						setterHook(value)
						return runner.run()
					},
				}
			},
		} satisfies Palette

		const setterRunner = paletteTool(palette, 'notifications|true')
		if (!isRunTool(setterRunner)) throw new Error('Expected setter runner')
		setterRunner.run()
		expect(setterHook).toHaveBeenCalledWith(true)

		const actionRunner = paletteTool(palette, 'fontSize:inc=fast')
		if (!isRunTool(actionRunner)) throw new Error('Expected action runner')
		actionRunner.run()
		expect(runnerHook).toHaveBeenCalledWith('inc=fast')
	})

	it('throws palette errors for unknown tools and unsupported actions', () => {
		const palette = createPalette()

		expect(() => paletteTool(palette, 'missing')).toThrow(PaletteError)
		expect(() => paletteTool(palette, 'reset|true')).toThrow(PaletteError)
		expect(() => paletteTool(palette, 'fontSize:missing')).toThrow(PaletteError)
		expect(() => paletteTool(palette, 'theme:missing')).toThrow(PaletteError)
	})

	it('throws palette errors for unsupported editing actions', () => {
		const palette = createPalette()

		expect(() => paletteTool(palette, 'notifications:inc')).toThrow(PaletteError)
		expect(() => paletteTool(palette, 'fontSize|true')).toThrow(PaletteError)
	})

	it('resolves editor specs from item or default variant', () => {
		const palette = {
			...createPalette(),
			editors: {
				run: {
					button: {
						editor: () => <div data-test="run-editor">run</div>,
					},
				},
			},
			editorDefaults: {
				run: 'button',
			},
		} satisfies Palette
		const item = { tool: 'reset' } satisfies PaletteToolbarItem

		const spec = resolvePaletteEditor(palette, item, palette.tools.reset)
		expect(spec?.editor({ item, tool: palette.tools.reset, scope: {}, flags: {} })).toBeTruthy()
		expect(renderPaletteEditor(palette, item, palette.tools.reset, {})).toBeTruthy()
	})

	it('throws clear editor errors when variant configuration is missing or invalid', () => {
		const palette = {
			...createPalette(),
			editors: {
				run: {
					button: {
						editor: () => <div>run</div>,
					},
				},
			},
		} satisfies Palette

		expect(() => resolvePaletteEditor(palette, { tool: 'reset' }, palette.tools.reset)).toThrow(
			'No editor variant configured'
		)
		expect(() =>
			resolvePaletteEditor(palette, { tool: 'reset', editor: 'missing' }, palette.tools.reset)
		).toThrow('Unknown palette editor')
	})

	it('falls back to palette.editor when no registry editor is configured', () => {
		const render = vi.fn(() => <div data-test="fallback-editor">fallback</div>)
		const palette = {
			...createPalette(),
			editor: render,
		} satisfies Palette

		const rendered = renderPaletteEditor(palette, { tool: 'reset' }, palette.tools.reset, {})
		expect(rendered).toBeTruthy()
		expect(render).toHaveBeenCalledTimes(1)
	})

	it('tracks the editing palette identity', () => {
		const first = createPalette()
		const second = createPalette()

		expect(isEditing(first)).toBe(false)
		palettes.editing = first
		expect(isEditing(first)).toBe(true)
		expect(isEditing(second)).toBe(false)
	})
})
