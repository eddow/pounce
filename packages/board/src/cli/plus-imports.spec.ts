import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolvePlusImport } from './plus-imports.js'

describe('resolvePlusImport', () => {
	it('resolves nearest +bucket from importer directory upward', async () => {
		const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sursaut-plus-imports-'))
		const routesDir = path.join(projectRoot, 'routes')
		const nestedDir = path.join(routesDir, 'users', '[id]')

		try {
			await fs.mkdir(path.join(routesDir, '+components'), { recursive: true })
			await fs.mkdir(path.join(routesDir, 'users', '+components'), { recursive: true })
			await fs.mkdir(nestedDir, { recursive: true })

			await fs.writeFile(
				path.join(routesDir, '+components', 'button.tsx'),
				'export const marker = 1'
			)
			await fs.writeFile(
				path.join(routesDir, 'users', '+components', 'button.tsx'),
				'export const marker = 2'
			)
			await fs.writeFile(
				path.join(nestedDir, 'index.tsx'),
				'export default function Page() { return null }'
			)

			const importer = path.join(nestedDir, 'index.tsx')
			const resolved = resolvePlusImport('+components/button', importer, {
				routesDir,
				projectRoot,
			})

			expect(resolved).toBe(path.join(routesDir, 'users', '+components', 'button.tsx'))
		} finally {
			await fs.rm(projectRoot, { recursive: true, force: true })
		}
	})

	it('does not resolve + imports for files outside routesDir', async () => {
		const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sursaut-plus-imports-'))
		const routesDir = path.join(projectRoot, 'routes')
		const externalFile = path.join(projectRoot, 'outside.ts')

		try {
			await fs.mkdir(path.join(routesDir, '+components'), { recursive: true })
			await fs.writeFile(
				path.join(routesDir, '+components', 'button.tsx'),
				'export const marker = true'
			)
			await fs.writeFile(externalFile, 'export const external = true')

			const resolved = resolvePlusImport('+components/button', externalFile, {
				routesDir,
				projectRoot,
			})

			expect(resolved).toBeNull()
		} finally {
			await fs.rm(projectRoot, { recursive: true, force: true })
		}
	})

	it('resolves +bucket root import to index file', async () => {
		const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'sursaut-plus-imports-'))
		const routesDir = path.join(projectRoot, 'routes')
		const importer = path.join(routesDir, 'index.tsx')

		try {
			await fs.mkdir(path.join(routesDir, '+shared'), { recursive: true })
			await fs.writeFile(path.join(routesDir, '+shared', 'index.ts'), 'export const shared = true')
			await fs.writeFile(importer, 'export default function Home() { return null }')

			const resolved = resolvePlusImport('+shared', importer, {
				routesDir,
				projectRoot,
			})

			expect(resolved).toBe(path.join(routesDir, '+shared', 'index.ts'))
		} finally {
			await fs.rm(projectRoot, { recursive: true, force: true })
		}
	})
})
