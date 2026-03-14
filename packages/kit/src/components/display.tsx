import type { Env } from '@sursaut/core'
import { collapse } from '@sursaut/core'
import { DISPLAY_KEY, type DisplayContext, useDisplayContext } from '../display.js'

export type { DisplayContext } from '../display.js'
export { useDisplayContext } from '../display.js'

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
	const parent = useDisplayContext(env)
	const p = {
		get theme() {
			return collapse(props.theme)
		},
		get direction() {
			return collapse(props.direction)
		},
		get locale() {
			return collapse(props.locale)
		},
		get timeZone() {
			return collapse(props.timeZone)
		},
	}

	function resolveTheme(): string {
		const setting = p.theme ?? 'auto'
		if (setting !== 'auto') return setting
		return parent.theme
	}

	function resolveDirection(): 'ltr' | 'rtl' {
		const dir = p.direction ?? 'auto'
		if (dir !== 'auto') return dir
		return parent.direction
	}

	function resolveLocale(): string {
		const loc = p.locale ?? 'auto'
		if (loc !== 'auto') return loc
		return parent.locale
	}

	function resolveTimeZone(): string {
		const tz = p.timeZone ?? 'auto'
		if (tz !== 'auto') return tz
		return parent.timeZone
	}

	const context: DisplayContext = {
		get theme() {
			return resolveTheme()
		},
		get direction() {
			return resolveDirection()
		},
		get locale() {
			return resolveLocale()
		},
		get timeZone() {
			return resolveTimeZone()
		},
	}

	env[DISPLAY_KEY] = context

	return (
		<div
			class="sursaut-display-provider"
			data-theme={context.theme}
			dir={context.direction}
			lang={context.locale}
		>
			{props.children}
		</div>
	)
}
