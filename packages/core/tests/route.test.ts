import { test, expect } from '@playwright/test'
import { buildRoute, matchRoute, parseRoute, routeMatcher } from '../../toolbox/src/router/logic.js'

test.describe('parseRoute', () => {
	test('parses literal path', () => {
		const result = parseRoute('/users')
		expect(result.path).toEqual([{ kind: 'literal', value: 'users' }])
		expect(result.query).toEqual([])
	})

	test('parses dynamic path segment', () => {
		const result = parseRoute('/users/[id]')
		expect(result.path).toEqual([
			{ kind: 'literal', value: 'users' },
			{ kind: 'param', name: 'id', format: 'string' },
		])
	})

	test('parses path segment with format', () => {
		const result = parseRoute('/users/[id:uuid]')
		expect(result.path[1]).toEqual({ kind: 'param', name: 'id', format: 'uuid' })
	})

	test('parses catch-all segment', () => {
		const result = parseRoute('/docs/[...slug]')
		expect(result.path).toEqual([
			{ kind: 'literal', value: 'docs' },
			{ kind: 'catchAll', name: 'slug' },
		])
	})

	test('parses query parameters', () => {
		const result = parseRoute('/search?q=[query]&page=[page:integer?]')
		expect(result.query).toEqual([
			{ key: 'q', name: 'query', format: 'string', optional: false },
			{ key: 'page', name: 'page', format: 'integer', optional: true },
		])
	})
})

test.describe('matchRoute', () => {
	test('matches literal routes', () => {
		const routes = [{ path: '/users' }]
		const result = matchRoute('/users', routes)
		expect(result).not.toBeNull()
		expect(result?.params).toEqual({})
	})

	test('extracts path parameters', () => {
		const routes = [{ path: '/users/[userId:integer]' }]
		const result = matchRoute('/users/42', routes)
		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ userId: '42' })
	})

	test('requires format to match', () => {
		const routes = [{ path: '/users/[userId:integer]' }]
		expect(matchRoute('/users/not-a-number', routes)).toBeNull()
	})

	test('extracts query parameters', () => {
		const routes = [{ path: '/search?term=[term]&page=[page:integer?]' }]
		const result = matchRoute('/search?term=hello', routes)
		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ term: 'hello' })
	})

	test('returns unused path portions', () => {
		const routes = [{ path: '/docs/[section]?term=[term?]' }]
		const result = matchRoute('/docs/api/reference?filter=beta#intro', routes)
		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ section: 'api' })
		expect(result?.unusedPath).toBe('/reference?filter=beta#intro')
	})

	test('matches catch-all routes', () => {
		const routes = [{ path: '/docs/[...slug]' }]
		const result = matchRoute('/docs/api/users/create', routes)
		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ slug: 'api/users/create' })
	})

	test('handles UUID format', () => {
		const routes = [{ path: '/items/[id:uuid]' }]
		expect(matchRoute('/items/123e4567-e89b-12d3-a456-426614174000', routes)).not.toBeNull()
		expect(matchRoute('/items/not-a-uuid', routes)).toBeNull()
	})
})

test.describe('routeMatcher', () => {
	test('returns a reusable matcher function', () => {
		const routes = [{ path: '/users/[userId:integer]' }, { path: '/search' }]
		const matcher = routeMatcher(routes)

		const result = matcher('/users/101')
		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ userId: '101' })
	})

	test('returns null for non-matching routes', () => {
		const matcher = routeMatcher([{ path: '/health' }])
		expect(matcher('/missing')).toBeNull()
	})
})

test.describe('buildRoute', () => {
	test('builds path with parameters', () => {
		expect(buildRoute('/users/[userId]', { userId: '42' })).toBe('/users/42')
	})

	test('builds query string', () => {
		expect(buildRoute('/search?term=[term]&page=[page:integer?]', { term: 'hello', page: '2' })).toBe(
			'/search?term=hello&page=2'
		)
	})

	test('omits optional query parameters when missing', () => {
		expect(buildRoute('/search?term=[term]&page=[page:integer?]', { term: 'hello' })).toBe(
			'/search?term=hello'
		)
	})

	test('encodes parameter values', () => {
		expect(buildRoute('/docs/[section]', { section: 'API Specs' })).toBe('/docs/API%20Specs')
	})

	test('appends unused path', () => {
		expect(buildRoute('/docs/[section]', { section: 'api' }, '/reference#intro')).toBe(
			'/docs/api/reference#intro'
		)
	})

	test('throws for missing required path parameter', () => {
		expect(() => buildRoute('/users/[userId]', {})).toThrow('Missing value for path parameter: userId')
	})

	test('throws for missing required query parameter', () => {
		expect(() => buildRoute('/search?term=[term]', {})).toThrow(
			'Missing value for query parameter: term'
		)
	})
})

test.describe('Unicode and special characters', () => {
	test('handles Unicode in path', () => {
		const routes = [{ path: '/users/[name]' }]
		const result = matchRoute('/users/%E6%97%A5%E6%9C%AC', routes)
		expect(result?.params).toEqual({ name: '日本' })
	})

	test('handles special chars in query', () => {
		const routes = [{ path: '/search?q=[query]' }]
		const result = matchRoute('/search?q=foo%26bar', routes)
		expect(result?.params).toEqual({ query: 'foo&bar' })
	})

	test('encodes Unicode when building', () => {
		expect(buildRoute('/users/[name]', { name: '日本' })).toBe('/users/%E6%97%A5%E6%9C%AC')
	})
})
