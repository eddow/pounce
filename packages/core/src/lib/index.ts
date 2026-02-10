import { effect, type ScopedCallback } from 'mutts'
import { document } from '../shared'
import { testing } from './debug'
import { rootScope, type Scope } from './pounce-element'
import { bindChildren } from './reconciler'
import { h, Fragment } from './jsx-factory'
import { isFunction, isString } from './renderer-internal'

// Singleton verification — detects dual-module hazard (e.g. bundled + external copies)
const GLOBAL_POUNCE_KEY = '__POUNCE_CORE_INSTANCE__'
const globalScope = (
	typeof globalThis !== 'undefined'
		? globalThis
		: typeof window !== 'undefined'
			? window
			: typeof global !== 'undefined'
				? global
				: false
) as any
if (globalScope) {
	let source = '@pounce/core'
	try {
		if (typeof __filename !== 'undefined') source = __filename
		else {
			const viteEval = eval
			const meta = viteEval('import.meta')
			if (meta?.url) source = meta.url
		}
	} catch {
		// Fallback
	}

	const currentSourceInfo = { version: '1.0.0', source, timestamp: Date.now() }

	if (globalScope[GLOBAL_POUNCE_KEY]) {
		const existing = globalScope[GLOBAL_POUNCE_KEY]
		throw new Error(
			`[Pounce] Multiple instances of @pounce/core detected!\n` +
				`Existing: ${JSON.stringify(existing, null, 2)}\n` +
				`New: ${JSON.stringify(currentSourceInfo, null, 2)}\n` +
				`This causes instanceof checks to fail (e.g. ReactiveProp). ` +
				`Ensure @pounce/core is fully externalized in library builds ` +
				`(including /jsx-runtime and /jsx-dev-runtime subpaths).`
		)
	}
	globalScope[GLOBAL_POUNCE_KEY] = currentSourceInfo
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


// biome-ignore lint/suspicious/noExplicitAny: Centralized global JSX injection for the framework
const g = globalThis as any
g.h = h
g.Fragment = Fragment

/*export const render = (renderer: PounceElement, scope: Scope = rootScope) => {
	return renderer.render(scope)
}*/

export function bindApp(
	app: JSX.Element,
	container: string | HTMLElement | (() => HTMLElement) = '#app',
	scope: Scope = rootScope
) {
	let stop: ScopedCallback | undefined
	function actuallyBind() {
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
		stop = effect(() => bindChildren(appElement, app.render(scope)))
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', actuallyBind)
	} else {
		actuallyBind()
	}
	return () => stop?.()
}
