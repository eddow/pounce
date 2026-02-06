import type { ComponentName, FrameworkAdapter, UiComponents } from './types'
import { validateAdapter } from './validation'

let currentAdapter: FrameworkAdapter = { components: {} }
let isRendering = false

export function setAdapter(adapter: Partial<FrameworkAdapter>): void {
	if (isRendering) {
		throw new Error('[pounce/ui] setAdapter() must be called before component rendering.')
	}
	
	validateAdapter(adapter)
	
	currentAdapter = {
		iconFactory: adapter.iconFactory || currentAdapter.iconFactory,
		variants: { ...currentAdapter.variants, ...adapter.variants },
		transitions: adapter.transitions || currentAdapter.transitions,
		components: { ...currentAdapter.components, ...adapter.components }
	}
}

export function getAdapter<T extends ComponentName>(component: T): UiComponents[T] {
	isRendering = true
	return (currentAdapter.components?.[component] || {}) as UiComponents[T]
}

export function getGlobalAdapter(): Pick<FrameworkAdapter, 'iconFactory' | 'variants' | 'transitions'> {
	isRendering = true
	return {
		iconFactory: currentAdapter.iconFactory,
		variants: currentAdapter.variants,
		transitions: currentAdapter.transitions
	}
}

export function getGlobalVariants(): Record<string, string> | undefined {
	return currentAdapter.variants
}

export function resetAdapter(): void {
	currentAdapter = { components: {} }
	isRendering = false
}
