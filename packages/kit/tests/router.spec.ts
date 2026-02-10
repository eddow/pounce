/**
 * Test routing logic and functionality
 */
import { afterEach, describe, expect, test } from 'vitest'
import { buildRoute, clearFormats, matchRoute, registerFormat, routeMatcher } from '../src/router/logic.js'

describe('matchRoute', () => {
	test('matches literal routes and extracts path parameters', () => {
		const definition = { path: '/users/[userId:integer]' }
		const result = matchRoute('/users/42', [definition])

		expect(result).not.toBeNull()
		expect(result?.definition).toBe(definition)
		expect(result?.definition).toBe(definition)
		expect(result?.params).toEqual({ userId: '42' })
		expect(result?.unusedPath).toBe('')
	})

	test('supports required and optional query parameters', () => {
		const definition = { path: '/search?term=[term]&page=[page:integer?]' }
		const result = matchRoute('/search?term=hello', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ term: 'hello' })
		expect(result?.unusedPath).toBe('')
	})

	test('requires parameter formats to match', () => {
		const definition = { path: '/users/[userId:integer]' }
		const result = matchRoute('/users/not-a-number', [definition])

		expect(result).toBeNull()
	})

	test('returns unused path, query, and hash portions', () => {
		const definition = { path: '/docs/[section]?term=[term?]' }
		const result = matchRoute('/docs/api/reference?filter=beta#intro', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ section: 'api' })
		expect(result?.unusedPath).toBe('/reference?filter=beta#intro')
	})
})

describe('routeMatcher', () => {
	test('returns a matching route specification', () => {
		const routes = [{ path: '/users/[userId:integer]' }, { path: '/search' }]
		const analyze = routeMatcher(routes)

		const spec = analyze('/users/101')

		expect(spec).not.toBeNull()
		expect(spec?.definition).toBe(routes[0])
		expect(spec?.params).toEqual({ userId: '101' })
		expect(spec?.unusedPath).toBe('')
	})

	test('returns null when no route matches the provided url', () => {
		const routes = [{ path: '/health' }]
		const analyze = routeMatcher(routes)

		expect(analyze('/missing')).toBeNull()
	})
})

describe('buildRoute', () => {
	test('builds path with parameters', () => {
		expect(buildRoute('/users/[userId]', { userId: '42' })).toBe('/users/42')
	})

	test('builds query string with required and optional params', () => {
		expect(
			buildRoute('/search?term=[term]&page=[page:integer?]', { term: 'hello', page: '2' })
		).toBe('/search?term=hello&page=2')
	})

	test('omits optional query parameters when missing', () => {
		expect(buildRoute('/search?term=[term]&page=[page:integer?]', { term: 'hello' })).toBe(
			'/search?term=hello'
		)
	})

	test('encodes parameter values', () => {
		expect(buildRoute('/docs/[section]', { section: 'API Specs' })).toBe('/docs/API%20Specs')
	})

	test('appends unused path portion', () => {
		expect(buildRoute('/docs/[section]', { section: 'api' }, '/reference#intro')).toBe(
			'/docs/api/reference#intro'
		)
	})

	test('throws when required path parameter missing', () => {
		expect(() => buildRoute('/users/[userId]', {})).toThrow(
			'Missing value for path parameter: userId'
		)
	})

	test('throws when required query parameter missing', () => {
		expect(() => buildRoute('/search?term=[term]', {} as any)).toThrow(
			'Missing value for query parameter: term'
		)
	})
})

describe('Edge Cases - Special Characters', () => {
	test('handles special characters in path parameters', () => {
		const definition = { path: '/files/[filename]' }
		const result = matchRoute('/files/my%20file.txt', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ filename: 'my file.txt' })
	})

	test('handles special characters in query parameters', () => {
		const definition = { path: '/search?q=[query]' }
		const result = matchRoute('/search?q=hello%20world', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ query: 'hello world' })
	})

	test('handles URL-encoded special characters', () => {
		const definition = { path: '/path/[param]' }
		const result = matchRoute('/path/test%2Fpath', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ param: 'test/path' })
	})

	test('handles ampersand in query values', () => {
		const definition = { path: '/search?q=[query]' }
		const result = matchRoute('/search?q=foo%26bar', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ query: 'foo&bar' })
	})

	test('handles plus signs in query parameters (space encoding)', () => {
		const definition = { path: '/search?q=[query]' }
		const result = matchRoute('/search?q=hello+world', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ query: 'hello world' })
	})

	test('handles hash in path segments', () => {
		const definition = { path: '/docs/[section]' }
		const result = matchRoute('/docs/api%23reference', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ section: 'api#reference' })
	})

	test('buildRoute encodes special characters correctly', () => {
		expect(buildRoute('/files/[name]', { name: 'file with spaces.txt' })).toBe(
			'/files/file%20with%20spaces.txt'
		)
		expect(buildRoute('/path/[param]', { param: 'test/path' })).toBe('/path/test%2Fpath')
		expect(buildRoute('/search?q=[query]', { query: 'foo&bar' })).toBe('/search?q=foo%26bar')
	})

	test('handles malformed URL encoding gracefully', () => {
		const definition = { path: '/path/[param]' }
		// % is not followed by valid hex digits
		const result = matchRoute('/path/test%', [definition])

		expect(result).not.toBeNull()
		// Should handle gracefully, may return as-is or decoded
		expect(result?.params.param).toBeDefined()
	})
})

