/**
 * Performance instrumentation shim for @pounce/kit
 * Conditionally exports native Performance API in development
 */

const enabled =
	(typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ||
	(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined
