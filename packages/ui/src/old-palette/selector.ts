import type { PaletteEnumSelector, PaletteKeywordQuery, PaletteKeywordSource } from './types'

function normalizeKeyword(keyword: string): string {
	return keyword.trim().toLowerCase()
}

export function normalizeKeywords(keywords: readonly string[] | undefined): readonly string[] {
	if (!keywords?.length) return []
	return Array.from(
		new Set(keywords.map(normalizeKeyword).filter((keyword) => keyword.length > 0))
	).sort()
}

export function splitIdKeywords(id: string): readonly string[] {
	return normalizeKeywords(id.split('.'))
}

export function getKeywordSourceKeywords(source: PaletteKeywordSource): readonly string[] {
	return normalizeKeywords([...(source.keywords ?? []), ...splitIdKeywords(source.id)])
}

export function matchesKeywordQuery(
	source: PaletteKeywordSource,
	query: PaletteKeywordQuery | undefined
): boolean {
	if (!query) return true
	const expected = normalizeKeywords(query.keywords)
	if (expected.length === 0) return true
	const actual = getKeywordSourceKeywords(source)
	return expected.every((keyword) => actual.includes(keyword))
}

export function normalizeEnumSelector(
	selector: PaletteEnumSelector | undefined
): PaletteEnumSelector | undefined {
	if (selector === undefined) return undefined
	if (typeof selector === 'string') return selector
	return normalizeKeywords(selector)
}

export function getEnumSelectorKey(selector: PaletteEnumSelector | undefined): string {
	const normalized = normalizeEnumSelector(selector)
	if (normalized === undefined) return ''
	if (typeof normalized === 'string') return `id:${normalized}`
	return `keywords:${normalized.join('|')}`
}

export function matchesEnumSelector(
	source: PaletteKeywordSource,
	selector: PaletteEnumSelector | undefined
): boolean {
	if (selector === undefined) return true
	if (typeof selector === 'string') return source.id === selector
	return matchesKeywordQuery(source, { keywords: selector })
}
