import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pounceCorePlugin } from '../packages/core/src/plugin/index'
import { playwright } from '@vitest/browser-playwright'

// @ts-expect-error Leave vite do his stuffs
const rootDir = fileURLToPath(new URL('.', import.meta.url))
const isBrowser = process.env.TEST_ENV === 'browser'

const workspaceRoot = resolve(rootDir, '..')
export const createBaseConfig = (packageDir: string) => {
	return defineConfig({
		plugins: [
			pounceCorePlugin({
				projectRoot: workspaceRoot,
			}),
		],
		esbuild: false,
		resolve: {
			alias: {
				'mutts/debug': resolve(workspaceRoot, '../mutts/debug/index.ts'),
				'mutts': resolve(workspaceRoot, isBrowser
					? '../mutts/src/entry-browser.dev.ts'
					: '../mutts/src/entry-node.dev.ts'),
				'pure-glyf': resolve(workspaceRoot, 'packages/pure-glyf/src/index.ts'),
				'@pounce/core/node': resolve(workspaceRoot, 'packages/core/src/node/index.ts'),
				'@pounce/core': resolve(workspaceRoot, isBrowser
					? 'packages/core/src/dom/index.ts'
					: 'packages/core/src/node/index.ts'),
				'@pounce/kit': resolve(workspaceRoot, 'packages/kit/src'),
				'@pounce/ui': resolve(workspaceRoot, 'packages/ui/src'),
				'@pounce/board': resolve(workspaceRoot, 'packages/board/src'),
				'@pounce/core/plugin': resolve(workspaceRoot, 'packages/core/src/plugin/index.ts'),
			},
		},
		root: packageDir,
		test: {
			include: ['**/*.spec.{ts,tsx}'],
			exclude: ['**/node_modules/**', '**/dist/**'],
			resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
			browser: {
				enabled: isBrowser,
				headless: true,
				instances: [{
					browser: 'chromium',
					provider: playwright({
						launchOptions: { channel: 'chrome' },
					}),
				}],
			},
		},
	})
}
