import type { Scope } from '@pounce/core'
import { rootScope } from '@pounce/core'

import { componentStyle } from '../dom/index'
import { client } from '../dom/index'

componentStyle.sass`
.pounce-env
	display: contents
`

// ─── Env defaults on rootScope ──────────────────────────────────

Object.defineProperties(rootScope, {
	theme: {
		get() { return client.prefersDark ? 'dark' : 'light' },
		enumerable: true,
		configurable: true,
	},
	locale: {
		get() { return client.language ?? 'en-US' },
		enumerable: true,
		configurable: true,
	},
	direction: {
		get() { return client.direction ?? 'ltr' },
		enumerable: true,
		configurable: true,
	},
	timeZone: {
		get() { return client.timezone ?? 'UTC' },
		enumerable: true,
		configurable: true,
	},
})

// ─── Types ──────────────────────────────────────────────────────

export type EnvSettings = {
	theme?: string | 'auto'
	direction?: 'ltr' | 'rtl' | 'auto'
	locale?: string | 'auto'
	timeZone?: string | 'auto'
}

export type EnvProps = {
	settings?: EnvSettings
	children?: any
}

// ─── Env component ──────────────────────────────────────────────

/**
 * Scope-based environment provider.
 *
 * Sets `data-theme`, `dir`, and `lang` on its own DOM element.
 * Supports nesting: child `Env` inherits from parent scope,
 * overriding only axes where `settings` specifies a concrete value.
 *
 * Usage:
 * ```tsx
 * const settings = reactive({ theme: 'auto' })
 * <Env settings={settings}>
 *   <App />
 * </Env>
 * ```
 */
export function Env(props: EnvProps, scope: Scope) {
	const settings = props.settings

	// The parent scope values live on the prototype chain.
	// We read them lazily so reactivity is preserved.
	const proto = Object.getPrototypeOf(scope)

	function parentValue(key: string): string {
		return proto[key]
	}

	function resolve<K extends keyof EnvSettings>(key: K): string {
		const v = settings?.[key]
		if (!v || v === 'auto') return parentValue(key)
		return v
	}

	Object.defineProperties(scope, {
		theme: {
			get() { return resolve('theme') },
			enumerable: true,
			configurable: true,
		},
		locale: {
			get() { return resolve('locale') },
			enumerable: true,
			configurable: true,
		},
		direction: {
			get() { return resolve('direction') },
			enumerable: true,
			configurable: true,
		},
		timeZone: {
			get() { return resolve('timeZone') },
			enumerable: true,
			configurable: true,
		},
	})

	return (
		<div
			class="pounce-env"
			data-theme={scope.theme}
			dir={scope.direction}
			lang={scope.locale}
		>
			{props.children}
		</div>
	)
}
