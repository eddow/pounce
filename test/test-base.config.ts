import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pounceCorePlugin } from '../packages/core/src/plugin/index'
import { playwright } from '@vitest/browser-playwright'

// @ts-expect-error Leave vite do his stuffs
const rootDir = fileURLToPath(new URL('.', import.meta.url))
const isBrowser = process.env.TEST_ENV === 'browser'

export const createBaseConfig = (packageDir: string) => {
	return defineConfig({
		plugins: [
			pounceCorePlugin({
				projectRoot: packageDir,
			}),
		],
		esbuild: false,
		resolve: {
			alias: {
				'mutts/debug': resolve(rootDir, '../../mutts/debug/index.ts'),
				'mutts': resolve(rootDir, isBrowser
					? '../../mutts/src/entry-browser.dev.ts'
					: '../../mutts/src/entry-node.dev.ts'),
				'pure-glyf': resolve(rootDir, '../packages/pure-glyf/src/index.ts'),
				'@pounce/core/node': resolve(rootDir, '../packages/core/src/node/index.ts'),
				'@pounce/core': resolve(rootDir, isBrowser
					? '../packages/core/src/dom/index.ts'
					: '../packages/core/src/node/index.ts'),
				'@pounce/kit': resolve(rootDir, '../packages/kit/src'),
				'@pounce/ui': resolve(rootDir, '../packages/ui/src'),
				'@pounce/board': resolve(rootDir, '../packages/board/src'),
				'@pounce/core/plugin': resolve(rootDir, '../packages/core/src/plugin/index.ts'),
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
