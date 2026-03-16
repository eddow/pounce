import { describe, expect, it, vi } from 'vitest'
import { paletteCommandBoxModel, paletteCommandEntries } from './command-box'
import { createPaletteKeys } from './keys'

describe('paletteCommandBoxModel', () => {
	it('filters entries by free text, categories, and keyword tokens', () => {
		const model = paletteCommandBoxModel({
			entries: [
				{
					id: 'theme-dark',
					label: 'Theme Dark',
					keywords: ['theme', 'dark'],
					categories: ['appearance'],
					run() {},
				},
				{
					id: 'mode-command',
					label: 'Mode Command',
					keywords: ['mode', 'command'],
					categories: ['workspace'],
					run() {},
				},
			],
		})

		expect(model.results.map((entry) => entry.id)).toEqual(['mode-command', 'theme-dark'])

		model.search({ free: 'theme', categories: ['appearance'] })
		expect(model.results.map((entry) => entry.id)).toEqual(['theme-dark'])
		expect(model.query.free).toBe('theme')
		expect(Array.from(model.query.categories)).toEqual(['appearance'])

		model.keywords.addToken('dark')
		expect(Array.from(model.query.keywords)).toEqual(['dark'])
		expect(model.results.map((entry) => entry.id)).toEqual(['theme-dark'])
	})

	it('offers keyword suggestions and consumes matching suggestion on tab', () => {
		const model = paletteCommandBoxModel({
			entries: [
				{ id: 'theme-dark', label: 'Theme Dark', keywords: ['dark'], run() {} },
				{ id: 'theme-light', label: 'Theme Light', keywords: ['light'], run() {} },
			],
		})

		model.input.value = 'da'
		expect(model.suggestions.map((entry) => entry.keyword)).toEqual(['dark'])

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
		expect(model.handleKeyDown(event)).toBe(true)
		expect(event.defaultPrevented).toBe(true)
		expect(model.keywords.tokens.map((entry) => entry.keyword)).toEqual(['dark'])
		expect(model.input.value).toBe('')
	})

	it('navigates and executes the selected result, then clears state', () => {
		const first = vi.fn()
		const second = vi.fn()
		const model = paletteCommandBoxModel({
			entries: [
				{
					id: 'first',
					label: 'First Command',
					categories: ['actions'],
					keywords: ['pinned'],
					run: first,
				},
				{
					id: 'second',
					label: 'Second Command',
					categories: ['actions'],
					keywords: ['pinned'],
					run: second,
				},
			],
		})

		expect(model.selection.index).toBe(-1)
		expect(
			model.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }))
		).toBe(true)
		expect(model.selection.item?.id).toBe('first')
		expect(
			model.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }))
		).toBe(true)
		expect(model.selection.item?.id).toBe('second')

		model.keywords.addToken('pinned')
		model.categories.toggle('actions')
		model.input.value = 'second'
		expect(
			model.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }))
		).toBe(true)

		expect(second).toHaveBeenCalledTimes(1)
		expect(model.input.value).toBe('')
		expect(model.keywords.tokens).toHaveLength(0)
		expect(model.categories.active).toHaveLength(0)
		expect(model.selection.index).toBe(-1)
	})

	it('uses backspace to remove the last keyword token before categories', () => {
		const model = paletteCommandBoxModel({
			entries: [{ id: 'alpha', label: 'Alpha', run() {} }],
		})

		model.categories.toggle('filters')
		model.keywords.addToken('alpha')

		const removeKeyword = new KeyboardEvent('keydown', {
			key: 'Backspace',
			cancelable: true,
		})
		expect(model.handleKeyDown(removeKeyword)).toBe(true)
		expect(model.keywords.tokens).toHaveLength(0)
		expect(Array.from(model.categories.active)).toEqual(['filters'])

		const removeCategory = new KeyboardEvent('keydown', {
			key: 'Backspace',
			cancelable: true,
		})
		expect(model.handleKeyDown(removeCategory)).toBe(true)
		expect(Array.from(model.categories.active)).toHaveLength(0)
	})

	it('derives command entries from palette tools, values, and value actions', () => {
		const reset = vi.fn()
		const palette = {
			tools: {
				notifications: {
					type: 'boolean' as const,
					label: 'Notifications',
					categories: ['settings'],
					keywords: ['alerts'],
					get value() {
						return true
					},
					set value(_value: boolean) {},
					default: true,
				},
				theme: {
					type: 'enum' as const,
					label: 'Theme',
					categories: ['appearance'],
					get value() {
						return 'dark' as const
					},
					set value(_value: 'light' | 'dark') {},
					default: 'dark' as const,
					values: [
						{ value: 'light' as const, label: 'Light', keywords: ['day'] },
						{ value: 'dark' as const, label: 'Dark', keywords: ['night'] },
					],
				},
				fontSize: {
					type: 'number' as const,
					label: 'Font Size',
					categories: ['appearance'],
					get value() {
						return 12
					},
					set value(_value: number) {},
					default: 12,
					min: 10,
					max: 20,
					step: 1,
				},
				reset: {
					label: 'Reset Defaults',
					categories: ['presets'],
					get can() {
						return true
					},
					run: reset,
				},
			},
			keys: createPaletteKeys({
				R: 'reset',
				T: 'theme|light',
				'+': 'fontSize:inc',
			}),
		}
		const entries = paletteCommandEntries({ palette })

		expect(entries.find((entry) => entry.id === 'reset')?.label).toBe('Reset Defaults')
		expect(entries.find((entry) => entry.id === 'theme|light')?.label).toBe('Set Theme to Light')
		expect(entries.find((entry) => entry.id === 'theme|light')?.meta).toBe('T')
		expect(entries.find((entry) => entry.id === 'fontSize:inc')?.label).toBe('Increase Font Size')
		expect(entries.find((entry) => entry.id === 'notifications|false')?.label).toBe(
			'Disable Notifications'
		)
		expect(entries.find((entry) => entry.id === 'theme|light')?.keywords).toContain('day')
	})
})
