import { setPlatformAPIs } from '../shared'

// Auto-execute bootstrap when this module is imported in a browser environment
if (typeof window === 'undefined') throw new Error('window is undefined')

setPlatformAPIs('DOM/Browser', {
	window,
	document,
	crypto,
})

// Re-export the core API
export * from '..'

import setGlobals from '../init'

setGlobals()
