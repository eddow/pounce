import { describe, expect, it } from 'vitest'
import { createPaletteKeys, formatKeystroke, normalizeKeystroke, parseKeystroke } from './keys'

function keyboardEvent(
	key: string,
	options?: {
		ctrlKey?: boolean
		altKey?: boolean
		shiftKey?: boolean
		metaKey?: boolean
	}
): KeyboardEvent {
	return new KeyboardEvent('keydown', {
		key,
		ctrlKey: options?.ctrlKey,
		altKey: options?.altKey,
		shiftKey: options?.shiftKey,
		metaKey: options?.metaKey,
	})
}

describe('palette keys', () => {
	it('normalizes and formats keystrokes', () => {
		expect(parseKeystroke('ctrl+shift+p')).toBe('Ctrl+Shift+P')
		expect(parseKeystroke(' space ')).toBe('Space')
		expect(formatKeystroke('alt+l')).toBe('Alt+L')
		expect(normalizeKeystroke(keyboardEvent('p', { ctrlKey: true, shiftKey: true }))).toBe(
			'Ctrl+Shift+P'
		)
	})

	it('supports bidirectional lookup', () => {
		const keys = createPaletteKeys([
			{ kind: 'intent', intentId: 'ui.layout:flip', keystroke: 'alt+l' },
			{ kind: 'entry', entryId: 'ui.theme', keystroke: 'ctrl+t' },
		])

		expect(keys.getIntentKeystroke('ui.layout:flip')).toBe('Alt+L')
		expect(keys.getEntryKeystroke('ui.theme')).toBe('Ctrl+T')
		expect([...keys.findByKeystroke('ctrl+t')]).toEqual([
			{ kind: 'entry', entryId: 'ui.theme', keystroke: 'Ctrl+T' },
		])
	})

	it('rebinds and resolves events', () => {
		const keys = createPaletteKeys([
			{ kind: 'intent', intentId: 'game.speed:stash:0', keystroke: 'Space' },
		])

		keys.rebindIntent('game.speed:stash:0', 'Ctrl+G')
		expect(keys.getIntentKeystroke('game.speed:stash:0')).toBe('Ctrl+G')
		expect([...keys.resolve(keyboardEvent('g', { ctrlKey: true }))]).toEqual([
			{ kind: 'intent', intentId: 'game.speed:stash:0', keystroke: 'Ctrl+G' },
		])
	})
})
