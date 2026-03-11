import { describe, expect, it } from 'vitest'
import { createPaletteIntentSource } from './intents'
import { createPaletteRegistry } from './registry'
import type { PaletteEntryDefinition } from './types'

describe('Palette Registry', () => {
	it('should create an empty registry', () => {
		const registry = createPaletteRegistry()
		expect(registry.entries).toEqual([])
		expect(registry.get('nonexistent')).toBeUndefined()
	})

	it('should initialize with definitions', () => {
		const definitions: readonly PaletteEntryDefinition[] = [
			{
				id: 'test.entry',
				label: 'Test Entry',
				schema: { type: 'boolean' },
			},
		]

		const registry = createPaletteRegistry(definitions)
		expect(registry.entries).toHaveLength(1)
		expect(registry.get('test.entry')?.label).toBe('Test Entry')
	})

	it('should register new definitions', () => {
		const registry = createPaletteRegistry()

		registry.register({
			id: 'new.entry',
			label: 'New Entry',
			schema: { type: 'action', run: () => {} },
		})

		expect(registry.entries).toHaveLength(1)
		expect(registry.get('new.entry')?.schema.type).toBe('action')
	})

	it('should maintain stable order', () => {
		const registry = createPaletteRegistry()

		registry.register(
			{ id: 'first', label: 'First', schema: { type: 'boolean' } },
			{ id: 'second', label: 'Second', schema: { type: 'enum', options: ['a', 'b'] } }
		)

		const order = registry.entries.map((e) => e.id)
		expect(order).toEqual(['first', 'second'])
	})

	it('should overwrite duplicate definitions without changing insertion order', () => {
		const registry = createPaletteRegistry([
			{ id: 'dup', label: 'First', schema: { type: 'boolean' } },
			{ id: 'other', label: 'Other', schema: { type: 'boolean' } },
		])

		registry.register({ id: 'dup', label: 'Updated', schema: { type: 'boolean' } })

		expect(registry.entries.map((entry) => entry.id)).toEqual(['dup', 'other'])
		expect(registry.get('dup')?.label).toBe('Updated')
	})
})

