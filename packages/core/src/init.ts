import { Fragment, h } from './lib/jsx-factory'

const g = typeof globalThis !== 'undefined' ? globalThis : ({} as any)
g.h = h
g.Fragment = Fragment

const GLOBAL_POUNCE_KEY = '__POUNCE_CORE_INSTANCE__'
if (g[GLOBAL_POUNCE_KEY]) {
	const existing = g[GLOBAL_POUNCE_KEY]
	throw new Error(
		`[Pounce] Multiple instances of @pounce/core detected!\n` +
			`First loaded: ${JSON.stringify(existing)}\n` +
			`This causes instanceof checks to fail (e.g. ReactiveProp). ` +
			`Ensure @pounce/core is fully externalized in library builds.`
	)
}
g[GLOBAL_POUNCE_KEY] = { version: '1.0.0', timestamp: Date.now() }
