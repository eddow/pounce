import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRouteTree, matchRoute, parseSegment, type RouteTreeNode } from './index.js'

describe('router', () => {
	describe('parseSegment', () => {
		it('should parse static segments', () => {
			const result = parseSegment('users')
			expect(result).toEqual({
				isDynamic: false,
				isCatchAll: false,
				normalizedSegment: 'users',
			})
		})

		it('should parse dynamic segments [id]', () => {
			const result = parseSegment('[id]')
			expect(result).toEqual({
				isDynamic: true,
				isCatchAll: false,
				paramName: 'id',
				normalizedSegment: '[id]',
			})
		})

		it('should parse catch-all segments [...slug]', () => {
			const result = parseSegment('[...slug]')
			expect(result).toEqual({
				isDynamic: true,
				isCatchAll: true,
				paramName: 'slug',
				normalizedSegment: '[...slug]',
			})
		})
	})

	describe('matchRoute', () => {
		// Mock component for UI route matching
		const MockComponent = () => 'mock'

		it('should match static root route with component', () => {
			const tree: RouteTreeNode = {
				segment: '',
				isDynamic: false,
				isCatchAll: false,
				children: new Map(),
				component: MockComponent,
			}

			const match = matchRoute('/', tree)
			expect(match).not.toBeNull()
			expect(match?.path).toBe('/')
			expect(match?.params).toEqual({})
			expect(match?.component).toBe(MockComponent)
		})

		it('should match static nested route', () => {
			const usersNode: RouteTreeNode = {
				segment: 'users',
				isDynamic: false,
				isCatchAll: false,
				children: new Map(),
				component: MockComponent,
			}

			const tree: RouteTreeNode = {
				segment: '',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([['users', usersNode]]),
			}

			const match = matchRoute('/users', tree)
			expect(match).not.toBeNull()
			expect(match?.path).toBe('/users')
			expect(match?.params).toEqual({})
		})

		it('should match dynamic route and extract param', () => {
			const idNode: RouteTreeNode = {
				segment: '[id]',
				isDynamic: true,
				isCatchAll: false,
				paramName: 'id',
				children: new Map(),
				component: MockComponent,
			}

			const usersNode: RouteTreeNode = {
				segment: 'users',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([['[id]', idNode]]),
			}

			const tree: RouteTreeNode = {
				segment: '',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([['users', usersNode]]),
			}

			const match = matchRoute('/users/123', tree)
			expect(match).not.toBeNull()
			expect(match?.params).toEqual({ id: '123' })
		})

		it('should prioritize static routes over dynamic routes', () => {
			const newNode: RouteTreeNode = {
				segment: 'new',
				isDynamic: false,
				isCatchAll: false,
				children: new Map(),
				component: MockComponent,
			}

			const idNode: RouteTreeNode = {
				segment: '[id]',
				isDynamic: true,
				isCatchAll: false,
				paramName: 'id',
				children: new Map(),
				component: MockComponent,
			}

			const usersNode: RouteTreeNode = {
				segment: 'users',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([
					['[id]', idNode],
					['new', newNode],
				]),
			}

			const tree: RouteTreeNode = {
				segment: '',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([['users', usersNode]]),
			}

			// Should match static "new" route, not dynamic [id]
			const match = matchRoute('/users/new', tree)
			expect(match).not.toBeNull()
			expect(match?.params).toEqual({})
		})

		it('should match catch-all route and capture remaining segments', () => {
			const slugNode: RouteTreeNode = {
				segment: '[...slug]',
				isDynamic: true,
				isCatchAll: true,
				paramName: 'slug',
				children: new Map(),
				component: MockComponent,
			}

			const docsNode: RouteTreeNode = {
				segment: 'docs',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([['[...slug]', slugNode]]),
			}

			const tree: RouteTreeNode = {
				segment: '',
				isDynamic: false,
				isCatchAll: false,
				children: new Map([['docs', docsNode]]),
			}

			const match = matchRoute('/docs/api/users/create', tree)
			expect(match).not.toBeNull()
			expect(match?.params).toEqual({ slug: 'api/users/create' })
		})

		it('should return null for non-existent routes', () => {
			const tree: RouteTreeNode = {
				segment: '',
				isDynamic: false,
				isCatchAll: false,
				children: new Map(),
			}

			const match = matchRoute('/nonexistent', tree)
			expect(match).toBeNull()
		})
	})

	describe('buildRouteTree', () => {
		it('should build tree from globRoutes with .tsx components', async () => {
			const MockPage = () => 'page'
			const globRoutes = {
				'/routes/index.tsx': async () => ({ default: MockPage }),
				'/routes/users/[id]/index.tsx': async () => ({ default: MockPage }),
				'/routes/users/[id]/types.d.ts': async () => ({}),
			}

			const tree = await buildRouteTree('/routes', undefined, globRoutes)

			expect(tree.component).toBe(MockPage)

			const usersNode = tree.children.get('users')
			const idNode = usersNode?.children.get('[id]')

			expect(idNode).toBeDefined()
			expect(idNode?.component).toBe(MockPage)
			expect(idNode?.types).toBe('/routes/users/[id]/types.d.ts')
		})

		it('should handle named type files', async () => {
			const MockPage = () => 'page'
			const globRoutes = {
				'/routes/users.tsx': async () => ({ default: MockPage }),
				'/routes/users.d.ts': async () => ({}),
			}

			const tree = await buildRouteTree('/routes', undefined, globRoutes)

			const usersNode = tree.children.get('users')
			expect(usersNode).toBeDefined()
			expect(usersNode?.component).toBe(MockPage)
			expect(usersNode?.types).toBe('/routes/users.d.ts')
		})

		it('should ignore +* files and directories when using globRoutes', async () => {
			const RootPage = () => 'root'
			const UsersPage = () => 'users'
			const PrivatePage = () => 'private'
			const globRoutes = {
				'/routes/index.tsx': async () => ({ default: RootPage }),
				'/routes/users/index.tsx': async () => ({ default: UsersPage }),
				'/routes/+private.tsx': async () => ({ default: PrivatePage }),
				'/routes/+components/button.tsx': async () => ({ default: PrivatePage }),
				'/routes/users/+components/card.tsx': async () => ({ default: PrivatePage }),
			}

			const tree = await buildRouteTree('/routes', undefined, globRoutes)

			expect(tree.component).toBe(RootPage)
			expect(tree.children.has('+private')).toBe(false)
			expect(tree.children.has('+components')).toBe(false)

			const usersNode = tree.children.get('users')
			expect(usersNode?.component).toBe(UsersPage)
			expect(usersNode?.children.has('+components')).toBe(false)
		})

		it('should ignore +* files and directories when using filesystem scan', async () => {
			const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sursaut-board-routes-'))

			try {
				await fs.writeFile(
					path.join(tempRoot, 'index.tsx'),
					'export default function Root() { return null }'
				)
				await fs.mkdir(path.join(tempRoot, 'users'), { recursive: true })
				await fs.writeFile(
					path.join(tempRoot, 'users', 'index.tsx'),
					'export default function Users() { return null }'
				)
				await fs.writeFile(
					path.join(tempRoot, '+private.tsx'),
					'export default function Private() { return null }'
				)
				await fs.mkdir(path.join(tempRoot, '+components'), { recursive: true })
				await fs.writeFile(
					path.join(tempRoot, '+components', 'button.tsx'),
					'export default function Button() { return null }'
				)

				const tree = await buildRouteTree(tempRoot)

				expect(tree.component).toBeTypeOf('function')
				expect(tree.children.has('+private')).toBe(false)
				expect(tree.children.has('+components')).toBe(false)
				expect(tree.children.get('users')?.component).toBeTypeOf('function')
			} finally {
				await fs.rm(tempRoot, { recursive: true, force: true })
			}
		})
	})
})
