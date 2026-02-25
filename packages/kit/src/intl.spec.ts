/**
 * Test Intl formatting components — locale resolution, caching, and output
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { DisplayProvider } from './components'
import { cachedIntl, resolveLocale } from './intl'
import { setPlatform } from './platform/shared'
import { createTestAdapter } from './platform/test'

describe('resolveLocale', () => {
	let env: any = {}

	beforeEach(() => {
		env = {}
		setPlatform(createTestAdapter())
	})

	it('returns explicit locale when provided', () => {
		expect(resolveLocale(env, 'fr-FR')).toBe('fr-FR')
	})

	it('falls back to client.language when no explicit', () => {
		const locale = resolveLocale(env)
		expect(typeof locale).toBe('string')
		expect(locale.length).toBeGreaterThan(0)
	})

	it('uses DisplayProvider locale when set', () => {
		DisplayProvider({ locale: 'ar-SA' }, env)
		expect(resolveLocale(env)).toBe('ar-SA')
	})

	it('explicit locale takes precedence over DisplayProvider', () => {
		DisplayProvider({ locale: 'ar-SA' }, env)
		expect(resolveLocale(env, 'de-DE')).toBe('de-DE')
	})

	it('falls through when no DisplayProvider', () => {
		const locale = resolveLocale(env)
		// Should fall back to client.language (en-US default)
		expect(locale).toBe('en-US')
	})
})

describe('cachedNumberFormat', () => {
	it('formats numbers correctly', () => {
		const fmt = cachedIntl(globalThis.Intl.NumberFormat)('en-US', {})
		expect(fmt.format(1234.56)).toBe('1,234.56')
	})

	it('returns the same instance for identical options', () => {
		const a = cachedIntl(globalThis.Intl.NumberFormat)('en-US', {
			style: 'currency',
			currency: 'USD',
		})
		const b = cachedIntl(globalThis.Intl.NumberFormat)('en-US', {
			style: 'currency',
			currency: 'USD',
		})
		expect(a).toBe(b)
	})

	it('returns different instances for different locales', () => {
		const a = cachedIntl(globalThis.Intl.NumberFormat)('en-US', {})
		const b = cachedIntl(globalThis.Intl.NumberFormat)('de-DE', {})
		expect(a).not.toBe(b)
	})

	it('formats currency', () => {
		const fmt = cachedIntl(globalThis.Intl.NumberFormat)('en-US', {
			style: 'currency',
			currency: 'USD',
		})
		expect(fmt.format(1234.56)).toBe('$1,234.56')
	})

	it('formats percent', () => {
		const fmt = cachedIntl(globalThis.Intl.NumberFormat)('en-US', { style: 'percent' })
		expect(fmt.format(0.874)).toBe('87%')
	})
})

describe('cachedDateTimeFormat', () => {
	it('formats dates', () => {
		const fmt = cachedIntl(globalThis.Intl.DateTimeFormat)('en-US', { dateStyle: 'long' })
		const date = new globalThis.Date('2023-06-15T10:30:00Z')
		expect(fmt.format(date)).toBe('June 15, 2023')
	})

	it('caches identical formatters', () => {
		const a = cachedIntl(globalThis.Intl.DateTimeFormat)('en-US', { dateStyle: 'long' })
		const b = cachedIntl(globalThis.Intl.DateTimeFormat)('en-US', { dateStyle: 'long' })
		expect(a).toBe(b)
	})
})

describe('cachedRelativeTimeFormat', () => {
	it('formats relative time', () => {
		const fmt = cachedIntl(globalThis.Intl.RelativeTimeFormat)('en-US', { numeric: 'auto' })
		expect(fmt.format(-3, 'day')).toBe('3 days ago')
	})

	it('formats future relative time', () => {
		const fmt = cachedIntl(globalThis.Intl.RelativeTimeFormat)('en-US', { numeric: 'auto' })
		expect(fmt.format(3, 'day')).toBe('in 3 days')
	})
})

describe('cachedListFormat', () => {
	it('formats conjunction lists', () => {
		const fmt = cachedIntl(globalThis.Intl.ListFormat)('en-US', { type: 'conjunction' })
		expect(fmt.format(['apples', 'bananas', 'cherries'])).toBe('apples, bananas, and cherries')
	})

	it('formats disjunction lists', () => {
		const fmt = cachedIntl(globalThis.Intl.ListFormat)('en-US', { type: 'disjunction' })
		expect(fmt.format(['apples', 'bananas', 'cherries'])).toBe('apples, bananas, or cherries')
	})

	it('handles single item', () => {
		const fmt = cachedIntl(globalThis.Intl.ListFormat)('en-US', { type: 'conjunction' })
		expect(fmt.format(['Alice'])).toBe('Alice')
	})

	it('handles empty list', () => {
		const fmt = cachedIntl(globalThis.Intl.ListFormat)('en-US', { type: 'conjunction' })
		expect(fmt.format([])).toBe('')
	})
})

describe('cachedPluralRules', () => {
	it('selects correct plural category for English', () => {
		const rules = cachedIntl(globalThis.Intl.PluralRules)('en-US', {})
		expect(rules.select(0)).toBe('other')
		expect(rules.select(1)).toBe('one')
		expect(rules.select(2)).toBe('other')
		expect(rules.select(42)).toBe('other')
	})

	it('caches identical rules', () => {
		const a = cachedIntl(globalThis.Intl.PluralRules)('en-US', {})
		const b = cachedIntl(globalThis.Intl.PluralRules)('en-US', {})
		expect(a).toBe(b)
	})
})

describe('cachedDisplayNames', () => {
	it('resolves language names', () => {
		const fmt = cachedIntl(globalThis.Intl.DisplayNames)('en-US', { type: 'language' })
		expect(fmt.of('fr')).toBe('French')
		expect(fmt.of('de')).toBe('German')
	})

	it('resolves region names', () => {
		const fmt = cachedIntl(globalThis.Intl.DisplayNames)('en-US', { type: 'region' })
		expect(fmt.of('JP')).toBe('Japan')
		expect(fmt.of('FR')).toBe('France')
	})

	it('resolves currency names', () => {
		const fmt = cachedIntl(globalThis.Intl.DisplayNames)('en-US', { type: 'currency' })
		expect(fmt.of('EUR')).toBe('Euro')
		expect(fmt.of('USD')).toContain('Dollar')
	})
})
