/** Generates a short random DOM-safe id string */
export function generateId(prefix = 'pounce'): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export const isDev: boolean = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false
