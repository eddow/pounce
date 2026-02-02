// Node Entry Point - exports everything from shared index plus Node-specific items
export * from '../index.js'
export * from './client.js'
export * from './api.js'
export * as serverRouter from './router.js'
export { withSSR, withSSRSync } from '../ssr/utils.js'

// Stub exports for DOM-only functions - these are no-ops in non-DOM environments
export function css(strings: TemplateStringsArray, ...values: any[]): void {
	// No-op in non-DOM environment
}

export function sass(strings: TemplateStringsArray, ...values: any[]): void {
	// No-op in non-DOM environment
}

export function scss(strings: TemplateStringsArray, ...values: any[]): void {
	// No-op in non-DOM environment
}
