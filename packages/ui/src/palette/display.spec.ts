import { describe, expect, it } from 'vitest'
import { paletteContainerModel } from './container'
import {
	computeCheckedState,
	computeDisabledState,
	getDefaultDisplayPresenter,
	getDisplayPresenterFamily,
	paletteDisplayCustomizationModel,
	paletteToolbarModel,
} from './display'
import { createPaletteModel } from './model'
import type {
	PaletteDisplayItem,
	PaletteEditorDisplayItem,
	PaletteEntryDefinition,
	PaletteIntent,
	PaletteIntentDisplayItem,
	PaletteToolbar,
} from './types'

const testEntry: PaletteEntryDefinition = {
	id: 'test.setting',
	label: 'Test Setting',
	schema: { type: 'boolean' },
}

const testIntent: PaletteIntent = {
	id: 'test.setting:toggle',
	targetId: 'test.setting',
	mode: 'toggle',
}

const testEnumEntry: PaletteEntryDefinition = {
	id: 'test.theme',
	label: 'Theme',
	schema: {
		type: 'enum',
		options: ['light', 'dark', 'auto'],
	},
}

const testEnumIntent: PaletteIntent = {
	id: 'test.theme:set:light',
	targetId: 'test.theme',
	mode: 'set',
	value: 'light',
}

const testNumberEntry: PaletteEntryDefinition = {
	id: 'test.volume',
	label: 'Volume',
	schema: { type: 'number', min: 0, max: 10, step: 1 },
}

function intentItem(intentId: string, presenter = 'button'): PaletteIntentDisplayItem {
	return {
		kind: 'intent',
		intentId,
		presenter,
	}
}

function editorItem(entryId: string, presenter = 'default'): PaletteEditorDisplayItem {
	return {
		kind: 'editor',
		entryId,
		presenter,
	}
}

function toolbarFixture(items: readonly PaletteDisplayItem[]): PaletteToolbar {
	return {
		items,
	}
}

function containerFixture(...toolbars: PaletteToolbar[]) {
	return {
		editMode: false,
		toolbarStack: {
			top: {
				slots: toolbars.map((toolbar, index) => ({
					toolbar,
					space: 1 / (toolbars.length + 1 - index),
				})),
			},
			right: { slots: [] },
			bottom: { slots: [] },
			left: { slots: [] },
		},
	}
}

