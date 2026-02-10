import { cachedDisplayNames } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.DisplayNames>`. Extends all `Intl.DisplayNamesOptions`. */
export interface IntlDisplayNamesProps extends Intl.DisplayNamesOptions {
	value: string
	locale?: string
}

/** Resolves a code to its display name (e.g. "fr" → "French"). Returns a text node. */
export function DisplayNames(props: IntlDisplayNamesProps) {
	const { value, locale, ...options } = props
	const fmt = cachedDisplayNames(resolveLocale(locale), options)
	return fmt.of(value) ?? value
}
