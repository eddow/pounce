import { cachedListFormat } from './cache'
import { resolveLocale } from './locale'
import { document } from '@pounce/core'

/** Props for `<Intl.List>`. Extends all `Intl.ListFormatOptions`. */
export interface IntlListProps extends Intl.ListFormatOptions {
	value: string[]
	locale?: string
}

/** Formats a list (e.g. "Alice, Bob, and Charlie") according to locale. Returns a text node. */
export function List(props: IntlListProps) {
	const { value, locale, ...options } = props
	const fmt = cachedListFormat(resolveLocale(locale), options)
	return <>{fmt.format(value)}</>
}
