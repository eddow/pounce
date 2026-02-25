import { cachedDisplayNames } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.DisplayNames>`. Extends all `Intl.DisplayNamesOptions`. */
export interface IntlDisplayNamesProps extends Intl.DisplayNamesOptions {
	value: string
	locale?: string
}

/** Resolves a code to its display name (e.g. "fr" → "French"). Returns a text node. */
export function DisplayNames(props: IntlDisplayNamesProps) {
	return (
		<>{cachedDisplayNames(resolveLocale(props.locale), props).of(props.value) ?? props.value}</>
	)
}
