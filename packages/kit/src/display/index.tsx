import type { Env } from '@pounce/core'

import { componentStyle } from '../dom/index'
import { client } from '../dom/index'
import { reactive } from 'mutts'

componentStyle.sass`
.pounce-display-provider
	display: contents
`

/** Env key used by DisplayProvider to inject context */
const DISPLAY_KEY = 'display'

/* TODO: review structure
 * - env should perhaps contain directly ltr/theme/locale/timezone/...
 * - perhaps in readonly, it's a good idea, though the DisplayContext should have a bunch of setters. The themeSetting "auto" should be in the setter object (who would have a theme-config: theme | 'auto') and let the theme be "parent-display-context. theme if 'auto'" - this "auto" shouldn't be in the env but in the communication between theme picker and display context
 * - I would definitively avoid `useView`, we can have a 1-way config by adding the `defaultDisplayContext` to rootenv in main.tsx, and have each displaycontext simply mimmic their env's prototype values (we cannot rely on the prototype chain to be completely reactive) when "auto" or no-config
 * Kit could also simply add the defaultDisplayContext to the rootenv in its loading process as rootEnv is a global common core-exported object
 * 
 * So, (Env it is then), the env provide read-only values. Env "override" them (by writing in its own env the value from the parent's one) - even if just copying the value if nothing is overriden - and Env provides a "settings" object who contains roughly the same but with "auto" (or "undefined) with get/set in order to plug in there configuration controls (like the theme toggle)
 */

export type DisplayContext = {
	/** Resolved theme (never 'auto' — always the concrete value) */
	readonly theme: string
	/** Raw theme setting ('auto' | 'light' | 'dark' | custom) */
	themeSetting: string
	/** Resolved text direction */
	readonly direction: 'ltr' | 'rtl'
	/** Resolved locale */
	readonly locale: string
	/** Resolved timeZone */
	readonly timeZone: string
}

/**
 * Default display context — uses kit's system values.
 * Returned when no DisplayProvider is in the ancestor chain.
 */
export const defaultDisplayContext: DisplayContext = {
	get theme() { return client.prefersDark ? 'dark' : 'light' },
	themeSetting: 'auto',
	get direction() { return client.direction ?? 'ltr' },
	get locale() { return client.language ?? 'en-US' },
	get timeZone() { return Intl.DateTimeFormat().resolvedOptions().timeZone },
}

/**
 * Read the current DisplayContext from env.
 * Falls back to system defaults if no DisplayProvider is present.
 */
export function useDisplayContext(env: Env): DisplayContext {
	return (env[DISPLAY_KEY] as DisplayContext) ?? defaultDisplayContext
}

export type DisplayProviderProps = {
	/** Theme setting. 'auto' inherits from parent or system. Default: 'auto' */
	theme?: string | 'auto'
	/** Text direction. 'auto' inherits from parent or system. Default: 'auto' */
	direction?: 'ltr' | 'rtl' | 'auto'
	/** Locale. 'auto' inherits from parent or system. Default: 'auto' */
	locale?: string | 'auto'
	/** Timezone. 'auto' inherits from parent or system. Default: 'auto' */
	timeZone?: string | 'auto'
	/** Called when theme setting changes (for persistence) */
	onThemeChange?: (theme: string) => void
	children?: any
}

/**
 * Env-based display context provider.
 *
 * Sets `data-theme`, `dir`, and `lang` on its own DOM element — never on `<html>`.
 * Supports nesting: child providers inherit from parent, overriding only specified axes.
 * All axes default to `'auto'` (inherit from parent, or system defaults at root).
 */
export function DisplayProvider(props: DisplayProviderProps, env: Env) {
	const parent = env[DISPLAY_KEY] as DisplayContext | undefined

	const state = reactive({ themeSetting: props.theme ?? 'auto' })

	function resolveTheme(): string {
		const setting = state.themeSetting
		if (setting !== 'auto') return setting
		if (parent) return parent.theme
		return client.prefersDark ? 'dark' : 'light'
	}

	function resolveDirection(): 'ltr' | 'rtl' {
		const dir = props.direction ?? 'auto'
		if (dir !== 'auto') return dir
		if (parent) return parent.direction
		return client.direction ?? 'ltr'
	}

	function resolveLocale(): string {
		const loc = props.locale ?? 'auto'
		if (loc !== 'auto') return loc
		if (parent) return parent.locale
		return client.language ?? 'en-US'
	}

	function resolveTimeZone(): string {
		const tz = props.timeZone ?? 'auto'
		if (tz !== 'auto') return tz
		if (parent) return parent.timeZone
		return Intl.DateTimeFormat().resolvedOptions().timeZone
	}

	const context: DisplayContext = {
		get theme() { return resolveTheme() },
		get themeSetting() { return state.themeSetting },
		set themeSetting(t: string) {
			state.themeSetting = t
			props.onThemeChange?.(t)
		},
		get direction() { return resolveDirection() },
		get locale() { return resolveLocale() },
		get timeZone() { return resolveTimeZone() },
	}

	env[DISPLAY_KEY] = context

	return (
		<div
			class="pounce-display-provider"
			data-theme={context.theme}
			dir={context.direction}
			lang={context.locale}
		>
			{props.children}
		</div>
	)
}
