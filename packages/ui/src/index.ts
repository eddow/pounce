export const version = '1.0.0'
export * from './adapter/index'
export * from './components/button'
export * from './components/dockview'
export * from './components/error-boundary'
export * from './components/layout'
export * from './components/menu'
export * from './components/radiobutton'
export * from './components/toolbar'
export * from './components/typography'
export * from './directives/index'
export * from './shared/theme'
export * from './overlays/index'

/**
 * Initializes the UI library with vanilla defaults.
 * Optional if you are using the convention-based defaults, but recommended for explicit setup.
 */
export function vanilla() {
	// Currently getVariantClass fallbacks to vanilla by default.
	// This function can be used in the future for global vanilla-specific configuration.
	return true
}
