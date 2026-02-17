/// <reference path="../types/jsx.d.ts" />
import { Fragment, h } from './jsx-factory'

// Singleton verification — detects dual-module hazard (e.g. bundled + external copies)
const GLOBAL_POUNCE_KEY = '__POUNCE_CORE_INSTANCE__'
// biome-ignore lint/suspicious/noExplicitAny: global scope detection across environments
const globalScope = (typeof globalThis !== 'undefined' ? globalThis : false) as any
if (globalScope) {
	const stamp = { version: '1.0.0', timestamp: Date.now() }
	if (globalScope[GLOBAL_POUNCE_KEY]) {
		const existing = globalScope[GLOBAL_POUNCE_KEY]
		throw new Error(
			`[Pounce] Multiple instances of @pounce/core detected!\n` +
				`First loaded: ${JSON.stringify(existing)}\n` +
				`This causes instanceof checks to fail (e.g. ReactiveProp). ` +
				`Ensure @pounce/core is fully externalized in library builds.`
		)
	}
	globalScope[GLOBAL_POUNCE_KEY] = stamp
}

export * from '../shared'
export * from './composite-attributes'
export * from './debug'
export * from './jsx-factory'
export * from './platform'
export * from './pounce-element'
export * from './reconciler'
export {
	applyStyleProperties,
	checkComponentRebuild,
	isFunction,
	isNumber,
	isString,
	isSymbol,
	listen,
	setHtmlProperty,
} from './renderer-internal'
export { type StyleInput, styles } from './styles'
export * from './utils'

// biome-ignore lint/suspicious/noExplicitAny: Centralized global JSX injection for the framework
const g = globalThis as any
// TODO: either globalise all (h, r, c) or none
g.h = h
g.Fragment = Fragment