describe('Unicode and Non-ASCII Characters', () => {
	test('handles Unicode characters in path parameters', () => {
		const definition = { path: '/users/[name]' }
		const result = matchRoute('/users/%E6%97%A5%E6%9C%AC', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ name: '日本' })
	})

	test('handles Unicode characters in query parameters', () => {
		const definition = { path: '/search?q=[query]' }
		const result = matchRoute('/search?q=%E6%97%A5%E6%9C%AC', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ query: '日本' })
	})

	test('handles emoji in path parameters', () => {
		const definition = { path: '/posts/[slug]' }
		const result = matchRoute('/posts/%F0%9F%8C%9F', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ slug: '🌟' })
	})

	test('handles Cyrillic characters', () => {
		const definition = { path: '/users/[name]' }
		const result = matchRoute('/users/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ name: 'Русский' })
	})

	test('handles Arabic characters', () => {
		const definition = { path: '/docs/[title]' }
		const result = matchRoute('/docs/%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ title: 'العربية' })
	})

	test('buildRoute encodes Unicode characters correctly', () => {
		expect(buildRoute('/users/[name]', { name: '日本' })).toBe('/users/%E6%97%A5%E6%9C%AC')
		expect(buildRoute('/posts/[slug]', { slug: '🌟' })).toBe('/posts/%F0%9F%8C%9F')
		expect(buildRoute('/docs/[title]', { title: 'Русский' })).toBe(
			'/docs/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9'
		)
	})

	test('handles mixed ASCII and Unicode', () => {
		const definition = { path: '/users/[name]' }
		const result = matchRoute('/users/John%20%E6%97%A5%E6%9C%AC', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ name: 'John 日本' })
	})
})

describe('Complex Nested Route Scenarios', () => {
	test('handles deeply nested paths', () => {
		const definition = { path: '/a/b/c/d/[param]' }
		const result = matchRoute('/a/b/c/d/value', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ param: 'value' })
		expect(result?.unusedPath).toBe('')
	})

	test('handles multiple path parameters', () => {
		const definition = { path: '/users/[userId]/posts/[postId]' }
		const result = matchRoute('/users/42/posts/123', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ userId: '42', postId: '123' })
	})

	test('handles multiple query parameters', () => {
		const definition = {
			path: '/search?q=[query]&page=[page:integer?]&sort=[sort?]',
		}
		const result = matchRoute('/search?q=test&page=1&sort=date', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ query: 'test', page: '1', sort: 'date' })
	})

	test('handles path and query parameters together', () => {
		const definition = { path: '/users/[userId]/posts?page=[page:integer?]' }
		const result = matchRoute('/users/42/posts?page=2', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ userId: '42', page: '2' })
	})

	test('handles routes with trailing unused segments', () => {
		const definition = { path: '/api/v1/[resource]' }
		const result = matchRoute('/api/v1/users/42/posts', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ resource: 'users' })
		expect(result?.unusedPath).toBe('/42/posts')
	})

	test('handles complex query strings with unused params', () => {
		const definition = { path: '/search?q=[query]&page=[page:integer?]' }
		const result = matchRoute('/search?q=test&page=1&filter=active&sort=date', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ query: 'test', page: '1' })
		expect(result?.unusedPath).toBe('?filter=active&sort=date')
	})

	test('handles routes with hash fragments', () => {
		const definition = { path: '/docs/[section]' }
		const result = matchRoute('/docs/api#introduction', [definition])

		expect(result).not.toBeNull()
		expect(result?.params).toEqual({ section: 'api' })
		expect(result?.unusedPath).toBe('#introduction')
	})

	test('handles multiple routes with different specificity', () => {
		const routes = [
			{ path: '/users/[userId]/posts/[postId]' },
			{ path: '/users/[userId]/posts' },
			{ path: '/users/[userId]' },
			{ path: '/users' },
		]

		// More specific route should match first
		const result1 = matchRoute('/users/42/posts/123', routes)
		expect(result1?.definition.path).toBe('/users/[userId]/posts/[postId]')

		const result2 = matchRoute('/users/42/posts', routes)
		expect(result2?.definition.path).toBe('/users/[userId]/posts')

		const result3 = matchRoute('/users/42', routes)
		expect(result3?.definition.path).toBe('/users/[userId]')

		const result4 = matchRoute('/users', routes)
		expect(result4?.definition.path).toBe('/users')
	})

	test('handles routes with same path length but different query params', () => {
		const routes = [
			{ path: '/search?q=[query]&page=[page:integer?]' },
			{ path: '/search?q=[query]' },
		]

		const result1 = matchRoute('/search?q=test&page=1', routes)
		expect(result1?.definition.path).toBe('/search?q=[query]&page=[page:integer?]')

		const result2 = matchRoute('/search?q=test', routes)
		// More specific route matches since optional params can be absent
		expect(result2?.definition.path).toBe('/search?q=[query]&page=[page:integer?]')
	})
})

