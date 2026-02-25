import { cachedPluralRules } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.Plural>`. Slot props (`one`, `other`, etc.) select content by CLDR plural category. */
export interface IntlPluralProps extends Intl.PluralRulesOptions {
	value: number
	locale?: string
	zero?: JSX.Element | string
	one?: JSX.Element | string
	two?: JSX.Element | string
	few?: JSX.Element | string
	many?: JSX.Element | string
	other: JSX.Element | string
}

/** Selects JSX content based on the plural category of `value`. Returns a fragment. */
export function Plural(props: IntlPluralProps) {
	const slots = () => ({
		zero: props.zero,
		one: props.one,
		two: props.two,
		few: props.few,
		many: props.many,
		other: props.other,
	})
	return (
		<>
			{slots()[cachedPluralRules(resolveLocale(props.locale), props).select(props.value)] ??
				props.other}
		</>
	)
}
