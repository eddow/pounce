import type { PaletteKeyBindings, PaletteKeys, PaletteKeystroke } from './types'

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const

function normalizeModifier(value: string): string | undefined {
	switch (value.trim().toLowerCase()) {
		case 'ctrl':
		case 'control':
			return 'Ctrl'
		case 'alt':
		case 'option':
			return 'Alt'
		case 'shift':
			return 'Shift'
		case 'meta':
		case 'cmd':
		case 'command':
		case 'super':
			return 'Meta'
		default:
			return undefined
	}
}

function normalizeKey(value: string): string {
	const trimmed = value.trim()
	if (trimmed.length === 1) return trimmed.toUpperCase()
	switch (trimmed.toLowerCase()) {
		case ' ':
		case 'space':
		case 'spacebar':
			return 'Space'
		case 'escape':
			return 'Esc'
		default:
			return trimmed[0]?.toUpperCase() + trimmed.slice(1)
	}
}

export function normalizePaletteKeystroke(input: PaletteKeystroke): PaletteKeystroke {
	const parts = input
		.split('+')
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
	if (parts.length === 0) return ''

	const modifiers = new Set<string>()
	let key = ''
	for (const part of parts) {
		const modifier = normalizeModifier(part)
		if (modifier) {
			modifiers.add(modifier)
			continue
		}
		key = normalizeKey(part)
	}

	const orderedModifiers = MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier))
	return [...orderedModifiers, key].filter((part) => part.length > 0).join('+')
}

export function paletteKeystrokeFromEvent(event: KeyboardEvent): PaletteKeystroke {
	const modifiers: string[] = []
	if (event.ctrlKey) modifiers.push('Ctrl')
	if (event.altKey) modifiers.push('Alt')
	if (event.shiftKey) modifiers.push('Shift')
	if (event.metaKey) modifiers.push('Meta')
	return [...modifiers, normalizeKey(event.key)].join('+')
}

export function createPaletteKeys(bindings?: PaletteKeyBindings): PaletteKeys {
	const normalizedBindings: PaletteKeyBindings = {}
	for (const [keystroke, toolId] of Object.entries(bindings ?? {})) {
		normalizedBindings[normalizePaletteKeystroke(keystroke)] = toolId
	}

	return {
		get bindings() {
			return normalizedBindings
		},
		findByTool(toolId: string) {
			return Object.entries(normalizedBindings)
				.filter(([, bindingToolId]) => bindingToolId === toolId)
				.map(([keystroke]) => keystroke)
		},
		resolve(event: KeyboardEvent) {
			const keystroke = paletteKeystrokeFromEvent(event)
			return normalizedBindings[keystroke]
		},
	}
}
