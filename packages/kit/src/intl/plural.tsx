import { cachedPluralRules } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.Plural>`. Slot props (`one`, `other`, etc.) select content by CLDR plural category. */
export interface IntlPluralProps extends Intl.PluralRulesOptions {
	value: number
	locale?: string
	zero?: JSX.Element
	one?: JSX.Element
	two?: JSX.Element
	few?: JSX.Element
	many?: JSX.Element
	other: JSX.Element
}

/** Selects JSX content based on the plural category of `value`. Returns a fragment. */
export function Plural(props: IntlPluralProps) {
	const { value, locale, zero, one, two, few, many, other, ...options } = props
	const rules = cachedPluralRules(resolveLocale(locale), options)
	const category = rules.select(value)
	const slots: Record<string, JSX.Element | undefined> = { zero, one, two, few, many, other }
	return <>{slots[category] ?? other}</>
}
