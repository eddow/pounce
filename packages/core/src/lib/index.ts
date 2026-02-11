/// <reference path="../types/jsx.d.ts" />
import { effect, type ScopedCallback } from 'mutts'
import { perf } from '../perf'
import { document } from '../shared'
import { testing } from './debug'
import { rootScope, type Scope } from './pounce-element'
import { bindChildren } from './reconciler'
import { h, Fragment } from './jsx-factory'
import { isFunction, isString } from './renderer-internal'

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
	let stop: ScopedCallback | undefined
	function actuallyBind() {
		perf?.mark('app:mount:start')
		const appElement = isString(container)
			? (document.querySelector(container) as HTMLElement)
			: isFunction(container)
				? container()
				: container
		if (!appElement) {
			console.error('App container not found')
			return
		}
		testing.renderingEvent?.('bind app root', appElement)
		perf?.mark('app:render:start')
		stop = effect(() => bindChildren(appElement, app.render(scope)))
		perf?.mark('app:render:end')
		perf?.measure('app:render', 'app:render:start', 'app:render:end')
		perf?.mark('app:mount:end')
		perf?.measure('app:mount', 'app:mount:start', 'app:mount:end')
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', actuallyBind)
	} else {
		actuallyBind()
	}
	return () => stop?.()
}
