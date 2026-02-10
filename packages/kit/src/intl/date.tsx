import { cachedDateTimeFormat } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.Date>`. Extends all `Intl.DateTimeFormatOptions`. */
export interface IntlDateProps extends Intl.DateTimeFormatOptions {
	value: Date | number | string
	locale?: string
}

/** Formats a date/time according to locale. Returns a text node. */
export function Date(props: IntlDateProps) {
	const { value, locale, ...options } = props
	const date = value instanceof globalThis.Date ? value : new globalThis.Date(value)
	const fmt = cachedDateTimeFormat(resolveLocale(locale), options)
	return fmt.format(date)
}
