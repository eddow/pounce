import type { Env } from '@pounce/core'
import { cachedDateTimeFormat } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.Date>`. Extends all `Intl.DateTimeFormatOptions`. */
export interface IntlDateProps extends Intl.DateTimeFormatOptions {
	value: Date | number | string
	locale?: string
}

/** Formats a date/time according to locale. Returns a text node. */
export function Date(props: IntlDateProps, env: Env) {
	return (
		<>
			{cachedDateTimeFormat(resolveLocale(props.locale ?? env.locale), {
				...props,
				timeZone: props.timeZone ?? env.timeZone,
			}).format(
				props.value instanceof globalThis.Date ? props.value : new globalThis.Date(props.value)
			)}
		</>
	)
}
