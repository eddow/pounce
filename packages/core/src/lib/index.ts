import { effect, type ScopedCallback } from 'mutts'
import { document } from '../shared'
import { testing } from './debug'
import { bindChildren, type Child, type Component, Fragment, h, render, rootScope, type Scope } from './renderer'

function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

function isString(value: any): value is string {
	return typeof value === 'string'
}

export { bindChildren, Fragment, h, rootScope, type Scope, type Child, type Component }

export * from './utils'
export * from './platform'
export * from '../shared'

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
		stop = effect(() => bindChildren(appElement, render(app, scope)))
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', actuallyBind)
	} else {
		actuallyBind()
	}
	return () => stop?.()
}
