import { lift, reactive } from 'mutts'

export type PaletteKeystroke = string

export type PaletteKeyBindingTarget =
	| {
			readonly kind: 'intent'
			readonly intentId: string
	  }
	| {
			readonly kind: 'entry'
			readonly entryId: string
	  }

export type PaletteKeyBinding = PaletteKeyBindingTarget & {
	readonly keystroke: PaletteKeystroke
}

export interface PaletteKeys {
	readonly bindings: readonly PaletteKeyBinding[]
	findByKeystroke(keystroke: PaletteKeystroke): readonly PaletteKeyBinding[]
	findByIntent(intentId: string): readonly PaletteKeyBinding[]
	findByEntry(entryId: string): readonly PaletteKeyBinding[]
	getIntentKeystroke(intentId: string): PaletteKeystroke | undefined
	getEntryKeystroke(entryId: string): PaletteKeystroke | undefined
	bind(binding: PaletteKeyBinding): void
	unbindKeystroke(keystroke: PaletteKeystroke): void
	unbindIntent(intentId: string): void
	unbindEntry(entryId: string): void
	rebindIntent(intentId: string, keystroke: PaletteKeystroke): void
	rebindEntry(entryId: string, keystroke: PaletteKeystroke): void
	resolve(event: KeyboardEvent): readonly PaletteKeyBinding[]
}

function normalizeKeyName(key: string): string {
	if (key === ' ') return 'Space'
	const lowered = key.toLowerCase()
	switch (lowered) {
		case 'ctrl':
		case 'control':
			return 'Ctrl'
		case 'meta':
		case 'cmd':
		case 'command':
		case 'super':
			return 'Meta'
		case 'alt':
		case 'option':
			return 'Alt'
		case 'shift':
			return 'Shift'
		case 'esc':
			return 'Escape'
		case 'spacebar':
			return 'Space'
		default:
			if (lowered.length === 1) return lowered.toUpperCase()
			return lowered.charAt(0).toUpperCase() + lowered.slice(1)
	}
}

const MODIFIER_ORDER = ['Ctrl', 'Meta', 'Alt', 'Shift'] as const

function joinKeystroke(modifiers: readonly string[], key: string): PaletteKeystroke {
	return [...modifiers, key].join('+')
}

export function parseKeystroke(value: string): PaletteKeystroke {
	const parts = value
		.split('+')
		.map((part) => normalizeKeyName(part.trim()))
		.filter(Boolean)
	if (parts.length === 0) return ''
	const key = parts[parts.length - 1]
	const modifiers = MODIFIER_ORDER.filter((modifier) => parts.slice(0, -1).includes(modifier))
	return joinKeystroke(modifiers, key)
}

export function normalizeKeystroke(event: KeyboardEvent): PaletteKeystroke {
	const modifiers = MODIFIER_ORDER.filter((modifier) => {
		switch (modifier) {
			case 'Ctrl':
				return event.ctrlKey
			case 'Meta':
				return event.metaKey
			case 'Alt':
				return event.altKey
			case 'Shift':
				return event.shiftKey
		}
	})
	return joinKeystroke(modifiers, normalizeKeyName(event.key))
}

export function formatKeystroke(keystroke: PaletteKeystroke | undefined): string | undefined {
	if (!keystroke) return undefined
	return parseKeystroke(keystroke)
}

function sameTarget(left: PaletteKeyBinding, right: PaletteKeyBinding): boolean {
	if (left.kind !== right.kind) return false
	return left.kind === 'intent'
		? left.intentId === (right as Extract<PaletteKeyBinding, { kind: 'intent' }>).intentId
		: left.entryId === (right as Extract<PaletteKeyBinding, { kind: 'entry' }>).entryId
}

export function createPaletteKeys(bindings?: readonly PaletteKeyBinding[]): PaletteKeys {
	const state = reactive<{ bindings: PaletteKeyBinding[] }>({
		bindings: [...(bindings ?? [])].map((binding) => ({
			...binding,
			keystroke: parseKeystroke(binding.keystroke),
		})),
	})

	const byKeystroke = (keystroke: PaletteKeystroke) =>
		lift`paletteKeys.byKeystroke`(() => {
			const normalized = parseKeystroke(keystroke)
			return state.bindings.filter((binding) => binding.keystroke === normalized)
		})

	const byIntent = (intentId: string) =>
		lift`paletteKeys.byIntent`(() =>
			state.bindings.filter((binding) => binding.kind === 'intent' && binding.intentId === intentId)
		)

	const byEntry = (entryId: string) =>
		lift`paletteKeys.byEntry`(() =>
			state.bindings.filter((binding) => binding.kind === 'entry' && binding.entryId === entryId)
		)

	function replace(next: readonly PaletteKeyBinding[]) {
		state.bindings = [...next]
	}

	return {
		get bindings() {
			return state.bindings
		},
		findByKeystroke(keystroke: PaletteKeystroke) {
			return byKeystroke(keystroke)
		},
		findByIntent(intentId: string) {
			return byIntent(intentId)
		},
		findByEntry(entryId: string) {
			return byEntry(entryId)
		},
		getIntentKeystroke(intentId: string) {
			return this.findByIntent(intentId)[0]?.keystroke
		},
		getEntryKeystroke(entryId: string) {
			return this.findByEntry(entryId)[0]?.keystroke
		},
		bind(binding: PaletteKeyBinding) {
			const normalized = { ...binding, keystroke: parseKeystroke(binding.keystroke) }
			const existing = state.bindings.filter(
				(candidate) =>
					candidate.keystroke === normalized.keystroke && !sameTarget(candidate, normalized)
			)
			replace([
				...existing,
				...state.bindings.filter((candidate) => !sameTarget(candidate, normalized)),
				normalized,
			])
		},
		unbindKeystroke(keystroke: PaletteKeystroke) {
			const normalized = parseKeystroke(keystroke)
			replace(state.bindings.filter((binding) => binding.keystroke !== normalized))
		},
		unbindIntent(intentId: string) {
			replace(
				state.bindings.filter(
					(binding) => binding.kind !== 'intent' || binding.intentId !== intentId
				)
			)
		},
		unbindEntry(entryId: string) {
			replace(
				state.bindings.filter((binding) => binding.kind !== 'entry' || binding.entryId !== entryId)
			)
		},
		rebindIntent(intentId: string, keystroke: PaletteKeystroke) {
			this.unbindIntent(intentId)
			this.bind({ kind: 'intent', intentId, keystroke })
		},
		rebindEntry(entryId: string, keystroke: PaletteKeystroke) {
			this.unbindEntry(entryId)
			this.bind({ kind: 'entry', entryId, keystroke })
		},
		resolve(event: KeyboardEvent) {
			return this.findByKeystroke(normalizeKeystroke(event))
		},
	}
}
