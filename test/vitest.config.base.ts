import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export const createBaseConfig = (packageDir: string) => {
	return defineConfig({
		resolve: {
			alias: {
				'mutts': resolve(rootDir, '../../mutts/src/index.ts'),
				'npc-script': resolve(rootDir, '../../npcs/src/index.ts'),
				'omni18n': resolve(rootDir, '../../omni18n/src/client.ts'),
				'pure-glyf': resolve(rootDir, '../../pure-glyf/src/index.ts'),
				'@pounce/core/jsx-runtime': resolve(rootDir, '../packages/core/dist/jsx-runtime.js'),
				'@pounce/core/jsx-dev-runtime': resolve(rootDir, '../packages/core/dist/jsx-dev-runtime.js'),
				'@pounce/core/server': resolve(rootDir, '../packages/core/src/node/index.ts'),
				'@pounce/core/node': resolve(rootDir, '../packages/core/src/node/index.ts'),
				'@pounce/core/dom': resolve(rootDir, '../packages/core/src/dom/index.ts'),
				'@pounce/core': resolve(rootDir, '../packages/core/src/node/index.ts'),
				'@pounce/kit': resolve(rootDir, '../packages/kit/src'),
				'@pounce/ui': resolve(rootDir, '../packages/ui/src'),
				'@pounce/board': resolve(rootDir, '../packages/board/src'),
				'@pounce/plugin': resolve(rootDir, '../packages/plugin/src'),
			},
		},
		test: {
			globals: true,
			include: ['**/*.spec.{ts,tsx}'],
			exclude: ['**/node_modules/**', '**/dist/**'],
			resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
			coverage: {
				provider: 'v8',
				reporter: ['text', 'json', 'html'],
				exclude: [
					'node_modules/',
					'tests/',
					'**/*.d.ts',
					'**/*.config.*',
					'**/dist/',
					'**/e2e/',
				],
			},
			server: {
				deps: {
					inline: [/@pounce\//, 'mutts'],
				},
			},
		},
	})
}
