import type { Scope } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { client } from '@pounce/kit/dom'
import { reactive } from 'mutts'
import type { DisplayContext } from '../adapter/types'

componentStyle.sass`
.pounce-display-provider
	display: contents
`

/** Scope key used by DisplayProvider to inject context */
const DISPLAY_KEY = 'display'

/**
 * Default display context — uses kit's system values.
 * Returned when no DisplayProvider is in the ancestor chain.
 */
export const defaultDisplayContext: DisplayContext = {
	get theme() { return client.prefersDark ? 'dark' : 'light' },
	themeSetting: 'auto',
	get direction() { return client.direction ?? 'ltr' },
	get locale() { return client.language ?? 'en-US' },
	setTheme: () => {},
}

/**
 * Read the current DisplayContext from scope.
 * Falls back to system defaults if no DisplayProvider is present.
 */
export function useDisplayContext(scope: Scope): DisplayContext {
	return (scope[DISPLAY_KEY] as DisplayContext) ?? defaultDisplayContext
}

export type DisplayProviderProps = {
	/** Theme setting. 'auto' inherits from parent or system. Default: 'auto' */
	theme?: string | 'auto'
	/** Text direction. 'auto' inherits from parent or system. Default: 'auto' */
	direction?: 'ltr' | 'rtl' | 'auto'
	/** Locale. 'auto' inherits from parent or system. Default: 'auto' */
	locale?: string | 'auto'
	/** Called when theme setting changes (for persistence) */
	onThemeChange?: (theme: string) => void
	children?: JSX.Children
}

/**
 * Scope-based display context provider.
 *
 * Sets `data-theme`, `dir`, and `lang` on its own DOM element — never on `<html>`.
 * Supports nesting: child providers inherit from parent, overriding only specified axes.
 * All axes default to `'auto'` (inherit from parent, or system defaults at root).
 */
export function DisplayProvider(props: DisplayProviderProps, scope: Scope) {
	const parent = scope[DISPLAY_KEY] as DisplayContext | undefined

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

	const context: DisplayContext = {
		get theme() { return resolveTheme() },
		get themeSetting() { return state.themeSetting },
		get direction() { return resolveDirection() },
		get locale() { return resolveLocale() },
		setTheme(t: string) {
			state.themeSetting = t
			props.onThemeChange?.(t)
		},
	}

	scope[DISPLAY_KEY] = context

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
