import { type Env, PounceElement } from '@pounce/core'
import { useDisplayContext } from './display'

const caches = new Map()
export function cachedIntl<T, O extends object>(
	factory: new (locale: string, options: O) => T
): (locale: string, options: O) => T {
	const cache = caches.get(factory)
	if (cache) return cache
	const store = new Map<string, T>()
	const rv = (locale: string, options: O): T => {
		const key = `${locale}\0${JSON.stringify(options)}`
		let fmt = store.get(key)
		if (!fmt) {
			fmt = new factory(locale, options)
			store.set(key, fmt)
		}
		return fmt
	}
	caches.set(factory, rv)
	return rv
}

/**
 * Resolve the effective locale: explicit prop > display context > client.language
 */
export function resolveLocale(env: Env, explicit?: string): string {
	return explicit ?? useDisplayContext(env).locale
}

// Number
/** Props for `<Intl.Number>`. Extends all `Intl.NumberFormatOptions`. */
export interface IntlNumberProps extends Intl.NumberFormatOptions {
	value: number | bigint
	locale?: string
}

/** Formats a number according to locale. Returns a text node. */
export function Number(props: IntlNumberProps, env: Env) {
	return PounceElement.text(() =>
		cachedIntl(globalThis.Intl.NumberFormat)(resolveLocale(env, props.locale), props).format(
			props.value
		)
	)
}

// Date
/** Props for `<Intl.Date>`. Extends all `Intl.DateTimeFormatOptions`. */
export interface IntlDateProps extends Intl.DateTimeFormatOptions {
	value: Date | number | string
	locale?: string
}

/** Formats a date/time according to locale. Returns a text node. */
export function Date(props: IntlDateProps, env: Env) {
	return PounceElement.text(() =>
		cachedIntl(globalThis.Intl.DateTimeFormat)(resolveLocale(env, props.locale), {
			...props,
			timeZone: props.timeZone ?? env.timeZone,
		}).format(
			props.value instanceof globalThis.Date ? props.value : new globalThis.Date(props.value)
		)
	)
}

// RelativeTime
/** Props for `<Intl.RelativeTime>`. Extends all `Intl.RelativeTimeFormatOptions`. */
export interface IntlRelativeTimeProps extends Intl.RelativeTimeFormatOptions {
	value: number
	unit: Intl.RelativeTimeFormatUnit
	locale?: string
}

/** Formats a relative time (e.g. "3 days ago") according to locale. Returns a text node. */
export function RelativeTime(props: IntlRelativeTimeProps, env: Env) {
	return PounceElement.text(() =>
		cachedIntl(globalThis.Intl.RelativeTimeFormat)(resolveLocale(env, props.locale), props).format(
			props.value,
			props.unit
		)
	)
}

// List
/** Props for `<Intl.List>`. Extends all `Intl.ListFormatOptions`. */
export interface IntlListProps extends Intl.ListFormatOptions {
	value: string[]
	locale?: string
}

/** Formats a list (e.g. "Alice, Bob, and Charlie") according to locale. Returns a text node. */
export function List(props: IntlListProps, env: Env) {
	return PounceElement.text(() =>
		cachedIntl(globalThis.Intl.ListFormat)(resolveLocale(env, props.locale), props).format(
			props.value
		)
	)
}

export interface IntlPluralCases {
	zero?: string | ((n: number) => string)
	one?: string | ((n: number) => string)
	two?: string | ((n: number) => string)
	few?: string | ((n: number) => string)
	many?: string | ((n: number) => string)
	other: string | ((n: number) => string)
}
// Plural
/** Props for `<Intl.Plural>`. Slot props (`one`, `other`, etc.) select content by CLDR plural category. */
export interface IntlPluralProps extends Intl.PluralRulesOptions, IntlPluralCases {
	value: number
	locale?: string
}

/** Selects JSX content based on the plural category of `value`. Returns a fragment. */
export function Plural(props: IntlPluralProps, env: Env) {
	return PounceElement.text(() => {
		const item =
			props[
				cachedIntl(globalThis.Intl.PluralRules)(resolveLocale(env, props.locale), props).select(
					props.value
				)
			] ?? props.other
		return typeof item === 'function' ? item(props.value) : item
	})
}

// DisplayNames
/** Props for `<Intl.DisplayNames>`. Extends all `Intl.DisplayNamesOptions`. */
export interface IntlDisplayNamesProps extends Intl.DisplayNamesOptions {
	value: string
	locale?: string
}

/** Resolves a code to its display name (e.g. "fr" → "French"). Returns a text node. */
export function DisplayNames(props: IntlDisplayNamesProps, env: Env) {
	return PounceElement.text(
		() =>
			cachedIntl(globalThis.Intl.DisplayNames)(resolveLocale(env, props.locale), props).of(
				props.value
			) ?? props.value
	)
}
