/**
 * Unit tests for Hono adapter
 */

import * as path from 'node:path'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearRouteTreeCache, createSursautMiddleware } from './hono.js'

const TEST_ROUTES_DIR = path.resolve(__dirname, '../../demo/routes')

describe('Hono Adapter', () => {
	beforeEach(() => {
		clearRouteTreeCache()
	})

	afterEach(() => {
		clearRouteTreeCache()
	})

	describe('createSursautMiddleware', () => {
		it('should pass through to next Hono handler', async () => {
			const app = new Hono()
			app.use('*', createSursautMiddleware({ routesDir: TEST_ROUTES_DIR }))
			app.get('/hello', (c) => c.text('Hello handler'))

			const res = await app.request('http://localhost/hello')
			expect(res.status).toBe(200)
			expect(await res.text()).toBe('Hello handler')
		})

		it('should return 404 for unmatched routes with no fallback', async () => {
			const app = new Hono()
			app.use('*', createSursautMiddleware({ routesDir: TEST_ROUTES_DIR }))

			const res = await app.request('http://localhost/does-not-exist')
			expect(res.status).toBe(404)
		})

		it('should cache route tree for same routesDir', async () => {
			const app = new Hono()
			app.use('*', createSursautMiddleware({ routesDir: TEST_ROUTES_DIR }))
			app.get('/', (c) => c.text('ok'))

			// First request builds the tree
			await app.request('http://localhost/')
			// Second request should use cached tree
			const res = await app.request('http://localhost/')

			expect(res.status).toBe(200)
		})
	})
})
