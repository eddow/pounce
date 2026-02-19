import type { ComponentName, FrameworkAdapter, UiComponents } from './types'
import { validateAdapter } from './validation'

let currentAdapter: FrameworkAdapter = { components: {} }
let isRendering = false

export function setAdapter(...adapters: Partial<FrameworkAdapter>[]): void {
	if (isRendering) {
		throw new Error('[pounce/ui] setAdapter() must be called before component rendering.')
	}

	for (const adapter of adapters) {
		validateAdapter(adapter)

		currentAdapter = {
			...currentAdapter,
			...adapter,
			// Deep merge for variants and components (accumulative)
			variants: adapter.variants
				? { ...currentAdapter.variants, ...adapter.variants }
				: currentAdapter.variants,
			components: adapter.components
				? { ...currentAdapter.components, ...adapter.components }
				: currentAdapter.components,
		}
	}
}

export function getAdapter<T extends ComponentName>(component: T): UiComponents[T] {
	isRendering = true
	return (currentAdapter.components?.[component] || {}) as UiComponents[T]
}

export function getGlobalAdapter(): Pick<
	FrameworkAdapter,
	'iconFactory' | 'variants' | 'transitions'
> {
	isRendering = true
	return {
		iconFactory: currentAdapter.iconFactory,
		variants: currentAdapter.variants,
		transitions: currentAdapter.transitions,
	}
}

export function getGlobalVariants(): Record<string, JSX.GlobalHTMLAttributes> | undefined {
	return currentAdapter.variants
}

export function resetAdapter(): void {
	currentAdapter = { components: {} }
	isRendering = false
}
