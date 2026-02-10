import { setAdapter } from './adapter/registry'
import { vanillaAdapter } from './adapter/vanilla'

export const version = '1.0.0'
export * from './adapter/index'
export * from './components/accordion'
export * from './display/display-context'
export * from './display/theme-toggle'
export * from './components/button'
export * from './components/buttongroup'
export * from './components/card'
export * from './components/checkbutton'
export * from './components/dockview'
export * from './components/error-boundary'
export * from './components/forms'
export * from './components/icon'
export * from './components/infinite-scroll'
export * from './components/layout'
export * from './components/menu'
export * from './components/multiselect'
export * from './components/progress'
export * from './components/radiobutton'
export * from './components/stars'
export * from './components/status'
export * from './components/toolbar'
export * from './components/typography'
export * from './directives/index'
export * from './shared/theme'
export * from './shared/transitions'
export * from './overlays/index'

/**
 * Initializes the UI library with vanilla defaults.
 * Installs the vanilla adapter (standard variant traits + transition config).
 * 
 * Equivalent to `setAdapter(vanillaAdapter)`.
 */
export function vanilla() {
	setAdapter(vanillaAdapter)
}
