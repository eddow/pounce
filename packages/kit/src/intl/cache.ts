/**
 * Cached Intl formatter constructors.
 * `Intl.*Format` constructors are expensive — caching by `(locale, options)` key avoids repeated allocation.
 */

function cacheKey(locale: string, options: object): string {
	return `${locale}\0${JSON.stringify(options)}`
}

function cached<T, O extends object>(
	factory: (locale: string, options: O) => T
): (locale: string, options: O) => T {
	const store = new Map<string, T>()
	return (locale: string, options: O): T => {
		const key = cacheKey(locale, options)
		let fmt = store.get(key)
		if (!fmt) {
			fmt = factory(locale, options)
			store.set(key, fmt)
		}
		return fmt
	}
}

/** Cached `Intl.NumberFormat` constructor. */
export const cachedNumberFormat = cached(
	(locale: string, options: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options)
)

/** Cached `Intl.DateTimeFormat` constructor. */
export const cachedDateTimeFormat = cached(
	(locale: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options)
)

/** Cached `Intl.RelativeTimeFormat` constructor. */
export const cachedRelativeTimeFormat = cached(
	(locale: string, options: Intl.RelativeTimeFormatOptions) =>
		new Intl.RelativeTimeFormat(locale, options)
)

/** Cached `Intl.ListFormat` constructor. */
export const cachedListFormat = cached(
	(locale: string, options: Intl.ListFormatOptions) => new Intl.ListFormat(locale, options)
)

/** Cached `Intl.PluralRules` constructor. */
export const cachedPluralRules = cached(
	(locale: string, options: Intl.PluralRulesOptions) => new Intl.PluralRules(locale, options)
)

/** Cached `Intl.DisplayNames` constructor. */
export const cachedDisplayNames = cached(
	(locale: string, options: Intl.DisplayNamesOptions) => new Intl.DisplayNames(locale, options)
)
