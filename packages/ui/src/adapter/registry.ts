import type { ComponentAdapter, FrameworkAdapter } from './types'

let currentAdapter: FrameworkAdapter = {}
let isRendering = false

export function setAdapter(adapter: FrameworkAdapter): void {
	if (isRendering) {
		throw new Error('[pounce/ui] setAdapter() must be called before component rendering.')
	}
	currentAdapter = { ...currentAdapter, ...adapter }
}

export function getAdapter<T extends keyof FrameworkAdapter>(component: T): ComponentAdapter {
	isRendering = true
	return currentAdapter[component] || {}
}

export function __resetAdapter(): void {
	currentAdapter = {}
	isRendering = false
}
