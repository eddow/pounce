import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pounceCorePlugin } from '@pounce/plugin/configs'
import { playwright } from '@vitest/browser-playwright'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const isBrowser = process.env.TEST_ENV === 'browser'

export const createBaseConfig = (packageDir: string) => {
	return defineConfig({
		plugins: [
			pounceCorePlugin({
				projectRoot: packageDir,
				jsxRuntime: {
					runtime: 'automatic',
					importSource: '@pounce/core',
				},
			}),
		],
		esbuild: false,
		resolve: {
			alias: {
				'mutts': resolve(rootDir, isBrowser
					? '../../mutts/src/entry-browser.ts'
					: '../../mutts/src/index.ts'),
				'npc-script': resolve(rootDir, '../../npcs/src/index.ts'),
				'omni18n': resolve(rootDir, '../../omni18n/src/client.ts'),
				'pure-glyf': resolve(rootDir, '../../pure-glyf/src/index.ts'),
				'@pounce/core/jsx-runtime': resolve(rootDir, '../packages/core/src/runtime/jsx-runtime.ts'),
				'@pounce/core/jsx-dev-runtime': resolve(rootDir, '../packages/core/src/runtime/jsx-dev-runtime.ts'),
				'@pounce/core/node': resolve(rootDir, '../packages/core/src/node/index.ts'),
				'@pounce/core': resolve(rootDir, isBrowser
					? '../packages/core/src/dom/index.ts'
					: '../packages/core/src/node/index.ts'),
				'@pounce/kit': resolve(rootDir, '../packages/kit/src'),
				'@pounce/ui': resolve(rootDir, '../packages/ui/src'),
				'@pounce/board': resolve(rootDir, '../packages/board/src'),
				'@pounce/plugin': resolve(rootDir, '../packages/plugin/src'),
			},
		},
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
