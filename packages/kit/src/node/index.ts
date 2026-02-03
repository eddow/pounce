// Node Entry Point - exports everything from shared index plus Node-specific items
export * from '../index.js'
export * from './api.js'
export * from './client.js'
export * as serverRouter from './router.js'
export * from './ssr.js'

// Stub exports for DOM-only functions - these are no-ops in non-DOM environments
export function css(_strings: TemplateStringsArray, ..._values: any[]): void {
	// No-op in non-DOM environment
}

export function sass(_strings: TemplateStringsArray, ..._values: any[]): void {
	// No-op in non-DOM environment
}

export function scss(_strings: TemplateStringsArray, ..._values: any[]): void {
	// No-op in non-DOM environment
}
