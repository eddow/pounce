/**
 * Test Intl formatting components — locale resolution, caching, and output
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { resolveLocale, setLocaleResolver } from './locale'
import {
	cachedNumberFormat,
	cachedDateTimeFormat,
	cachedRelativeTimeFormat,
	cachedListFormat,
	cachedPluralRules,
	cachedDisplayNames,
} from './cache'

describe('resolveLocale', () => {
	beforeEach(() => {
		setLocaleResolver(() => undefined)
	})

	it('returns explicit locale when provided', () => {
		expect(resolveLocale('fr-FR')).toBe('fr-FR')
	})

	it('falls back to client.language when no explicit or override', () => {
		const locale = resolveLocale()
		expect(typeof locale).toBe('string')
		expect(locale.length).toBeGreaterThan(0)
	})

	it('uses locale resolver override when set', () => {
		setLocaleResolver(() => 'ar-SA')
		expect(resolveLocale()).toBe('ar-SA')
	})

	it('explicit locale takes precedence over resolver', () => {
		setLocaleResolver(() => 'ar-SA')
		expect(resolveLocale('de-DE')).toBe('de-DE')
	})

	it('falls through when resolver returns undefined', () => {
		setLocaleResolver(() => undefined)
		const locale = resolveLocale()
		// Should fall back to client.language (en-US default)
		expect(locale).toBe('en-US')
	})
})

describe('cachedNumberFormat', () => {
	it('formats numbers correctly', () => {
		const fmt = cachedNumberFormat('en-US', {})
		expect(fmt.format(1234.56)).toBe('1,234.56')
	})

	it('returns the same instance for identical options', () => {
		const a = cachedNumberFormat('en-US', { style: 'currency', currency: 'USD' })
		const b = cachedNumberFormat('en-US', { style: 'currency', currency: 'USD' })
		expect(a).toBe(b)
	})

	it('returns different instances for different locales', () => {
		const a = cachedNumberFormat('en-US', {})
		const b = cachedNumberFormat('de-DE', {})
		expect(a).not.toBe(b)
	})

	it('formats currency', () => {
		const fmt = cachedNumberFormat('en-US', { style: 'currency', currency: 'EUR' })
		expect(fmt.format(42)).toContain('42')
		expect(fmt.format(42)).toContain('€')
	})

	it('formats percent', () => {
		const fmt = cachedNumberFormat('en-US', { style: 'percent' })
		expect(fmt.format(0.75)).toBe('75%')
	})
})

describe('cachedDateTimeFormat', () => {
	it('formats dates', () => {
		const fmt = cachedDateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
		const result = fmt.format(new Date(2026, 1, 9))
		expect(result).toContain('February')
		expect(result).toContain('2026')
	})

	it('caches identical formatters', () => {
		const opts: Intl.DateTimeFormatOptions = { dateStyle: 'short' }
		const a = cachedDateTimeFormat('en-US', opts)
		const b = cachedDateTimeFormat('en-US', opts)
		expect(a).toBe(b)
	})
})

describe('cachedRelativeTimeFormat', () => {
	it('formats relative time', () => {
		const fmt = cachedRelativeTimeFormat('en-US', {})
		expect(fmt.format(-3, 'day')).toContain('3 days ago')
	})

	it('formats future relative time', () => {
		const fmt = cachedRelativeTimeFormat('en-US', {})
		expect(fmt.format(2, 'hour')).toContain('in 2 hours')
	})
})

describe('cachedListFormat', () => {
	it('formats conjunction lists', () => {
		const fmt = cachedListFormat('en-US', { type: 'conjunction' })
		expect(fmt.format(['Alice', 'Bob', 'Charlie'])).toBe('Alice, Bob, and Charlie')
	})

	it('formats disjunction lists', () => {
		const fmt = cachedListFormat('en-US', { type: 'disjunction' })
		expect(fmt.format(['React', 'Vue', 'Svelte'])).toBe('React, Vue, or Svelte')
	})

	it('handles single item', () => {
		const fmt = cachedListFormat('en-US', { type: 'conjunction' })
		expect(fmt.format(['Alice'])).toBe('Alice')
	})

	it('handles empty list', () => {
		const fmt = cachedListFormat('en-US', { type: 'conjunction' })
		expect(fmt.format([])).toBe('')
	})
})

describe('cachedPluralRules', () => {
	it('selects correct plural category for English', () => {
		const rules = cachedPluralRules('en-US', {})
		expect(rules.select(0)).toBe('other')
		expect(rules.select(1)).toBe('one')
		expect(rules.select(2)).toBe('other')
		expect(rules.select(42)).toBe('other')
	})

	it('caches identical rules', () => {
		const a = cachedPluralRules('en-US', {})
		const b = cachedPluralRules('en-US', {})
		expect(a).toBe(b)
	})
})

describe('cachedDisplayNames', () => {
	it('resolves language names', () => {
		const fmt = cachedDisplayNames('en-US', { type: 'language' })
		expect(fmt.of('fr')).toBe('French')
		expect(fmt.of('de')).toBe('German')
	})

	it('resolves region names', () => {
		const fmt = cachedDisplayNames('en-US', { type: 'region' })
		expect(fmt.of('JP')).toBe('Japan')
		expect(fmt.of('FR')).toBe('France')
	})

	it('resolves currency names', () => {
		const fmt = cachedDisplayNames('en-US', { type: 'currency' })
		expect(fmt.of('EUR')).toBe('Euro')
		expect(fmt.of('USD')).toContain('Dollar')
	})
})
