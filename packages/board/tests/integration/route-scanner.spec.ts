import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRouteTree, matchRoute } from '../../src/lib/router/index.js'

const DEMO_APP_ROUTES = path.resolve(import.meta.dirname, '../../demo/routes')

describe('buildRouteTree', () => {
	it('should scan demo-app routes directory and build tree', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)

		// Root should exist
		expect(tree).toBeDefined()
		expect(tree.segment).toBe('')

		// Should have root component from index.tsx
		expect(tree.component).toBeDefined()

		// Should have users child
		expect(tree.children.has('users')).toBe(true)
		const usersNode = tree.children.get('users')!
		expect(usersNode.segment).toBe('users')

		// Should have dynamic [id] child under users
		expect(usersNode.children.has('[id]')).toBe(true)
		const idNode = usersNode.children.get('[id]')!
		expect(idNode.isDynamic).toBe(true)
		expect(idNode.paramName).toBe('id')
		// [id] has index.tsx -> component
		expect(idNode.component).toBeDefined()
	})

	it('should match / route and return component', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		const match = matchRoute('/', tree)

		expect(match).not.toBeNull()
		expect(match!.path).toBe('/')
		expect(match!.component).toBeDefined()
	})

	it('should match /users/123 with params and layouts', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		const match = matchRoute('/users/123', tree)

		expect(match).not.toBeNull()
		expect(match!.params).toEqual({ id: '123' })
		expect(match!.component).toBeDefined()
		// Should inherit layouts from parent layout.tsx files
		expect(match!.layouts).toBeDefined()
		expect(match!.layouts!.length).toBeGreaterThanOrEqual(1)
	})

	it('should record .d.ts file paths', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		const usersNode = tree.children.get('users')!
		const idNode = usersNode.children.get('[id]')!

		// types.d.ts exists in users/[id]/, should be recorded in idNode.types
		expect(idNode.types).toBeDefined()
		expect(idNode.types).toContain('types.d.ts')
		
		// It should NOT be a route child
		expect(idNode.children.has('types')).toBe(false)
	})
})
