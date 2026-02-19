import type { DisplayContext } from '@pounce/kit'

/** Generates a short random DOM-safe id string */
export function generateId(prefix = 'pounce'): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export const isDev: boolean = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false

export type LogicalSide = 'start' | 'end' | 'left' | 'right'
export type PhysicalSide = 'left' | 'right'

export function relativeSide(dc: DisplayContext, side: LogicalSide = 'start'): PhysicalSide {
	if (side === 'left' || side === 'right') return side
	const direction = dc.direction === 'rtl' ? 'rtl' : 'ltr'
	if (side === 'end') return direction === 'rtl' ? 'left' : 'right'
	return direction === 'rtl' ? 'right' : 'left'
}
