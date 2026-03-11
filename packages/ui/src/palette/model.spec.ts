import { describe, expect, it, vi } from 'vitest'
import { createPaletteModel } from './model'
import type { PaletteEntryDefinition } from './types'

const definitions: readonly PaletteEntryDefinition[] = [
	{
		id: 'ui.theme',
		label: 'Theme',
		description: 'Theme selection',
		categories: ['appearance'],
		schema: {
			type: 'enum',
			options: [
				{
					value: 'light',
					label: 'Light Mode',
					description: 'Use the light theme',
					categories: ['bright'],
				},
				{
					value: 'dark',
					label: 'Dark Mode',
					description: 'Use the dark theme',
					categories: ['dim'],
				},
				'system',
			],
		},
	},
	{
		id: 'ui.sidebar',
		label: 'Sidebar',
		description: 'Show sidebar',
		categories: ['layout'],
		schema: { type: 'boolean' },
	},
	{
		id: 'game.speed',
		label: 'Game Speed',
		description: 'Playback speed',
		categories: ['gameplay'],
		schema: { type: 'number', min: 0, max: 10, step: 2 },
	},
	{
		id: 'file.save',
		label: 'Save File',
		description: 'Persist current document',
		categories: ['file'],
		schema: { type: 'action', run: vi.fn(() => 'saved') },
	},
]

describe('createPaletteModel', () => {
	it('resolves entries by id', () => {
		const palette = createPaletteModel({ definitions })
		expect(palette.resolveEntry('ui.theme')?.label).toBe('Theme')
		expect(palette.resolveEntry('missing')).toBeUndefined()
	})

	it('resolves explicit intents', () => {
		const palette = createPaletteModel({
			definitions,
			intents: [
				{
					id: 'file.save:quick',
					targetId: 'file.save',
					mode: 'run',
					label: 'Quick Save',
				},
			],
		})

		const resolved = palette.resolveIntent('file.save:quick')
		expect(resolved?.entry.id).toBe('file.save')
		expect(resolved?.intent.label).toBe('Quick Save')
	})

	it('resolves lazily derived intents', () => {
		const palette = createPaletteModel({ definitions })

		const resolved = palette.resolveIntent('ui.theme:set:dark')
		expect(resolved?.entry.id).toBe('ui.theme')
		expect(resolved?.intent.mode).toBe('set')
		if (resolved?.intent.mode === 'set') {
			expect(resolved.intent.value).toBe('dark')
			expect(resolved.intent.description).toBe('Use the dark theme')
			expect(resolved.intent.categories).toEqual(['appearance', 'dim'])
		}
	})

	it('resolves display items through derived intents', () => {
		const palette = createPaletteModel({ definitions })
		const resolved = palette.resolveDisplayItem({
			kind: 'intent',
			intentId: 'ui.theme:set:light',
			presenter: 'radio',
		})

		expect(resolved?.entry.id).toBe('ui.theme')
		if (resolved && resolved.kind === 'intent') {
			expect(resolved.intent.id).toBe('ui.theme:set:light')
			expect(resolved.presenter).toBe('radio')
		}
	})

	it('derives intents for an entry', () => {
		const palette = createPaletteModel({ definitions })
		expect(palette.derive('ui.sidebar').map((intent) => intent.id)).toEqual([
			'ui.sidebar:set:true',
			'ui.sidebar:set:false',
			'ui.sidebar:toggle',
		])
	})

	it('searches explicit and derived intents with intent metadata', () => {
		const palette = createPaletteModel({
			definitions,
			intents: [
				{
					id: 'file.save:quick',
					targetId: 'file.save',
					mode: 'run',
					label: 'Quick Save',
					description: 'Fast save path',
					categories: ['shortcut'],
				},
			],
		})

		palette.search.search({ text: 'dark' })
		expect(
			palette.search.results.some(
				(result) => result.kind === 'intent' && result.intent.id === 'ui.theme:set:dark'
			)
		).toBe(true)

		palette.search.search({ text: 'fast save' })
		expect(
			palette.search.results.some(
				(result) => result.kind === 'intent' && result.intent.id === 'file.save:quick'
			)
		).toBe(true)

		palette.search.search({ categories: ['dim'] })
		expect(
			palette.search.results.some(
				(result) => result.kind === 'intent' && result.intent.id === 'ui.theme:set:dark'
			)
		).toBe(true)

		palette.search.search({})
		expect(palette.search.query.text).toBeUndefined()
		expect(palette.search.query.categories).toBeUndefined()
	})

	it('writes plain setting intents directly through palette.state', () => {
		const palette = createPaletteModel({
			definitions,
			state: { 'ui.sidebar': false, 'ui.theme': 'system', 'game.speed': 4 },
		})

		palette.run('ui.sidebar:toggle')
		expect(palette.state['ui.sidebar']).toBe(true)

		palette.run('ui.theme:set:dark')
		expect(palette.state['ui.theme']).toBe('dark')

		palette.run('game.speed:step:up')
		expect(palette.state['game.speed']).toBe(6)
	})

	it('runs explicit action intents against the action definition', () => {
		const run = vi.fn(() => 'saved')
		const actionDefinition: PaletteEntryDefinition = {
			id: 'file.save',
			label: 'Save File',
			description: 'Persist current document',
			categories: ['file'],
			schema: { type: 'action', run },
		}
		const palette = createPaletteModel({
			definitions: definitions.map((entry) =>
				entry.id === 'file.save' ? actionDefinition : entry
			),
			intents: [
				{
					id: 'file.save:quick',
					targetId: 'file.save',
					mode: 'run',
					label: 'Quick Save',
				},
			],
		})

		expect(palette.run('file.save:quick')).toBe('saved')
		expect(run).toHaveBeenCalledTimes(1)
	})
})
