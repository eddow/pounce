import { document, PounceElement } from '@pounce/core'
import { effect } from 'mutts'
import { cachedNumberFormat } from './cache'
import { resolveLocale } from './locale'

/** Props for `<Intl.Number>`. Extends all `Intl.NumberFormatOptions`. */
export interface IntlNumberProps extends Intl.NumberFormatOptions {
	value: number | bigint
	locale?: string
}

/** Formats a number according to locale. Returns a text node. */
export function Number(props: IntlNumberProps) {
	return new PounceElement(() => {
		let node: Text | undefined
		effect.named('number.intl')(() => {
			const txt = cachedNumberFormat(resolveLocale(props.locale), props).format(props.value)
			if (node) node.data = txt
			else node = document.createTextNode(txt)
		})
		return node!
	})
}
