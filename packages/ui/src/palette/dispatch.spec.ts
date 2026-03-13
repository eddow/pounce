import { beforeEach, describe, expect, it } from 'vitest'
import { executePaletteIntent } from './dispatch'
import { createPaletteModel } from './model'
import type {
	PaletteEntryDefinition,
	PaletteIntent,
	PaletteModelLike,
	PaletteStashFallback,
} from './types'

describe('executePaletteIntent', () => {
	let mockPalette: PaletteModelLike
	let actionEntry: PaletteEntryDefinition
	let booleanEntry: PaletteEntryDefinition
	let numberEntry: PaletteEntryDefinition
	let enumEntry: PaletteEntryDefinition

	beforeEach(() => {
		mockPalette = {
			state: {},
			runtime: {},
			display: {
				container: {
					toolbarStack: {
						top: [{ slots: [] }],
						right: [{ slots: [] }],
						bottom: [{ slots: [] }],
						left: [{ slots: [] }],
					},
					editMode: false,
				},
			},
			resolveEntry: () => undefined,
		}

		actionEntry = {
			id: 'test.action',
			label: 'Test Action',
			schema: {
				type: 'action',
				run: () => 'action-result',
			},
		}

		booleanEntry = {
			id: 'test.boolean',
			label: 'Test Boolean',
			schema: { type: 'boolean' },
		}

		numberEntry = {
			id: 'test.number',
			label: 'Test Number',
			schema: { type: 'number', min: 0, max: 10, step: 2 },
		}

		enumEntry = {
			id: 'test.enum',
			label: 'Test Enum',
			schema: { type: 'enum', options: ['a', 'b', 'c'] as const },
		}
	})

	describe('error handling', () => {
		it('throws when intent target entry not found', () => {
			const intent: PaletteIntent = {
				id: 'missing:run',
				targetId: 'missing.entry',
				mode: 'run',
			}

			expect(() => executePaletteIntent(mockPalette, intent)).toThrow(
				'Entry not found for intent: missing:run'
			)
		})

		it('throws when trying to run non-action entry', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.boolean') return booleanEntry
				return undefined
			}

			const intent: PaletteIntent = {
				id: 'test.boolean:run',
				targetId: 'test.boolean',
				mode: 'run',
			}

			expect(() => executePaletteIntent(mockPalette, intent)).toThrow(
				'Cannot run non-action entry: test.boolean'
			)
		})
	})

	describe('run mode', () => {
		it('executes action and returns result', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.action') return actionEntry
				return undefined
			}

			const intent: PaletteIntent = {
				id: 'test.action:run',
				targetId: 'test.action',
				mode: 'run',
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe('action-result')
		})

		it('passes palette and intent to action callback', () => {
			let receivedPalette: PaletteModelLike | undefined
			let receivedIntent: PaletteIntent | undefined

			const actionEntryWithSpy: PaletteEntryDefinition = {
				id: 'test.action',
				label: 'Test Action',
				schema: {
					type: 'action',
					run: (palette, intent) => {
						receivedPalette = palette
						receivedIntent = intent
						return 'spy-result'
					},
				},
			}

			mockPalette.resolveEntry = (id) => {
				if (id === 'test.action') return actionEntryWithSpy
				return undefined
			}

			const intent: PaletteIntent = {
				id: 'test.action:run',
				targetId: 'test.action',
				mode: 'run',
			}

			executePaletteIntent(mockPalette, intent)

			expect(receivedPalette).toBe(mockPalette)
			expect(receivedIntent).toBe(intent)
		})
	})

	describe('set mode', () => {
		it('sets value and returns it', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.boolean') return booleanEntry
				return undefined
			}

			const intent: PaletteIntent = {
				id: 'test.boolean:set:true',
				targetId: 'test.boolean',
				mode: 'set',
				value: true,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(true)
			expect(mockPalette.state['test.boolean']).toBe(true)
		})

		it('sets complex values', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.enum') return enumEntry
				return undefined
			}

			const intent: PaletteIntent = {
				id: 'test.enum:set:b',
				targetId: 'test.enum',
				mode: 'set',
				value: { complex: 'object' },
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toEqual({ complex: 'object' })
			expect(mockPalette.state['test.enum']).toEqual({ complex: 'object' })
		})
	})

	describe('toggle mode', () => {
		it('toggles false to true', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.boolean') return booleanEntry
				return undefined
			}
			mockPalette.state['test.boolean'] = false

			const intent: PaletteIntent = {
				id: 'test.boolean:toggle',
				targetId: 'test.boolean',
				mode: 'toggle',
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(true)
			expect(mockPalette.state['test.boolean']).toBe(true)
		})

		it('toggles true to false', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.boolean') return booleanEntry
				return undefined
			}
			mockPalette.state['test.boolean'] = true

			const intent: PaletteIntent = {
				id: 'test.boolean:toggle',
				targetId: 'test.boolean',
				mode: 'toggle',
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(false)
			expect(mockPalette.state['test.boolean']).toBe(false)
		})

		it('toggles undefined to true', () => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.boolean') return booleanEntry
				return undefined
			}

			const intent: PaletteIntent = {
				id: 'test.boolean:toggle',
				targetId: 'test.boolean',
				mode: 'toggle',
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(true)
			expect(mockPalette.state['test.boolean']).toBe(true)
		})
	})

	describe('step mode', () => {
		beforeEach(() => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.number') return numberEntry
				return undefined
			}
		})

		it('steps by default step when not specified', () => {
			mockPalette.state['test.number'] = 5

			const intent: PaletteIntent = {
				id: 'test.number:step:up',
				targetId: 'test.number',
				mode: 'step',
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(7)
			expect(mockPalette.state['test.number']).toBe(7)
		})

		it('steps by explicit step', () => {
			mockPalette.state['test.number'] = 5

			const intent: PaletteIntent = {
				id: 'test.number:step:up',
				targetId: 'test.number',
				mode: 'step',
				step: 3,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(8)
			expect(mockPalette.state['test.number']).toBe(8)
		})

		it('steps negative values', () => {
			mockPalette.state['test.number'] = 5

			const intent: PaletteIntent = {
				id: 'test.number:step:down',
				targetId: 'test.number',
				mode: 'step',
				step: -3,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(2)
			expect(mockPalette.state['test.number']).toBe(2)
		})

		it('clamps to minimum', () => {
			mockPalette.state['test.number'] = 1

			const intent: PaletteIntent = {
				id: 'test.number:step:down',
				targetId: 'test.number',
				mode: 'step',
				step: -5,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(0)
			expect(mockPalette.state['test.number']).toBe(0)
		})

		it('clamps to maximum', () => {
			mockPalette.state['test.number'] = 9

			const intent: PaletteIntent = {
				id: 'test.number:step:up',
				targetId: 'test.number',
				mode: 'step',
				step: 5,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(10)
			expect(mockPalette.state['test.number']).toBe(10)
		})

		it('steps non-number entries without clamping', () => {
			const stringEntry: PaletteEntryDefinition = {
				id: 'test.string',
				label: 'Test String',
				schema: { type: 'number' },
			}

			mockPalette.resolveEntry = (id) => {
				if (id === 'test.string') return stringEntry
				return undefined
			}

			mockPalette.state['test.string'] = 5

			const intent: PaletteIntent = {
				id: 'test.string:step:up',
				targetId: 'test.string',
				mode: 'step',
				step: 2,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(7)
			expect(mockPalette.state['test.string']).toBe(7)
		})

		it('handles undefined initial value', () => {
			const intent: PaletteIntent = {
				id: 'test.number:step:up',
				targetId: 'test.number',
				mode: 'step',
				step: 3,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(3)
			expect(mockPalette.state['test.number']).toBe(3)
		})
	})

	describe('flip mode', () => {
		beforeEach(() => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.enum') return enumEntry
				return undefined
			}
		})

		it('flips from first to second value', () => {
			mockPalette.state['test.enum'] = 'a'

			const intent: PaletteIntent = {
				id: 'test.enum:flip',
				targetId: 'test.enum',
				mode: 'flip',
				values: ['a', 'b'] as const,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe('b')
			expect(mockPalette.state['test.enum']).toBe('b')
		})

		it('flips from second to first value', () => {
			mockPalette.state['test.enum'] = 'b'

			const intent: PaletteIntent = {
				id: 'test.enum:flip',
				targetId: 'test.enum',
				mode: 'flip',
				values: ['a', 'b'] as const,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe('a')
			expect(mockPalette.state['test.enum']).toBe('a')
		})

		it('handles values not in flip pair', () => {
			mockPalette.state['test.enum'] = 'c'

			const intent: PaletteIntent = {
				id: 'test.enum:flip',
				targetId: 'test.enum',
				mode: 'flip',
				values: ['a', 'b'] as const,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe('b') // Falls back to second value
			expect(mockPalette.state['test.enum']).toBe('b')
		})
	})

	describe('stash mode', () => {
		beforeEach(() => {
			mockPalette.resolveEntry = (id) => {
				if (id === 'test.number') return numberEntry
				return undefined
			}
		})

		it('stores current value and applies stash value', () => {
			mockPalette.state['test.number'] = 5

			const intent: PaletteIntent = {
				id: 'test.number:stash:0',
				targetId: 'test.number',
				mode: 'stash',
				value: 0,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(0)
			expect(mockPalette.state['test.number']).toBe(0)
			expect(mockPalette.runtime['test.number:stash:0']).toBe(5)
		})

		it('restores stashed value on second activation', () => {
			mockPalette.state['test.number'] = 0
			mockPalette.runtime['test.number:stash:0'] = 5

			const intent: PaletteIntent = {
				id: 'test.number:stash:0',
				targetId: 'test.number',
				mode: 'stash',
				value: 0,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(5)
			expect(mockPalette.state['test.number']).toBe(5)
			expect(mockPalette.runtime['test.number:stash:0']).toBeUndefined()
		})

		it('invalidates stale stash when state changes independently', () => {
			// Start with stashed state
			mockPalette.runtime['test.number:stash:0'] = 5
			mockPalette.state['test.number'] = 0

			// State changes independently (not through stash mechanism)
			mockPalette.state['test.number'] = 7

			const intent: PaletteIntent = {
				id: 'test.number:stash:0',
				targetId: 'test.number',
				mode: 'stash',
				value: 0,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(0)
			expect(mockPalette.state['test.number']).toBe(0)
			// Old stash (5) is invalidated (deleted), new stash (7) is stored
			expect(mockPalette.runtime['test.number:stash:0']).toBe(7)
		})

		it('deletes stale stash instead of overwriting', () => {
			// Start with existing stash
			mockPalette.runtime['test.number:stash:0'] = 3
			mockPalette.state['test.number'] = 8

			const intent: PaletteIntent = {
				id: 'test.number:stash:0',
				targetId: 'test.number',
				mode: 'stash',
				value: 0,
			}

			const result = executePaletteIntent(mockPalette, intent)
			expect(result).toBe(0)
			expect(mockPalette.state['test.number']).toBe(0)
			// Old stash (3) is invalidated (deleted), new stash (8) is stored
			expect(mockPalette.runtime['test.number:stash:0']).toBe(8)
		})

		describe('fallback behavior', () => {
			it('uses set fallback when no stashed value exists', () => {
				mockPalette.state['test.number'] = 0

				const fallback: PaletteStashFallback = { kind: 'set', value: 3 }
				const intent: PaletteIntent = {
					id: 'test.number:stash:0',
					targetId: 'test.number',
					mode: 'stash',
					value: 0,
					fallback,
				}

				const result = executePaletteIntent(mockPalette, intent)
				expect(result).toBe(3)
				expect(mockPalette.state['test.number']).toBe(3)
				expect(mockPalette.runtime['test.number:stash:0']).toBeUndefined()
			})

			it('uses step fallback when no stashed value exists', () => {
				mockPalette.state['test.number'] = 0

				const fallback: PaletteStashFallback = { kind: 'step', step: 2 }
				const intent: PaletteIntent = {
					id: 'test.number:stash:0',
					targetId: 'test.number',
					mode: 'stash',
					value: 0,
					fallback,
				}

				const result = executePaletteIntent(mockPalette, intent)
				expect(result).toBe(2)
				expect(mockPalette.state['test.number']).toBe(2)
				expect(mockPalette.runtime['test.number:stash:0']).toBeUndefined()
			})

			it('uses noop fallback when no stashed value exists', () => {
				mockPalette.state['test.number'] = 0

				const fallback: PaletteStashFallback = { kind: 'noop' }
				const intent: PaletteIntent = {
					id: 'test.number:stash:0',
					targetId: 'test.number',
					mode: 'stash',
					value: 0,
					fallback,
				}

				const result = executePaletteIntent(mockPalette, intent)
				expect(result).toBe(0)
				expect(mockPalette.state['test.number']).toBe(0)
				expect(mockPalette.runtime['test.number:stash:0']).toBeUndefined()
			})

			it('step fallback respects number entry bounds', () => {
				mockPalette.state['test.number'] = 0

				const fallback: PaletteStashFallback = { kind: 'step', step: 15 }
				const intent: PaletteIntent = {
					id: 'test.number:stash:0',
					targetId: 'test.number',
					mode: 'stash',
					value: 0,
					fallback,
				}

				const result = executePaletteIntent(mockPalette, intent)
				expect(result).toBe(10) // Clamped to max
				expect(mockPalette.state['test.number']).toBe(10)
			})

			it('step fallback works on non-number entries', () => {
				const stringEntry: PaletteEntryDefinition = {
					id: 'test.string',
					label: 'Test String',
					schema: { type: 'boolean' },
				}
				mockPalette.resolveEntry = (id) => {
					if (id === 'test.string') return stringEntry
					return undefined
				}
				mockPalette.state['test.string'] = 0

				const fallback: PaletteStashFallback = { kind: 'step', step: 5 }
				const intent: PaletteIntent = {
					id: 'test.string:stash:0',
					targetId: 'test.string',
					mode: 'stash',
					value: 0,
					fallback,
				}

				const result = executePaletteIntent(mockPalette, intent)
				expect(result).toBe(5)
				expect(mockPalette.state['test.string']).toBe(5)
			})
		})
	})

	describe('integration with createPaletteModel', () => {
		it('works through model.run()', () => {
			const model = createPaletteModel({
				definitions: [booleanEntry],
			})

			const intent: PaletteIntent = {
				id: 'test.boolean:toggle',
				targetId: 'test.boolean',
				mode: 'toggle',
			}

			const result = model.run(intent.id)
			expect(result).toBe(true)
			expect(model.state['test.boolean']).toBe(true)
		})
	})
})
