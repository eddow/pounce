import { cachedListFormat } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.List>`. Extends all `Intl.ListFormatOptions`. */
export interface IntlListProps extends Intl.ListFormatOptions {
	value: string[]
	locale?: string
}

/** Formats a list (e.g. "Alice, Bob, and Charlie") according to locale. Returns a text node. */
export function List(props: IntlListProps) {
	return <>{cachedListFormat(resolveLocale(props.locale), props).format(props.value)}</>
}