describe('Palette Intent Source', () => {
	it('should create an empty intent source', () => {
		const source = createPaletteIntentSource()
		expect(source.intents).toEqual([])
		expect(source.get('nonexistent')).toBeUndefined()
	})

	it('should initialize with intents', () => {
		const intents = [
			{ id: 'test:set:true', targetId: 'test', mode: 'set' as const, value: true },
		] as const

		const source = createPaletteIntentSource({ intents })
		expect(source.intents).toHaveLength(1)
		expect(source.get('test:set:true')?.mode).toBe('set')
	})

	it('should register new intents', () => {
		const source = createPaletteIntentSource()

		source.register({
			id: 'test:toggle',
			targetId: 'test',
			mode: 'toggle' as const,
		})

		expect(source.intents).toHaveLength(1)
		expect(source.get('test:toggle')?.mode).toBe('toggle')
	})

	it('should overwrite duplicate intents without changing insertion order', () => {
		const source = createPaletteIntentSource({
			intents: [
				{ id: 'dup', targetId: 'test', mode: 'toggle' },
				{ id: 'other', targetId: 'test', mode: 'toggle' },
			],
		})

		source.register({ id: 'dup', targetId: 'test', mode: 'set', value: true })

		expect(source.intents.map((intent) => intent.id)).toEqual(['dup', 'other'])
		const resolved = source.get('dup')
		expect(resolved?.mode).toBe('set')
		if (resolved?.mode === 'set') {
			expect(resolved.value).toBe(true)
		}
	})

	it('should derive boolean intents', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'ui.darkMode',
			label: 'Dark Mode',
			schema: { type: 'boolean' },
		}

		const derived = source.derive(entry)
		expect(derived).toHaveLength(3) // set:true, set:false, toggle

		const toggleIntent = derived.find((i) => i.mode === 'toggle')
		expect(toggleIntent?.id).toBe('ui.darkMode:toggle')
		expect(toggleIntent?.label).toBe('Toggle Dark Mode')
	})

	it('should derive enum intents', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'ui.theme',
			label: 'Theme',
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
		}

		const derived = source.derive(entry)
		expect(derived.length).toBeGreaterThan(0)

		const lightIntent = derived.find((i) => i.id === 'ui.theme:set:light')
		expect(lightIntent?.mode).toBe('set')
		if (lightIntent && lightIntent.mode === 'set') {
			expect(lightIntent.value).toBe('light')
			expect(lightIntent.label).toBe('Light Mode')
			expect(lightIntent.description).toBe('Use the light theme')
			expect(lightIntent.categories).toEqual(['appearance', 'bright'])
		}

		expect(derived.some((i) => i.mode === 'flip')).toBe(false)
	})

	it('should normalize string enum options and propagate icon metadata', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'game.tool',
			label: 'Selected Tool',
			categories: ['tools', 'shared'],
			schema: {
				type: 'enum',
				options: [
					'select',
					{
						value: 'destroy',
						label: 'Destroy',
						icon: 'trash',
						categories: ['shared', 'destructive'],
					},
				],
			},
		}

		const selectIntent = source.derive(entry).find((i) => i.id === 'game.tool:set:select')
		expect(selectIntent?.mode).toBe('set')
		if (selectIntent?.mode === 'set') {
			expect(selectIntent.value).toBe('select')
			expect(selectIntent.label).toBe('select')
		}

		const destroyIntent = source.derive(entry).find((i) => i.id === 'game.tool:set:destroy')
		expect(destroyIntent?.mode).toBe('set')
		if (destroyIntent?.mode === 'set') {
			expect(destroyIntent.icon).toBe('trash')
			expect(destroyIntent.categories).toEqual(['tools', 'shared', 'destructive'])
		}
	})

	it('should derive number intents', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'game.speed',
			label: 'Game Speed',
			schema: { type: 'number', min: 0, max: 10, step: 0.5 },
		}

		const derived = source.derive(entry)
		expect(derived.length).toBeGreaterThan(0)

		const stepUpIntent = derived.find((i) => i.id === 'game.speed:step:up')
		expect(stepUpIntent?.mode).toBe('step')
		if (stepUpIntent && stepUpIntent.mode === 'step') {
			expect(stepUpIntent.step).toBe(0.5)
			expect(stepUpIntent.label).toBe('Increase Game Speed')
		}

		const stepDownIntent = derived.find((i) => i.id === 'game.speed:step:down')
		expect(stepDownIntent?.mode).toBe('step')
		if (stepDownIntent && stepDownIntent.mode === 'step') {
			expect(stepDownIntent.step).toBe(-0.5)
			expect(stepDownIntent.label).toBe('Decrease Game Speed')
		}

		const minStashIntent = derived.find((i) => i.id === 'game.speed:stash:0')
		expect(minStashIntent?.mode).toBe('stash')
		if (minStashIntent && minStashIntent.mode === 'stash') {
			expect(minStashIntent.value).toBe(0)
		}

		const maxStashIntent = derived.find((i) => i.id === 'game.speed:stash:10')
		expect(maxStashIntent?.mode).toBe('stash')
		if (maxStashIntent && maxStashIntent.mode === 'stash') {
			expect(maxStashIntent.value).toBe(10)
		}

		const midStashIntent = derived.find((i) => i.id === 'game.speed:stash:5')
		expect(midStashIntent?.mode).toBe('stash')
		if (midStashIntent && midStashIntent.mode === 'stash') {
			expect(midStashIntent.value).toBe(5)
			expect(midStashIntent.label).toBe('Set Game Speed to midpoint')
		}
	})

	it('should derive a zero-valued preset when min and max are zero', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'audio.volume',
			label: 'Audio Volume',
			schema: { type: 'number', min: 0, max: 0, step: 1 },
		}

		const derived = source.derive(entry)
		const zeroPresets = derived.filter((intent) => intent.id === 'audio.volume:stash:0')

		expect(zeroPresets).toHaveLength(1)
		expect(zeroPresets[0]?.mode).toBe('stash')
		if (zeroPresets[0]?.mode === 'stash') {
			expect(zeroPresets[0].value).toBe(0)
		}
	})

	it('should derive action intents', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'file.save',
			label: 'Save File',
			schema: { type: 'action', run: () => {} },
		}

		const derived = source.derive(entry)
		expect(derived).toHaveLength(1)

		const runIntent = derived[0]
		expect(runIntent.mode).toBe('run')
		expect(runIntent.id).toBe('file.save:run')
		expect(runIntent.label).toBe('Save File')
	})

	it('should not derive intents for status entries', () => {
		const source = createPaletteIntentSource()
		const entry: PaletteEntryDefinition = {
			id: 'system.memory',
			label: 'Memory Usage',
			schema: { type: 'status' },
		}

		const derived = source.derive(entry)
		expect(derived).toHaveLength(0)
	})
})
