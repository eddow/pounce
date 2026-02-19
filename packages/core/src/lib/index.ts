/// <reference path="../types/jsx.d.ts" />
import { Fragment, h } from './jsx-factory'

// Singleton verification — detects dual-module hazard (e.g. bundled + external copies)
const GLOBAL_POUNCE_KEY = '__POUNCE_CORE_INSTANCE__'
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

// TODO: either globalize all (h, r, c) or none
const g = globalThis as any
g.h = h
g.Fragment = Fragment
