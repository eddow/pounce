import { flavored } from 'mutts'

// Node Entry Point - exports everything from shared index plus Node-specific items
export * from '../index.js'
export * from '../platform/index.js'
export * from './api.js'
export * as serverRouter from './router.js'
export * from './ssr.js'

// Stub exports for DOM-only functions - these are no-ops in non-DOM environments
// TODO: These SHOULD be taken into account for SSR!! Why don't we gather all the generated css ?
/* package.json: css/componentStyle/... SHOULD be defined in index.ts and execute something depending on the platform
			"@pounce/kit": [
				"../kit/src/--dom/--index.ts"
			],
*/
export function css(_strings: TemplateStringsArray, ..._values: unknown[]): void {}
export function sass(_strings: TemplateStringsArray, ..._values: unknown[]): void {}
export function scss(_strings: TemplateStringsArray, ..._values: unknown[]): void {}

// Stub componentStyle for Node environments
export const componentStyle = flavored(css, {
	css,
	sass,
	scss,
})