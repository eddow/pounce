import { cachedDateTimeFormat } from './cache'
import { resolveLocale } from './locale'
import { document, type Scope } from '@pounce/core'

/** Props for `<Intl.Date>`. Extends all `Intl.DateTimeFormatOptions`. */
export interface IntlDateProps extends Intl.DateTimeFormatOptions {
	value: Date | number | string
	locale?: string
}

/** Formats a date/time according to locale. Returns a text node. */
export function Date(props: IntlDateProps, scope: Scope) {
	const { value, locale, ...options } = props

	const date = value instanceof globalThis.Date ? value : new globalThis.Date(value)
	const resolvedLocale = resolveLocale(locale || scope.locale)
	const timeZone = options.timeZone || scope.timeZone

	const fmt = cachedDateTimeFormat(resolvedLocale, { ...options, timeZone })
	return <>{fmt.format(date)}</>
}
