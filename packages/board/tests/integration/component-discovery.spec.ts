import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRouteTree, matchRoute } from 'sursaut-board/server'

const DEMO_APP_ROUTES = path.resolve(import.meta.dirname, '../../demo/routes')

describe('Component Discovery', () => {
	it('should attach index.tsx component to route node', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		
		// Check root node
		expect(tree.component).toBeDefined()
		expect(tree.component.name).toBe('IndexPage')
	})

	it('should match route and return component', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		const match = matchRoute('/', tree)

		expect(match).not.toBeNull()
		expect(match!.component).toBeDefined()
		expect(match!.component.name).toBe('IndexPage')
	})

	it('should attach layout.tsx layout to route node', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		
		// Root should have its own layout
		expect(tree.layout).toBeDefined()
		expect(tree.layout.name).toBe('RootLayout')
	})

	it('should collect layouts from parent directories', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		
		// Get users node (nested)
		const usersNode = tree.children.get('users')!
		expect(usersNode).toBeDefined()
        
        // Match a route inside users
        const match = matchRoute('/users/42', tree)
        expect(match).not.toBeNull()
        
        // Should have layouts from:
        // 1. Root layout.tsx
        // 2. Users layout.tsx
        expect(match!.layouts).toBeDefined()
        expect(match!.layouts!.length).toBeGreaterThanOrEqual(2)
        expect(match!.layouts![0].name).toBe('RootLayout')
        expect(match!.layouts![1].name).toBe('UsersLayout')
	})
	it('should match named route file index.tsx under posts', async () => {
		const tree = await buildRouteTree(DEMO_APP_ROUTES)
		const match = matchRoute('/posts', tree)

		expect(match).not.toBeNull()
		expect(match!.component).toBeDefined()
		expect(match!.component.name).toBe('PostsPage')
	})
})
