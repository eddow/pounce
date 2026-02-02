/**
 * Tests for RequestContext type extension via declaration merging
 */

import { describe, it, expect } from 'vitest'
import type { RequestContext, Middleware, RouteHandler } from '../../src/server/index.js'
import { runMiddlewares } from '@pounce/kit/entry-no-dom'

// Extend RequestContext for testing
declare module '@pounce/kit/entry-no-dom' {
	interface RequestContext {
		user?: {
			id: string
			email: string
			role: 'admin' | 'user'
		}
		session?: {
			id: string
			expiresAt: Date
		}
		testFlag?: boolean
	}
}

describe('RequestContext Extension', () => {
	it('should allow middleware to add custom properties to context', async () => {
		const authMiddleware: Middleware = async (ctx, next) => {
			// TypeScript should recognize ctx.user as valid
			ctx.user = {
				id: '123',
				email: 'test@example.com',
				role: 'admin',
			}
			return next()
		}

		const handler: RouteHandler = async (ctx) => {
			// TypeScript should know about ctx.user
			expect(ctx.user).toBeDefined()
			expect(ctx.user?.id).toBe('123')
			expect(ctx.user?.email).toBe('test@example.com')
			expect(ctx.user?.role).toBe('admin')

			return {
				status: 200,
				data: { userId: ctx.user?.id },
			}
		}

		const context: RequestContext = {
			request: new Request('http://localhost/test'),
			params: {},
		}

		const response = await runMiddlewares([authMiddleware], context, handler)
		expect(response.status).toBe(200)

		const data = await response.json()
		expect(data.userId).toBe('123')
	})

	it('should support multiple middleware adding different context properties', async () => {
		const authMiddleware: Middleware = async (ctx, next) => {
			ctx.user = {
				id: '456',
				email: 'user@example.com',
				role: 'user',
			}
			return next()
		}

		const sessionMiddleware: Middleware = async (ctx, next) => {
			ctx.session = {
				id: 'session-789',
				expiresAt: new Date('2026-12-31'),
			}
			return next()
		}

		const flagMiddleware: Middleware = async (ctx, next) => {
			ctx.testFlag = true
			return next()
		}

		const handler: RouteHandler = async (ctx) => {
			expect(ctx.user).toBeDefined()
			expect(ctx.session).toBeDefined()
			expect(ctx.testFlag).toBe(true)

			return {
				status: 200,
				data: {
					userId: ctx.user?.id,
					sessionId: ctx.session?.id,
					flag: ctx.testFlag,
				},
			}
		}

		const context: RequestContext = {
			request: new Request('http://localhost/test'),
			params: {},
		}

		const response = await runMiddlewares(
			[authMiddleware, sessionMiddleware, flagMiddleware],
			context,
			handler
		)

		const data = await response.json()
		expect(data.userId).toBe('456')
		expect(data.sessionId).toBe('session-789')
		expect(data.flag).toBe(true)
	})

	it('should handle optional context properties gracefully', async () => {
		const handler: RouteHandler = async (ctx) => {
			// Properties should be optional - no user set
			expect(ctx.user).toBeUndefined()
			expect(ctx.session).toBeUndefined()

			return {
				status: 200,
				data: { hasUser: !!ctx.user },
			}
		}

		const context: RequestContext = {
			request: new Request('http://localhost/test'),
			params: {},
		}

		const response = await runMiddlewares([], context, handler)
		const data = await response.json()
		expect(data.hasUser).toBe(false)
	})

	it('should support type guards for required context properties', async () => {
		function requireAuth(
			ctx: RequestContext
		): asserts ctx is RequestContext & { user: NonNullable<RequestContext['user']> } {
			if (!ctx.user) {
				throw new Error('Unauthorized')
			}
		}

		const authMiddleware: Middleware = async (ctx, next) => {
			ctx.user = {
				id: '999',
				email: 'admin@example.com',
				role: 'admin',
			}
			return next()
		}

		const handler: RouteHandler = async (ctx) => {
			requireAuth(ctx)
			// After type guard, ctx.user is guaranteed to be defined
			const userId: string = ctx.user.id // No optional chaining needed

			return {
				status: 200,
				data: { userId },
			}
		}

		const context: RequestContext = {
			request: new Request('http://localhost/test'),
			params: {},
		}

		const response = await runMiddlewares([authMiddleware], context, handler)
		const data = await response.json()
		expect(data.userId).toBe('999')
	})

	it('should throw error when type guard fails', async () => {
		function requireAuth(
			ctx: RequestContext
		): asserts ctx is RequestContext & { user: NonNullable<RequestContext['user']> } {
			if (!ctx.user) {
				throw new Error('Unauthorized')
			}
		}

		const handler: RouteHandler = async (ctx) => {
			expect(() => requireAuth(ctx)).toThrow('Unauthorized')

			return {
				status: 401,
				error: 'Unauthorized',
			}
		}

		const context: RequestContext = {
			request: new Request('http://localhost/test'),
			params: {},
		}

		const response = await runMiddlewares([], context, handler)
		expect(response.status).toBe(401)
	})

	it('should preserve base RequestContext properties', async () => {
		const handler: RouteHandler = async (ctx) => {
			// Base properties should always be available
			expect(ctx.request).toBeInstanceOf(Request)
			expect(ctx.params).toBeDefined()
			expect(typeof ctx.params).toBe('object')

			return {
				status: 200,
				data: { ok: true },
			}
		}

		const context: RequestContext = {
			request: new Request('http://localhost/test'),
			params: { id: '123' },
		}

		const response = await runMiddlewares([], context, handler)
		expect(response.status).toBe(200)
	})
})
