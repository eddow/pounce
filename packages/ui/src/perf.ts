/**
 * Performance instrumentation for @pounce/ui
 * Provides performance API when enabled in development
 */

declare global {
	interface ImportMeta {
		env?: { DEV?: boolean; NODE_ENV?: string }
	}
}

const enabled = 
	(typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
	(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined
