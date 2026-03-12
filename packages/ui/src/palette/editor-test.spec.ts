import { describe, expect, it } from 'vitest'
import { createPaletteModel } from './model'
import type { PaletteDisplayItem, PaletteToolbarSurface } from './types'

function toolbarSurface(id: string, items: readonly PaletteDisplayItem[]): PaletteToolbarSurface {
	return {
		id,
		type: 'toolbar',
		region: 'top',
		visible: true,
		items,
	}
}

describe('editor-style display items', () => {
	it('should support editor display items alongside intent items', () => {
		const palette = createPaletteModel({
			definitions: [
				{
					id: 'game.speed',
					label: 'Game Speed',
					schema: { type: 'number', min: 0, max: 10, step: 1 },
				},
				{
					id: 'ui.theme',
					label: 'Theme',
					schema: {
						type: 'enum',
						options: ['light', 'dark', 'system'],
					},
				},
			],
			display: {
				container: {
					editMode: false,
					dropTargets: [],
					surfaces: [
						toolbarSurface('1', [
							{
								kind: 'intent',
								intentId: 'game.speed:step:up',
								presenter: 'step',
							},
							{
								kind: 'editor',
								entryId: 'game.speed',
								presenter: 'slider',
							},
							{
								kind: 'editor',
								entryId: 'ui.theme',
								presenter: 'select',
							},
						] as PaletteDisplayItem[]),
					],
				},
			},
		})

		const toolbar = palette.display.container!.surfaces[0] as PaletteToolbarSurface
		expect(toolbar.items).toHaveLength(3)

		// Resolve intent display item
		const intentItem = palette.resolveDisplayItem(toolbar.items[0])
		expect(intentItem?.kind).toBe('intent')
		if (intentItem?.kind === 'intent') {
			expect(intentItem.intent.id).toBe('game.speed:step:up')
			expect(intentItem.entry.id).toBe('game.speed')
		}

		// Resolve editor display items
		const editorItem1 = palette.resolveDisplayItem(toolbar.items[1])
		expect(editorItem1?.kind).toBe('editor')
		if (editorItem1?.kind === 'editor') {
			expect(editorItem1.entry.id).toBe('game.speed')
			expect(editorItem1.presenter).toBe('slider')
		}

		const editorItem2 = palette.resolveDisplayItem(toolbar.items[2])
		expect(editorItem2?.kind).toBe('editor')
		if (editorItem2?.kind === 'editor') {
			expect(editorItem2.entry.id).toBe('ui.theme')
			expect(editorItem2.presenter).toBe('select')
		}
	})
})
