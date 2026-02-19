import { Date as IntlDate, type IntlDateProps } from './date'
import { List as IntlList, type IntlListProps } from './list'
import { Number as IntlNumber, type IntlNumberProps } from './number'

type IntlValue = Date | number | string | Array<string>

export type IntlProps = {
	value: IntlValue
} & (IntlDateProps | IntlNumberProps | IntlListProps)

export function Intl(props: IntlProps) {
	const { value } = props

	if (value instanceof globalThis.Date) {
		return <IntlDate {...(props as IntlDateProps)} value={value} />
	}

	if (typeof value === 'number') {
		return <IntlNumber {...(props as IntlNumberProps)} value={value} />
	}

	if (Array.isArray(value)) {
		return <IntlList {...(props as IntlListProps)} value={value} />
	}

	// Attempt to parse string as date if it looks like one, or just render string?
	// For now, if string, maybe try date if props hint at it, or just return value.
	// But since this is a specific Intl component, let's assume if it is a string it might be an ISO date.
	if (typeof value === 'string') {
		const d = new globalThis.Date(value)
		if (!isNaN(d.getTime())) {
			return <IntlDate {...(props as IntlDateProps)} value={d} />
		}
		return value
	}

	return null
}
