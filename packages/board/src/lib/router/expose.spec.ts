import { beforeEach, describe, expect, it } from 'vitest'
import {
	clearExposeRegistry,
	expose,
	fileRegistry,
	routeRegistry,
	type SursautRequest,
} from './expose.js'

describe('expose() Runtime', () => {
	beforeEach(() => {
		clearExposeRegistry()
		// Mock out current file globals for accurate routing simulation
		;(globalThis as any).__SURSAUT_CURRENT_FILE__ = '/mock/routes/index.ts'
		;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = '/'
	})

	it('6.1: Flattens a config tree with sub-branches and verbs', () => {
		expose({
			get: async (): Promise<string> => 'root',
			'/users': {
				get: async (): Promise<string> => 'users',
				'/active': {
					post: async (): Promise<string> => 'active',
				},
			},
		})

		expect(routeRegistry.size).toBe(3)
		expect(routeRegistry.get('/')?.endpoints.get('get')).toBeDefined()
		expect(routeRegistry.get('/users')?.endpoints.get('get')).toBeDefined()
		expect(routeRegistry.get('/users/active')?.endpoints.get('post')).toBeDefined()
	})

	it('6.2: RouteRegistry handles dynamic segments properly', () => {
		expose({
			'/[id]': {
				get: async (): Promise<string> => 'get-id',
			},
		})
		expect(routeRegistry.has('/[id]')).toBe(true)
	})

	it('6.3: Cross-tree middle inheritance cascades correctly', () => {
		const rootMiddle = async (req: any, next: any) => next()
		const subMiddle = async (req: any, next: any) => next()

		expose({
			middle: [rootMiddle],
			get: async (): Promise<string> => 'root',
		})

		;(globalThis as any).__SURSAUT_CURRENT_FILE__ = '/mock/routes/users.ts'
		;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = '/users'

		expose({
			middle: [subMiddle],
			get: async (): Promise<string> => 'users leaf',
			'/child': {
				post: async (): Promise<string> => 'child leaf',
			},
		})

		// Check root
		expect(routeRegistry.get('/')?.middle).toEqual([rootMiddle])

		// Check users (inherits root + sub)
		expect(routeRegistry.get('/users')?.middle).toEqual([rootMiddle, subMiddle])

		// Check child (inherits root + sub across physical dir path internally)
		expect(routeRegistry.get('/users/child')?.middle).toEqual([rootMiddle, subMiddle])
	})

	it('6.4: Cross-tree provide cascading and merging works', async () => {
		const rootProvide = async (req: any) => ({ user: 'admin', rootLevel: true })
		expose({
			provide: rootProvide,
		})

		;(globalThis as any).__SURSAUT_CURRENT_FILE__ = '/mock/routes/dashboard.ts'
		;(globalThis as any).__SURSAUT_CURRENT_BASE_URL__ = '/dashboard'

		expose({
			provide: async (req: any) => {
				const parentProvide = req.provide
				expect(parentProvide.user).toBe('admin')
				return { dashboardLevel: true, title: 'Panel' }
			},
			get: async (): Promise<string> => 'dash',
		})

		const composedProvideFn = routeRegistry.get('/dashboard')?.provide
		expect(composedProvideFn).toBeDefined()

		const reqObj: Partial<SursautRequest> = { params: {} as any }
		const resolvedState = await composedProvideFn(reqObj as SursautRequest)

		// The resulting state must be merged parent + child
		expect(resolvedState).toEqual({
			user: 'admin',
			rootLevel: true,
			dashboardLevel: true,
			title: 'Panel',
		})
		// And the request MUST have had parent data wired to `req.provide` during execution
		expect((reqObj as any).provide).toEqual({ user: 'admin', rootLevel: true })
	})
})
