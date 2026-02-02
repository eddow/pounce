import * as shared from '../shared'

/**
 * Bootstraps the platform for the Browser/DOM environment.
 * Binds the global platform direct exports to native browser globals.
 */
export function bootstrap() {
	shared.setWindow(window as shared.PlatformWindow)
}

// Auto-execute bootstrap when this module is imported in a browser environment
if (typeof window !== 'undefined') {
	bootstrap()
}
