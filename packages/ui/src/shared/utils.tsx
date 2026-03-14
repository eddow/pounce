import type { DisplayContext } from '@sursaut/kit'

/**
 * Wraps array children in a `<span>` so they form a single flex item (needed when CSS `order` is used).
 * Single elements and primitives are returned as-is.
 */
export function gather(children: JSX.Children): JSX.Element {
	return Array.isArray(children) ? <span>{children}</span> : (children as JSX.Element)
}

/** Generates a short random DOM-safe id string */
export function generateId(prefix = 'sursaut'): string {
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
