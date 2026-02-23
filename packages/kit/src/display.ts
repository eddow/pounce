import type { Env } from '@pounce/core'
import { client } from './platform/shared.js'

/** Env key used by DisplayProvider to inject context */
export const DISPLAY_KEY = 'dc'

export type DisplayContext = {
	/** Resolved theme (never 'auto' — always the concrete value) */
	readonly theme: string
	/** Resolved text direction */
	readonly direction: 'ltr' | 'rtl'
	/** Resolved locale */
	readonly locale: string
	/** Resolved timeZone */
	readonly timeZone: string
}

const systemDisplayContext: DisplayContext = {
	get theme() {
		return client.prefersDark ? 'dark' : 'light'
	},
	get direction() {
		return client.direction ?? 'ltr'
	},
	get locale() {
		return client.language ?? 'en-US'
	},
	get timeZone() {
		return Intl.DateTimeFormat().resolvedOptions().timeZone
	},
}

/**
 * Read the current DisplayContext from env.
 * Falls back to system defaults (via client) if no DisplayProvider is present.
 */
export function useDisplayContext(env: Env): DisplayContext {
	return (env[DISPLAY_KEY] as DisplayContext) ?? systemDisplayContext
}
