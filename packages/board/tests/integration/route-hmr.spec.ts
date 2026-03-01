import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { clearRouteTreeCache } from '../../src/adapters/hono.js'
import { buildRouteTree } from '../../src/lib/router/index.js'

const TEST_ROUTES_DIR = path.resolve(import.meta.dirname, '../../sandbox/hmr-test-routes')

describe('Route HMR Integration', () => {
	beforeEach(async () => {
		await fs.mkdir(TEST_ROUTES_DIR, { recursive: true })
		await fs.writeFile(
			path.join(TEST_ROUTES_DIR, 'index.tsx'),
			`export default function IndexPage() { return 'index' }`
		)
	})

	afterEach(async () => {
		await fs.rm(TEST_ROUTES_DIR, { recursive: true, force: true })
		clearRouteTreeCache()
	})

	it('should pick up new .tsx routes after rebuild', async () => {
		const tree1 = await buildRouteTree(TEST_ROUTES_DIR)
		expect(tree1.component).toBeDefined()
		expect(tree1.children.has('about')).toBe(false)

		// Add a new route file
		await fs.writeFile(
			path.join(TEST_ROUTES_DIR, 'about.tsx'),
			`export default function AboutPage() { return 'about' }`
		)

		// Rebuild picks up new file
		const tree2 = await buildRouteTree(TEST_ROUTES_DIR)
		expect(tree2.children.has('about')).toBe(true)
		expect(tree2.children.get('about')!.component).toBeDefined()
	})

	it('should re-import modules via importFn', async () => {
		const MockPage = () => 'mock'
		const mockImport = vi.fn().mockResolvedValue({ default: MockPage })

		const tree = await buildRouteTree(TEST_ROUTES_DIR, mockImport)

		expect(mockImport).toHaveBeenCalled()
		expect(tree.component).toBe(MockPage)
	})
})