describe('palette display', () => {
	describe('paletteToolbarModel', () => {
		it('resolves intent display items in a toolbar', () => {
			const palette = createPaletteModel({
				definitions: [testEntry],
				intents: [testIntent],
			})

			const toolbar = toolbarFixture([intentItem('test.setting:toggle', 'toggle')])

			const model = paletteToolbarModel({ palette, toolbar })

			expect(model.items).toHaveLength(1)
			expect(model.items[0].kind).toBe('intent')
			if (model.items[0]?.kind === 'intent') {
				expect(model.items[0].intent).toEqual(testIntent)
				expect(model.items[0].entry).toEqual(testEntry)
			}
		})

		it('resolves editor display items in a toolbar', () => {
			const palette = createPaletteModel({
				definitions: [testEnumEntry],
			})

			const toolbar = toolbarFixture([editorItem('test.theme', 'select')])

			const model = paletteToolbarModel({ palette, toolbar })

			expect(model.items).toHaveLength(1)
			expect(model.items[0].kind).toBe('editor')
			if (model.items[0]?.kind === 'editor') {
				expect(model.items[0].entry).toEqual(testEnumEntry)
				expect(model.items[0].presenter).toBe('select')
			}
		})

		it('filters unresolved toolbar items', () => {
			const palette = createPaletteModel({
				definitions: [testEntry],
				intents: [testIntent],
			})

			const toolbar = toolbarFixture([intentItem('missing:intent')])

			const model = paletteToolbarModel({ palette, toolbar })
			expect(model.items).toHaveLength(0)
		})
	})

	describe('paletteDisplayCustomizationModel', () => {
		it('adds and updates toolbar items', () => {
			const palette = createPaletteModel({
				display: {
					container: containerFixture(toolbarFixture([])),
				},
			})

			const model = paletteDisplayCustomizationModel({ palette })
			let toolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			model.addToToolbar(toolbar, intentItem('test.setting:toggle', 'button'))
			toolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			model.addToToolbar(toolbar, {
				...intentItem('test.setting:toggle', 'toggle'),
				showText: true,
			})

			const updatedToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			expect(updatedToolbar.items).toHaveLength(1)
			expect(updatedToolbar.items[0]).toEqual({
				kind: 'intent',
				intentId: 'test.setting:toggle',
				presenter: 'toggle',
				showText: true,
			})
		})

		it('adds, moves, updates, and removes editor items', () => {
			const palette = createPaletteModel({
				display: {
					container: containerFixture(
						toolbarFixture([intentItem('test.setting:toggle', 'toggle')])
					),
				},
			})

			const model = paletteDisplayCustomizationModel({ palette })
			const toolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			const editor = editorItem('test.theme', 'select')
			model.addToToolbar(toolbar, editor)
			let updatedToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			const updatedEditor = updatedToolbar.items.find(
				(item) => item.kind === 'editor' && item.entryId === 'test.theme'
			)
			expect(updatedEditor).toBeDefined()
			model.moveWithinToolbar(updatedToolbar, updatedEditor!, 0)

			updatedToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			model.setPresenter(updatedToolbar, updatedToolbar.items[0], 'radio-like')

			updatedToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			expect(updatedToolbar.items[0]).toEqual({
				kind: 'editor',
				entryId: 'test.theme',
				presenter: 'radio-like',
			})

			model.removeFromToolbar(updatedToolbar, updatedToolbar.items[0])
			updatedToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			expect(updatedToolbar.items).toHaveLength(1)
			expect(updatedToolbar.items[0]).toEqual(intentItem('test.setting:toggle', 'toggle'))
		})

		it('allows moving an item to the end of the same toolbar', () => {
			const palette = createPaletteModel({
				display: {
					container: containerFixture(
						toolbarFixture([
							intentItem('test.setting:first', 'button'),
							intentItem('test.setting:second', 'button'),
							intentItem('test.setting:third', 'button'),
						])
					),
				},
			})

			const model = paletteDisplayCustomizationModel({ palette })
			const toolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			model.moveWithinToolbar(toolbar, toolbar.items[0], toolbar.items.length)

			const updatedToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			expect(
				updatedToolbar.items.map((item: (typeof updatedToolbar.items)[number]) =>
					item.kind === 'intent' ? item.intentId : 'other'
				)
			).toEqual(['test.setting:second', 'test.setting:third', 'test.setting:first'])
		})

		it('removes the source toolbar after moving its last item to another toolbar when container is provided', () => {
			const palette = createPaletteModel({
				display: {
					container: containerFixture(
						toolbarFixture([intentItem('test.setting:toggle', 'button')]),
						toolbarFixture([editorItem('test.theme', 'select')])
					),
				},
			})

			const container = paletteContainerModel({ palette })
			const model = paletteDisplayCustomizationModel({ palette, container })
			const sourceToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			const targetToolbar = palette.display.container!.toolbarStack.top.slots[1].toolbar

			model.moveToToolbar(sourceToolbar, sourceToolbar.items[0], targetToolbar, 1)

			expect(container.toolbarStack.top.slots).toHaveLength(1)
			const remainingToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			expect(remainingToolbar.items.map((item) => item.kind)).toEqual(['editor', 'intent'])
		})

		it('clears explicit presenters while preserving other properties', () => {
			const palette = createPaletteModel({
				display: {
					container: containerFixture(
						toolbarFixture([
							{
								kind: 'intent',
								intentId: 'test.setting:toggle',
								presenter: 'pill',
								showText: false,
							},
						])
					),
				},
			})

			const model = paletteDisplayCustomizationModel({ palette })
			const toolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar
			model.setPresenter(toolbar, toolbar.items[0], undefined)

			const item = palette.display.container!.toolbarStack.top.slots[0].toolbar.items[0]
			expect(item).not.toHaveProperty('presenter')
			expect(item?.showText).toBe(false)
		})

		it('throws precise errors for invalid operations', () => {
			const palette = createPaletteModel({
				display: {
					container: containerFixture(toolbarFixture([intentItem('test1'), intentItem('test2')])),
				},
			})

			const model = paletteDisplayCustomizationModel({ palette })
			const existingToolbar = palette.display.container!.toolbarStack.top.slots[0].toolbar

			expect(() => model.moveWithinToolbar(existingToolbar, intentItem('missing'), 0)).toThrow(
				"Item 'missing' (intent) not found in toolbar"
			)
			expect(() => model.moveWithinToolbar(existingToolbar, existingToolbar.items[0], -1)).toThrow(
				'Invalid target index -1 for toolbar with 2 items'
			)
			expect(() => model.moveWithinToolbar(existingToolbar, existingToolbar.items[0], 3)).toThrow(
				'Invalid target index 3 for toolbar with 2 items'
			)
		})
	})

	describe('presenter helpers', () => {
		it('returns enum family and radio presenter for enum set intents', () => {
			expect(getDisplayPresenterFamily(testEnumIntent, testEnumEntry)).toBe('enum')
			expect(getDefaultDisplayPresenter(testEnumIntent, testEnumEntry)).toBe('radio')
		})

		it('returns boolean family and toggle presenter for boolean toggle intents', () => {
			expect(getDisplayPresenterFamily(testIntent, testEntry)).toBe('boolean')
			expect(getDefaultDisplayPresenter(testIntent, testEntry)).toBe('toggle')
		})

		it('returns button for generic action intents', () => {
			const actionIntent: PaletteIntent = {
				id: 'test.action:run',
				targetId: 'test.action',
				mode: 'run',
			}
			const actionEntry: PaletteEntryDefinition = {
				id: 'test.action',
				label: 'Action',
				schema: { type: 'action', run: () => undefined },
			}

			expect(getDefaultDisplayPresenter(actionIntent, actionEntry)).toBe('button')
		})
	})

	describe('checked and disabled state helpers', () => {
		it('uses explicit checked and disabled overrides', () => {
			const item: PaletteDisplayItem = {
				kind: 'intent',
				intentId: 'test.setting:toggle',
				presenter: 'toggle',
				checked: true,
				disabled: true,
			}

			expect(computeCheckedState(item, testIntent, testEntry, {})).toBe(true)
			expect(computeDisabledState(item, testIntent, testEntry, {})).toBe(true)
		})

		it('computes checked state for set, toggle, and flip intents', () => {
			expect(
				computeCheckedState(
					intentItem('test.theme:set:light', 'radio'),
					testEnumIntent,
					testEnumEntry,
					{
						'test.theme': 'light',
					}
				)
			).toBe(true)

			expect(
				computeCheckedState(intentItem('test.setting:toggle', 'toggle'), testIntent, testEntry, {
					'test.setting': false,
				})
			).toBe(false)

			const flipIntent: PaletteIntent = {
				id: 'test.theme:flip',
				targetId: 'test.theme',
				mode: 'flip',
				values: ['light', 'dark'],
			}

			expect(
				computeCheckedState(intentItem('test.theme:flip', 'flip'), flipIntent, testEnumEntry, {
					'test.theme': 'light',
				})
			).toBe(true)
		})

		it('disables stash intents when already applied and step intents at bounds', () => {
			const stashIntent: PaletteIntent = {
				id: 'test.volume:stash:0',
				targetId: 'test.volume',
				mode: 'stash',
				value: 0,
			}

			expect(
				computeDisabledState(
					intentItem('test.volume:stash:0', 'stash'),
					stashIntent,
					testNumberEntry,
					{
						'test.volume': 0,
					}
				)
			).toBe(true)

			const stepUp: PaletteIntent = {
				id: 'test.volume:step:up',
				targetId: 'test.volume',
				mode: 'step',
				step: 1,
			}
			const stepDown: PaletteIntent = {
				id: 'test.volume:step:down',
				targetId: 'test.volume',
				mode: 'step',
				step: -1,
			}

			expect(
				computeDisabledState(intentItem('test.volume:step:up', 'step'), stepUp, testNumberEntry, {
					'test.volume': 10,
				})
			).toBe(true)
			expect(
				computeDisabledState(
					intentItem('test.volume:step:down', 'step'),
					stepDown,
					testNumberEntry,
					{
						'test.volume': 0,
					}
				)
			).toBe(true)
			expect(
				computeDisabledState(intentItem('test.setting:toggle', 'toggle'), testIntent, testEntry, {
					'test.setting': true,
				})
			).toBe(false)
		})
	})
})
