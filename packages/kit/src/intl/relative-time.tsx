import { cachedRelativeTimeFormat } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.RelativeTime>`. Extends all `Intl.RelativeTimeFormatOptions`. */
export interface IntlRelativeTimeProps extends Intl.RelativeTimeFormatOptions {
	value: number
	unit: Intl.RelativeTimeFormatUnit
	locale?: string
}

/** Formats a relative time (e.g. "3 days ago") according to locale. Returns a text node. */
export function RelativeTime(props: IntlRelativeTimeProps) {
	const { value, unit, locale, ...options } = props
	const fmt = cachedRelativeTimeFormat(resolveLocale(locale), options)
	return fmt.format(value, unit)
}
