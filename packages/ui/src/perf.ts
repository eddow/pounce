/**
 * Performance instrumentation shim for @pounce/ui
 * Conditionally exports native Performance API in development
 */

// @ts-ignore - import.meta.env exists in Vite, process.env in Node
const enabled = 
	(typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ||
	(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined
