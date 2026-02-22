/**
 * Router component logic tests.
 * Tests the reactive matching + view selection without the full DOM rendering pipeline.
 */
import { describe, expect, test } from 'vitest'
import { matchRoute, routeMatcher } from './components'
import { linkModel } from './link-model'

describe('Router matchRoute wrapper', () => {
	const routes = [
		{ path: '/users/[id]' as const },
		{ path: '/posts/[...slug]' as const },
		{ path: '/' as const },
	]

	test('matches static route', () => {
		const result = matchRoute('/', routes)
		expect(result).not.toBeNull()
		expect(result!.definition.path).toBe('/')
		expect(result!.params).toEqual({})
		expect(result!.unusedPath).toBe('')
	})

	test('matches dynamic route with params', () => {
		const result = matchRoute('/users/42', routes)
		expect(result).not.toBeNull()
		expect(result!.definition.path).toBe('/users/[id]')
		expect(result!.params).toEqual({ id: '42' })
	})

	test('matches catch-all route', () => {
		const result = matchRoute('/posts/2024/hello-world', routes)
		expect(result).not.toBeNull()
		expect(result!.definition.path).toBe('/posts/[...slug]')
		expect(result!.params.slug).toBe('2024/hello-world')
	})

	test('unmatched route falls through to root with unusedPath', () => {
		const result = matchRoute('/unknown/deep/path', routes)
		// `/` matches but leaves unusedPath — Router component filters these out
		expect(result).not.toBeNull()
		expect(result!.definition.path).toBe('/')
		expect(result!.unusedPath).toBe('/unknown/deep/path')
	})
})

describe('routeMatcher (pre-compiled)', () => {
	const routes = [{ path: '/a' as const }, { path: '/b' as const }, { path: '/' as const }]
	const matcher = routeMatcher(routes)

	test('matches different routes on successive calls', () => {
		const a = matcher('/a')
		expect(a).not.toBeNull()
		expect(a!.definition.path).toBe('/a')

		const b = matcher('/b')
		expect(b).not.toBeNull()
		expect(b!.definition.path).toBe('/b')

		const root = matcher('/')
		expect(root).not.toBeNull()
		expect(root!.definition.path).toBe('/')
	})

	test('unmatched path falls through to root with unusedPath', () => {
		const result = matcher('/nope')
		expect(result).not.toBeNull()
		expect(result!.definition.path).toBe('/')
		expect(result!.unusedPath).toBe('/nope')
	})

	test('returns null when no root route exists', () => {
		const noRoot = routeMatcher([{ path: '/a' as const }])
		expect(noRoot('/nope')).toBeNull()
	})
})

describe('linkModel', () => {
	test('defaults underline to true', () => {
		expect(linkModel({}).underline).toBe(true)
	})

	test('underline=false disables it', () => {
		expect(linkModel({ underline: false }).underline).toBe(false)
	})
})

describe('Router reactive view selection', () => {
	test('different definitions produce different identity checks', () => {
		const routes = [
			{ path: '/display' as const, label: 'Display' },
			{ path: '/forms' as const, label: 'Forms' },
			{ path: '/' as const, label: 'Home' },
		]
		const matcher = routeMatcher(routes)

		const home = matcher('/')!
		const display = matcher('/display')!
		const forms = matcher('/forms')!

		// The Router uses definition identity to skip re-render on same route
		expect(home.definition).not.toBe(display.definition)
		expect(display.definition).not.toBe(forms.definition)

		// Same URL → same definition object
		const home2 = matcher('/')!
		expect(home2.definition).toBe(home.definition)
	})
})
