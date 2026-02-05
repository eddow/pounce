import type { ComponentAdapter, ComponentName, FrameworkAdapter } from './types'

let currentAdapter: FrameworkAdapter = { components: {} }
let isRendering = false

export function setAdapter(adapter: FrameworkAdapter): void {
	if (isRendering) {
		throw new Error('[pounce/ui] setAdapter() must be called before component rendering.')
	}
	currentAdapter = {
		variants: { ...currentAdapter.variants, ...adapter.variants },
		components: { ...currentAdapter.components, ...adapter.components }
	}
}

export function getAdapter<T extends ComponentName>(component: T): ComponentAdapter {
	isRendering = true
	return currentAdapter.components?.[component] || {}
}

export function getGlobalVariants(): Record<string, string> | undefined {
	return currentAdapter.variants
}

export function resetAdapter(): void {
	currentAdapter = { components: {} }
	isRendering = false
}
