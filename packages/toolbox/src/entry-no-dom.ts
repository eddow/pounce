export * from './no-dom/index.js'
export * from './router/components.js'
export * from './ssr/utils.js'
export * from './router/defs.js'
export * from './api/core.js'
export * as serverRouter from './router/node-router.js'

// Stub exports for DOM-only functions - these are no-ops in non-DOM environments
// This allows importing css from @pounce/toolbox without needing to specify entry-dom
// The Vite plugin replaces these at build time for browser builds
export function css(strings: TemplateStringsArray, ...values: any[]): void {
	// No-op in non-DOM environment
}

export function sass(strings: TemplateStringsArray, ...values: any[]): void {
	// No-op in non-DOM environment
}

export function scss(strings: TemplateStringsArray, ...values: any[]): void {
	// No-op in non-DOM environment
}
