import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createSursautMiddleware } from '../../src/adapters/hono.js'
import { clearRouteTreeCache } from '../../src/adapters/hono.js'
import { expose, type SursautRequest } from '../../src/lib/router/expose.js'

describe('Route API Integration (Hono + expose)', () => {
	beforeEach(() => {
		clearRouteTreeCache()
		// Clean up the global mutation expose applies to itself during import
		;(globalThis as any).__SURSAUT_CURRENT_FILE__ = undefined
		;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = undefined
	})

	it('6.5 Full request lifecycle (Hono -> expose -> middle -> handler)', async () => {
		const middleTrace: string[] = []
		
		const rootMiddle = async (req: any, next: any) => {
			middleTrace.push('root-in')
			const res = await next()
			middleTrace.push('root-out')
			return res
		}

		const app = new Hono()
		app.use('*', createSursautMiddleware({
			routesDir: '/mock/routes',
			globRoutes: {
				'/mock/routes/index.tsx': async () => ({ default: () => 'app' }),
				'/mock/routes/index.ts': async () => {
					;(globalThis as any).__SURSAUT_CURRENT_FILE__ = '/mock/routes/index.ts'
					;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = '/'
					return {
						default: expose({
							middle: [rootMiddle],
							get: async (req: SursautRequest) => ({ hello: 'world' })
						})
					}
				}
			}
		}))

		const res = await app.request('http://localhost/', {
			method: 'GET',
			headers: { accept: 'application/json' }
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ hello: 'world' })
		expect(middleTrace).toEqual(['root-in', 'root-out'])
	})

	it('6.6 SSR cascaded provide loaders (via X-Sursaut-Provide)', async () => {
		const app = new Hono()
		app.use('*', createSursautMiddleware({
			routesDir: '/mock/routes',
			globRoutes: {
				'/mock/routes/index.tsx': async () => ({ default: () => 'app' }),
				'/mock/routes/index.ts': async () => {
					;(globalThis as any).__SURSAUT_CURRENT_FILE__ = '/mock/routes/index.ts'
					;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = '/'
					return {
						default: expose({
							provide: async () => ({ rootData: true })
						})
					}
				},
				'/mock/routes/users/index.ts': async () => {
					;(globalThis as any).__SURSAUT_CURRENT_FILE__ = '/mock/routes/users/index.ts'
					;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = '/users'
					return {
						default: expose({
							provide: async (req: any) => {
								return { merged: true, inherited: req.provide?.rootData }
							}
						})
					}
				}
			}
		}))

		// 6.7 SPA navigation provide fetch (Testing X-Sursaut-Provide header on Hono)
		const res = await app.request('http://localhost/users', {
			method: 'GET',
			headers: {
				accept: 'application/json',
				'X-Sursaut-Provide': 'true'
			}
		})

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ rootData: true, merged: true, inherited: true })
	})
})
