/// <reference path="../types/jsx.d.ts" />
import { perf } from '../perf'
import { testing } from './debug'
import { rootScope, type Scope } from './pounce-element'
import { latch } from './reconciler'
import { h, Fragment } from './jsx-factory'
import { isFunction } from './renderer-internal'

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
				`Ensure @pounce/core is fully externalized in library builds ` +
				`(including /jsx-runtime and /jsx-dev-runtime subpaths).`
		)
	}
	globalScope[GLOBAL_POUNCE_KEY] = stamp
}

export * from '../shared'
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
	isObject,
	isString,
	isSymbol,
	listen,
	setHtmlProperty,
	valuedAttributeGetter,
} from './renderer-internal'
export * from './utils'
export * from './traits'
export type { NameSpacedProps } from './namespaced'
export type { StyleInput } from './styles'


// biome-ignore lint/suspicious/noExplicitAny: Centralized global JSX injection for the framework
const g = globalThis as any
g.h = h
g.Fragment = Fragment

export function bindApp(
	app: JSX.Element,
	container: string | HTMLElement | (() => HTMLElement) = '#app',
	scope: Scope = rootScope
) {
	const target = isFunction(container) ? container() : container
	perf?.mark('app:mount:start')
	testing.renderingEvent?.('latch app root', target)
	perf?.mark('app:render:start')
	const unlatch = latch(target as string | Element, app, scope)
	perf?.mark('app:render:end')
	perf?.measure('app:render', 'app:render:start', 'app:render:end')
	perf?.mark('app:mount:end')
	perf?.measure('app:mount', 'app:mount:start', 'app:mount:end')
	return unlatch
}
