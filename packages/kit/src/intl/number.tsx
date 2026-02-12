import { cachedNumberFormat } from './cache'
import { resolveLocale } from './locale'
import { document } from '@pounce/core'

/** Props for `<Intl.Number>`. Extends all `Intl.NumberFormatOptions`. */
export interface IntlNumberProps extends Intl.NumberFormatOptions {
	value: number | bigint
	locale?: string
}

/** Formats a number according to locale. Returns a text node. */
export function Number(props: IntlNumberProps) {
	const { value, locale, ...options } = props
	const fmt = cachedNumberFormat(resolveLocale(locale), options)
	return <>{fmt.format(value)}</>
}