describe('Performance - Large Route Tables', () => {
	test('handles large number of routes efficiently', () => {
		// Create 100 routes
		const routes = Array.from({ length: 100 }, (_, i) => ({
			path: `/route-${i}/[param]`,
		}))

		const matcher = routeMatcher(routes)
		const startTime = performance.now()

		// Test matching against all routes
		for (let i = 0; i < 100; i++) {
			const result = matcher(`/route-${i}/value`)
			expect(result).not.toBeNull()
			expect(result?.params.param).toBe('value')
		}

		const endTime = performance.now()
		const duration = endTime - startTime

		// Should complete in reasonable time (less than 100ms for 100 matches)
		expect(duration).toBeLessThan(100)
	})

	test('handles routes with many query parameters efficiently', () => {
		const definition = {
			path: '/search?a=[a]&b=[b]&c=[c]&d=[d]&e=[e]&f=[f]&g=[g]&h=[h]&i=[i]&j=[j]',
		}
		const routes = [definition]

		const startTime = performance.now()
		const result = matchRoute('/search?a=1&b=2&c=3&d=4&e=5&f=6&g=7&h=8&i=9&j=10', routes)
		const endTime = performance.now()

		expect(result).not.toBeNull()
		expect(endTime - startTime).toBeLessThan(10) // Should be very fast
	})

	test('handles deep path matching efficiently', () => {
		// Create route with 10 path segments
		const definition = {
			path: '/a/b/c/d/e/f/g/h/i/j/[param]',
		}
		const routes = [definition]

		const startTime = performance.now()
		const result = matchRoute('/a/b/c/d/e/f/g/h/i/j/value', routes)
		const endTime = performance.now()

		expect(result).not.toBeNull()
		expect(result?.params.param).toBe('value')
		expect(endTime - startTime).toBeLessThan(10)
	})

	test('routeMatcher is reusable and efficient', () => {
		const routes = Array.from({ length: 50 }, (_, i) => ({
			path: `/api/v1/resource-${i}/[id]`,
		}))

		const matcher = routeMatcher(routes)
		const startTime = performance.now()

		// Reuse the same matcher for multiple lookups
		for (let i = 0; i < 1000; i++) {
			const routeIndex = i % 50
			const result = matcher(`/api/v1/resource-${routeIndex}/123`)
			expect(result).not.toBeNull()
		}

		const endTime = performance.now()
		const duration = endTime - startTime

		// 1000 lookups should complete in reasonable time
		expect(duration).toBeLessThan(500)
	})
})

describe('Custom Format Registry', () => {
	afterEach(() => clearFormats())

	test('registerFormat adds a custom validator used by matchRoute', () => {
		registerFormat('slug', (v) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v))
		const routes = [{ path: '/posts/[slug:slug]' }]

		expect(matchRoute('/posts/hello-world', routes)).not.toBeNull()
		expect(matchRoute('/posts/hello-world', routes)?.params).toEqual({ slug: 'hello-world' })
		expect(matchRoute('/posts/UPPERCASE', routes)).toBeNull()
	})

	test('custom format is case-insensitive', () => {
		registerFormat('Hex', (v) => /^[0-9a-f]+$/i.test(v))
		const routes = [{ path: '/color/[code:hex]' }]

		expect(matchRoute('/color/ff00aa', routes)?.params).toEqual({ code: 'ff00aa' })
		expect(matchRoute('/color/FF00AA', routes)?.params).toEqual({ code: 'FF00AA' })
		expect(matchRoute('/color/xyz', routes)).toBeNull()
	})

	test('unregistered custom format throws on parse', () => {
		expect(() => matchRoute('/x', [{ path: '/[v:unknown_fmt]' }])).toThrow(
			'Unsupported route parameter format: unknown_fmt'
		)
	})

	test('clearFormats removes all custom formats', () => {
		registerFormat('slug', (v) => /^[a-z-]+$/.test(v))
		clearFormats()
		expect(() => matchRoute('/x', [{ path: '/[v:slug]' }])).toThrow(
			'Unsupported route parameter format: slug'
		)
	})

	test('custom format works in query parameters', () => {
		registerFormat('color', (v) => /^#[0-9a-f]{6}$/i.test(v))
		const routes = [{ path: '/theme?bg=[bg:color]' }]

		expect(matchRoute('/theme?bg=%23ff00aa', routes)?.params).toEqual({ bg: '#ff00aa' })
		expect(matchRoute('/theme?bg=red', routes)).toBeNull()
	})

	test('custom format works with routeMatcher', () => {
		registerFormat('semver', (v) => /^\d+\.\d+\.\d+$/.test(v))
		const matcher = routeMatcher([{ path: '/pkg/[version:semver]' }])

		expect(matcher('/pkg/1.2.3')?.params).toEqual({ version: '1.2.3' })
		expect(matcher('/pkg/latest')).toBeNull()
	})
})
