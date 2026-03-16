import { reactive } from 'mutts'
import type {
	PaletteBooleanDefinition,
	PaletteEnumDefinition,
	PaletteEnumOption,
	PaletteModelLike,
	PaletteNumberDefinition,
	PaletteStatusDefinition,
} from './types'

type TestValues = Record<string, unknown>

export function createTestValues(initial: TestValues = {}): TestValues {
	return reactive({ ...initial })
}

export function booleanSchema(values: TestValues, key: string): PaletteBooleanDefinition {
	return {
		type: 'boolean',
		get: (_palette: PaletteModelLike) => Boolean(values[key]),
		set: (_palette: PaletteModelLike, value: boolean) => {
			values[key] = value
		},
	}
}

export function numberSchema(
	values: TestValues,
	key: string,
	options?: {
		min?: number
		max?: number
		step?: number
	}
): PaletteNumberDefinition {
	return {
		type: 'number',
		get: (_palette: PaletteModelLike) => {
			const value = values[key]
			return typeof value === 'number' ? value : 0
		},
		set: (_palette: PaletteModelLike, value: number) => {
			values[key] = value
		},
		min: options?.min,
		max: options?.max,
		step: options?.step,
	}
}

export function enumSchema(
	values: TestValues,
	key: string,
	options: readonly (string | PaletteEnumOption<string>)[]
): PaletteEnumDefinition<string> {
	const first = options[0]
	const fallback = typeof first === 'string' ? first : first?.id
	return {
		type: 'enum',
		get: (_palette: PaletteModelLike) => {
			const value = values[key]
			return typeof value === 'string' ? value : (fallback ?? '')
		},
		set: (_palette: PaletteModelLike, value: string) => {
			values[key] = value
		},
		options,
	}
}

export function statusSchema(values: TestValues, key: string): PaletteStatusDefinition {
	return {
		type: 'status',
		get: (_palette: PaletteModelLike) => values[key],
	}
}
