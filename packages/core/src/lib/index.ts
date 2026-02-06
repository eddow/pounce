import { effect, type ScopedCallback } from 'mutts'
import { document } from '../shared'
import { testing } from './debug'
import { rootScope, type Scope } from './pounce-element'
import { bindChildren } from './reconciler'
import { h, Fragment } from './jsx-factory'

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
export * from './variants'

// biome-ignore lint/suspicious/noExplicitAny: Centralized global JSX injection for the framework
const g = globalThis as any
g.h = h
g.Fragment = Fragment

function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

function isString(value: any): value is string {
	return typeof value === 'string'
}

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
